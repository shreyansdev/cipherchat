import bcrypt from 'bcrypt';
import redisClient from '../config/redis.js';
import logger from '../lib/logger.js';
import crypto from 'crypto';
import { adjectives, nouns } from '../lib/wordlist.js';
import { addUser, removeUser, getRoomUsersList } from './presenceService.js';

const BCRYPT_COST = parseInt(process.env.BCRYPT_COST) || 12;

export const generateSlug = () => {
  const adjIndex = crypto.randomInt(0, adjectives.length);
  const nounIndex = crypto.randomInt(0, nouns.length);
  const randomNum = crypto.randomInt(1000, 9999);
  return `${adjectives[adjIndex]}-${nouns[nounIndex]}-${randomNum}`;
};

/**
 * Create a new room with optional password protection and custom TTL
 */
export const createRoom = async (roomName, password = null, ttlSeconds = 3600) => {
  try {
    let slug;
    if (roomName && typeof roomName === 'string' && roomName.trim() !== '') {
      slug = roomName.trim().toLowerCase();
      const checkKey = `room:${slug}:meta`;
      const res = await redisClient.exists(checkKey);
      const exists = res === 1 || res === true;
      if (exists) {
        logger.error({ roomName: slug }, 'Room name already exists');
        throw new Error('ROOM_ALREADY_EXISTS');
      }
    } else {
      let attempts = 0;
      const maxAttempts = 5;
      let exists = true;

      while (exists && attempts < maxAttempts) {
        slug = generateSlug();
        const checkKey = `room:${slug}:meta`;
        const res = await redisClient.exists(checkKey);
        exists = res === 1 || res === true;
        attempts++;
      }

      if (exists) {
        logger.error('Failed to generate a unique room slug after 5 attempts');
        throw new Error('SLUG_GENERATION_FAILED');
      }
    }

    const metaKey = `room:${slug}:meta`;
    
    const roomMeta = {
      name: slug,
      createdAt: new Date().toISOString(),
      passwordHash: '',
      ttlSeconds: ttlSeconds.toString(),
      maxUsers: process.env.TEST_MAX_USERS || process.env.MAX_USERS_PER_ROOM || '50', // Default as per spec
    };

    // Hash password if provided
    if (password && password.trim() !== '') {
      roomMeta.passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    }

    // Store room meta in Redis as Hash
    await redisClient.multi()
      .hSet(metaKey, roomMeta)
      .expire(metaKey, ttlSeconds)
      .exec();

    logger.info({ roomName: slug, ttlSeconds }, 'Room created successfully');
    return { success: true, roomName: slug };
  } catch (error) {
    logger.error(error, 'Error in createRoom');
    throw error;
  }
};

/**
 * Check if a room is password protected
 */
export const isRoomProtected = async (roomName) => {
  try {
    const slug = (roomName || '').trim().toLowerCase();
    const metaKey = `room:${slug}:meta`;
    const passwordHash = await redisClient.hGet(metaKey, 'passwordHash');
    
    return !!(passwordHash && passwordHash !== '');
  } catch (error) {
    logger.error({ error, roomName }, 'Error checking room protection');
    return false;
  }
};

/**
 * Verify room password
 */
export const verifyRoomPassword = async (roomName, password) => {
  try {
    const slug = (roomName || '').trim().toLowerCase();
    const metaKey = `room:${slug}:meta`;
    const passwordHash = await redisClient.hGet(metaKey, 'passwordHash');
    
    if (passwordHash === undefined || passwordHash === null) {
      logger.warn({ roomName: slug }, 'Verify password failed: Room not found');
      throw new Error('Room not found');
    }

    // If no password set, allow access
    if (!passwordHash || passwordHash === '') {
      return true;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, passwordHash);
    
    if (!isValid) {
      logger.warn({ roomName: slug }, 'Verify password failed: Invalid password');
    }

    return isValid;
  } catch (error) {
    logger.error({ error, roomName }, 'Error verifying room password');
    throw error;
  }
};

/**
 * Get room data
 */
export const getRoomData = async (roomName) => {
  try {
    const slug = (roomName || '').trim().toLowerCase();
    const metaKey = `room:${slug}:meta`;
    const roomMeta = await redisClient.hGetAll(metaKey);
    
    if (Object.keys(roomMeta).length === 0) {
      return null;
    }

    // Get remaining TTL from Redis
    const remainingTtl = await redisClient.ttl(metaKey);
    return { ...roomMeta, remainingTtl };
  } catch (error) {
    logger.error({ error, roomName }, 'Error getting room data');
    return null;
  }
};

/**
 * Delete room
 */
export const deleteRoom = async (roomName) => {
  try {
    const slug = (roomName || '').trim().toLowerCase();
    const metaKey = `room:${slug}:meta`;
    const usersKey = `room:${slug}:users`;
    const usersMapKey = `room:${slug}:users_map`;
    const messagesKey = `room:${slug}:messages`;
    
    await redisClient.del(metaKey);
    await redisClient.del(usersKey);
    await redisClient.del(usersMapKey);
    await redisClient.del(messagesKey);
    
    logger.info({ roomName: slug }, 'Room deleted successfully');
    return true;
  } catch (error) {
    logger.error({ error, roomName }, 'Error deleting room');
    return false;
  }
};

// Aliases for compatibility with socket.js
export const addUserToRoom = async (roomName, userId, userName, maxUsers) => {
  return addUser(roomName, userId, userName, maxUsers);
};

export const removeUserFromRoom = async (roomName, userId) => {
  return removeUser(roomName, userId);
};

export const getRoomUsers = async (roomName) => {
  return await getRoomUsersList(roomName);
};

