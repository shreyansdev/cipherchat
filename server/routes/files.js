import express from 'express';
import multer from 'multer';
import mime from 'mime-types';
import crypto from 'crypto';
import { saveFile, storeFileMetadata, getFileMetadata, getFilePath, deleteFile } from '../services/fileService.js';
import { getRoomData, verifyRoomPassword } from '../services/roomService.js';
import redisClient from '../config/redis.js';
import logger from '../lib/logger.js';

const router = express.Router();

const MAX_ROOM_STORAGE_BYTES = 50 * 1024 * 1024; // 50MB per room cumulative quota

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
  fileFilter: (req, file, cb) => {
    // Allow images, documents, and client-encrypted octet-stream blobs
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/octet-stream',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'));
    }
  },
});

/**
 * Upload file endpoint
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      logger.warn('File upload attempt with no file');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const roomName = req.headers['x-room-name'];
    if (!roomName || typeof roomName !== 'string' || !/^[a-z0-9_-]+$/i.test(roomName.trim())) {
      logger.warn({ roomName }, 'File upload attempt with invalid room name');
      return res.status(400).json({ error: 'Valid room name is required' });
    }
    const sanitizedRoomName = roomName.trim().toLowerCase();

    // Verify room exists in Redis before proceeding
    const roomData = await getRoomData(sanitizedRoomName);
    if (!roomData) {
      logger.warn({ roomName: sanitizedRoomName }, 'File upload rejected: Room not found or expired');
      return res.status(404).json({ error: 'Room not found or expired' });
    }

    // Check cumulative room storage quota (max 50MB per room)
    const currentRoomStorage = await redisClient.get(`room:${sanitizedRoomName}:storage_bytes`);
    if ((parseInt(currentRoomStorage || '0', 10) + req.file.size) > MAX_ROOM_STORAGE_BYTES) {
      logger.warn({ roomName: sanitizedRoomName }, 'File upload rejected: Room storage quota exceeded');
      return res.status(413).json({ error: 'Room storage quota exceeded (max 50MB per room)' });
    }

    // If room is password protected, verify room password header
    if (roomData.passwordHash && roomData.passwordHash !== '') {
      const roomPassword = req.headers['x-room-password'];
      if (!roomPassword || typeof roomPassword !== 'string') {
        logger.warn({ roomName: sanitizedRoomName }, 'File upload rejected: Password required');
        return res.status(401).json({ error: 'Password required' });
      }
      const isPasswordValid = await verifyRoomPassword(sanitizedRoomName, roomPassword);
      if (!isPasswordValid) {
        logger.warn({ roomName: sanitizedRoomName }, 'File upload rejected: Invalid password');
        return res.status(401).json({ error: 'Invalid room password' });
      }
    }

    const fileId = 'file-' + crypto.randomBytes(16).toString('hex');
    const saveResult = await saveFile(req.file, fileId);

    if (!saveResult || !saveResult.filename) {
      logger.error({ fileId, roomName: sanitizedRoomName }, 'Failed to save file to disk');
      return res.status(500).json({ error: 'Failed to save file' });
    }

    const { filename } = saveResult;

    // Determine media type
    const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'file';

    // Store metadata in Redis
    const metadata = {
      fileId,
      filename,
      roomName: sanitizedRoomName,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size.toString(),
      mediaType,
      uploadedAt: Date.now().toString(),
    };

    const metadataStored = await storeFileMetadata(fileId, metadata, sanitizedRoomName);
    if (!metadataStored) {
      logger.error({ fileId, roomName: sanitizedRoomName }, 'Failed to store file metadata in Redis');
      await deleteFile(filename);
      return res.status(500).json({ error: 'Failed to save file metadata' });
    }

    // Update cumulative room storage bytes in Redis
    try {
      const storageKey = `room:${sanitizedRoomName}:storage_bytes`;
      await redisClient.incrBy(storageKey, req.file.size);
      const ttl = await redisClient.ttl(`room:${sanitizedRoomName}:meta`);
      if (ttl > 0) {
        await redisClient.expire(storageKey, ttl);
      }
    } catch (storageErr) {
      logger.warn({ storageErr, roomName: sanitizedRoomName }, 'Error updating room storage counter');
    }

    logger.info({ fileId, roomName: sanitizedRoomName, mediaType, size: req.file.size }, 'File uploaded successfully');

    res.json({
      success: true,
      fileId,
      filename,
      mediaType,
      url: `/api/files/${fileId}`,
    });
  } catch (error) {
    logger.error(error, 'File upload error');
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
});

/**
 * Serve file endpoint
 */
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!fileId || typeof fileId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const metadata = await getFileMetadata(fileId);

    if (!metadata || !metadata.filename) {
      logger.warn({ fileId }, 'File serve attempt: File not found');
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify room has not expired and enforce password check if protected
    if (metadata.roomName) {
      const roomData = await getRoomData(metadata.roomName);
      if (!roomData) {
        logger.warn({ fileId, roomName: metadata.roomName }, 'File serve rejected: Room expired or deleted');
        return res.status(404).json({ error: 'File not found or expired' });
      }

      // If room is password protected, require password via header only (prevent query param leakage)
      if (roomData.passwordHash && roomData.passwordHash !== '') {
        const roomPassword = req.headers['x-room-password'];
        if (!roomPassword || typeof roomPassword !== 'string') {
          logger.warn({ fileId, roomName: metadata.roomName }, 'File serve rejected: Password required');
          return res.status(401).json({ error: 'Password required' });
        }
        const isPasswordValid = await verifyRoomPassword(metadata.roomName, roomPassword);
        if (!isPasswordValid) {
          logger.warn({ fileId, roomName: metadata.roomName }, 'File serve rejected: Invalid password');
          return res.status(401).json({ error: 'Invalid room password' });
        }
      }
    }

    const filepath = getFilePath(metadata.filename);
    const mimetype = metadata.mimetype || mime.lookup(metadata.filename) || 'application/octet-stream';
    const safeOriginalName = (metadata.originalName || 'file').replace(/["\r\n\\]/g, '');
    const isImage = mimetype.startsWith('image/');

    res.setHeader('Content-Type', mimetype);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('Content-Disposition', `${isImage ? 'inline' : 'attachment'}; filename="${safeOriginalName}"`);
    res.sendFile(filepath);
  } catch (error) {
    logger.error({ error, fileId: req.params.fileId }, 'File serve error');
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

export default router;
