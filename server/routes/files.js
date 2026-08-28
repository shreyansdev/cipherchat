import express from 'express';
import multer from 'multer';
import mime from 'mime-types';
import { saveFile, storeFileMetadata, getFileMetadata, getFilePath, deleteFile } from '../services/fileService.js';
import logger from '../lib/logger.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common document types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
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

    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const { filename } = await saveFile(req.file, fileId);

    if (!filename) {
      logger.error({ fileId, roomName: sanitizedRoomName }, 'Failed to save file to disk');
      return res.status(500).json({ error: 'Failed to save file' });
    }

    // Determine media type
    const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'file';

    // Store metadata in Redis
    const metadata = {
      fileId,
      filename,
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
    const metadata = await getFileMetadata(fileId);

    if (!metadata || !metadata.filename) {
      logger.warn({ fileId }, 'File serve attempt: File not found');
      return res.status(404).json({ error: 'File not found' });
    }

    const filepath = getFilePath(metadata.filename);
    const mimetype = metadata.mimetype || mime.lookup(metadata.filename) || 'application/octet-stream';
    const safeOriginalName = (metadata.originalName || 'file').replace(/["\r\n\\]/g, '');

    res.setHeader('Content-Type', mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${safeOriginalName}"`);
    res.sendFile(filepath);
  } catch (error) {
    logger.error({ error, fileId: req.params.fileId }, 'File serve error');
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

export default router;
