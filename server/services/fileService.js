import redisClient from '../config/redis.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 * Store file metadata in Redis and associate with room
 */
export const storeFileMetadata = async (fileId, metadata, roomName) => {
  try {
    const fileKey = `file:${fileId}`;
    const metaKey = `room:${roomName}:meta`;
    const filesKey = `room:${roomName}:files`;
    
    const args = Object.entries(metadata).flat().map(v => String(v));
    const result = await redisClient.storeFileMetadata(
      [fileKey, metaKey],
      args
    );
    
    if (result === 1 && metadata.filename) {
      if (typeof redisClient.sAdd === 'function') {
        await redisClient.sAdd(filesKey, metadata.filename);
      }
      if (typeof redisClient.ttl === 'function' && typeof redisClient.expire === 'function') {
        const ttl = await redisClient.ttl(metaKey);
        if (ttl > 0) {
          await redisClient.expire(filesKey, ttl);
        }
      }
    }
    
    return result === 1;
  } catch (error) {
    logger.error({ error, fileId, roomName }, 'Error storing file metadata');
    return false;
  }
};

/**
 * Delete all physical files associated with a room from disk
 */
export const deleteRoomFiles = async (roomName) => {
  try {
    const slug = (roomName || '').trim().toLowerCase();
    const filesKey = `room:${slug}:files`;
    if (typeof redisClient.sMembers === 'function') {
      const filenames = await redisClient.sMembers(filesKey);
      if (Array.isArray(filenames)) {
        for (const filename of filenames) {
          await deleteFile(filename);
        }
      }
      if (typeof redisClient.del === 'function') {
        await redisClient.del(filesKey);
      }
    }
    return true;
  } catch (error) {
    logger.error({ error, roomName }, 'Error deleting room files from disk');
    return false;
  }
};

/**
 * Prune files on disk whose Redis metadata or room has expired
 */
export const cleanupOrphanedFiles = async () => {
  try {
    await ensureUploadsDir();
    const entries = await fs.readdir(UPLOADS_DIR);
    for (const filename of entries) {
      if (filename === '.gitkeep') continue;
      const match = filename.match(/^(file-[a-zA-Z0-9_-]+)/);
      if (match) {
        const fileId = match[1];
        const meta = await getFileMetadata(fileId);
        if (!meta || Object.keys(meta).length === 0) {
          logger.info({ filename }, 'Pruning expired ephemeral file from disk');
          await deleteFile(filename);
        }
      }
    }
  } catch (error) {
    logger.error(error, 'Error running cleanupOrphanedFiles');
  }
};

// Periodic ephemeral file cleaner (runs every 10 minutes)
const fileCleanupInterval = setInterval(() => {
  cleanupOrphanedFiles().catch((err) => logger.error(err, 'Periodic file cleanup error'));
}, 10 * 60 * 1000);
fileCleanupInterval.unref();

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

const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
]);

/**
 * Save uploaded file to disk
 */
export const saveFile = async (file, fileId) => {
  try {
    await ensureUploadsDir();
    const rawExt = path.extname(file.originalname || '').toLowerCase();
    const ext = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : '';
    const safeFileId = path.basename(fileId).replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `${safeFileId}${ext}`;
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
 * Get file path safely within uploads directory
 */
export const getFilePath = (filename) => {
  const safeFilename = path.basename(filename);
  return path.join(UPLOADS_DIR, safeFilename);
};
