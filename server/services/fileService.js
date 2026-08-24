import redisClient from '../config/redis.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MESSAGE_TTL = parseInt(process.env.MESSAGE_TTL) || 3600; // 1 hour
const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Ensure uploads directory exists
async function ensureUploadsDir() {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Store file metadata in Redis
 */
export const storeFileMetadata = async (fileId, metadata, roomName) => {
  try {
    const fileKey = `file:${fileId}`;
    const metaKey = `room:${roomName}:meta`;
    
    const args = Object.entries(metadata).flat().map(v => String(v));
    const result = await redisClient.storeFileMetadata(
      [fileKey, metaKey],
      args
    );
    
    return result === 1;
  } catch (error) {
    logger.error({ error, fileId, roomName }, 'Error storing file metadata');
    return false;
  }
};

/**
 * Get file metadata from Redis
 */
export const getFileMetadata = async (fileId) => {
  try {
    const fileKey = `file:${fileId}`;
    const metadata = await redisClient.hGetAll(fileKey);
    return metadata;
  } catch (error) {
    logger.error({ error, fileId }, 'Error getting file metadata');
    return null;
  }
};

/**
 * Save uploaded file to disk
 */
export const saveFile = async (file, fileId) => {
  try {
    await ensureUploadsDir();
    const ext = path.extname(file.originalname);
    const filename = `${fileId}${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);
    
    await fs.writeFile(filepath, file.buffer);
    return { filename, filepath };
  } catch (error) {
    logger.error({ error, fileId }, 'Error saving file');
    return null;
  }
};

/**
 * Delete file from disk
 */
export const deleteFile = async (filename) => {
  try {
    const filepath = path.join(UPLOADS_DIR, filename);
    await fs.unlink(filepath);
    return true;
  } catch (error) {
    logger.error({ error, filename }, 'Error deleting file');
    return false;
  }
};

/**
 * Get file path
 */
export const getFilePath = (filename) => {
  return path.join(UPLOADS_DIR, filename);
};
