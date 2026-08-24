import redisClient from '../config/redis.js';
import logger from '../lib/logger.js';

const SESSION_TTL = 24 * 60 * 60; // 24 hours in seconds

/**
 * Register a socket session in Redis
 */
export const registerSession = async (socketId, userData) => {
  try {
    const sessionKey = `session:${socketId}`;
    await redisClient.multi()
      .hSet(sessionKey, {
        ...userData,
        connectedAt: Date.now().toString(),
      })
      .expire(sessionKey, SESSION_TTL)
      .exec();
    return true;
  } catch (error) {
    logger.error({ error, socketId }, `Error registering session`);
    return false;
  }
};

/**
 * Remove a socket session from Redis
 */
export const removeSession = async (socketId) => {
  try {
    const sessionKey = `session:${socketId}`;
    await redisClient.del(sessionKey);
    return true;
  } catch (error) {
    logger.error({ error, socketId }, `Error removing session`);
    return false;
  }
};

/**
 * Add a user (socketId/userId) with their name to a room's presence set and hash map
 */
export const addUser = async (roomName, userId, userName = userId, maxUsers = 50) => {
  try {
    const metaKey = `room:${roomName}:meta`;
    const usersKey = `room:${roomName}:users`;
    const usersMapKey = `room:${roomName}:users_map`;
    
    const result = await redisClient.checkAndAddLimit(
      [usersKey],
      [maxUsers.toString(), userId]
    );
    
    if (result === 1) {
      await redisClient.hSet(usersMapKey, userId, userName);
      const ttl = await redisClient.ttl(metaKey);
      if (ttl > 0) {
        await redisClient.expire(usersKey, ttl);
        await redisClient.expire(usersMapKey, ttl);
      }
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error({ error, userId, roomName }, `Error adding user to room`);
    return false;
  }
};

/**
 * Remove a user (userId) from a room's presence set and hash map
 */
export const removeUser = async (roomName, userId) => {
  try {
    const usersKey = `room:${roomName}:users`;
    const usersMapKey = `room:${roomName}:users_map`;
    
    const count = await redisClient.removeUser(
      [usersKey, usersMapKey],
      [userId]
    );
    
    return count;
  } catch (error) {
    logger.error({ error, userId, roomName }, `Error removing user from room`);
    return 0;
  }
};

/**
 * Get the number of users in a room
 */
export const getUserCount = async (roomName) => {
  try {
    const usersKey = `room:${roomName}:users`;
    return await redisClient.sCard(usersKey);
  } catch (error) {
    logger.error({ error, roomName }, `Error getting user count for room`);
    return 0;
  }
};

/**
 * Get the list of all users in a room
 */
export const getRoomUsersList = async (roomName) => {
  try {
    const usersMapKey = `room:${roomName}:users_map`;
    const usersHash = await redisClient.hGetAll(usersMapKey);
    if (!usersHash || Object.keys(usersHash).length === 0) {
      return [];
    }
    return Object.entries(usersHash).map(([id, name]) => ({ id, name }));
  } catch (error) {
    logger.error({ error, roomName }, `Error getting users list for room`);
    return [];
  }
};


