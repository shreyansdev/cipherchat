import redisClient from '../config/redis.js';
import logger from '../lib/logger.js';

const MESSAGE_TTL = parseInt(process.env.MESSAGE_TTL) || 3600; // 1 hour

/**
 * Store a message in Redis
 */
export const storeMessage = async (roomName, message) => {
  try {
    const messagesKey = `room:${roomName}:messages`;
    const metaKey = `room:${roomName}:meta`;
    const messageData = JSON.stringify(message);
    
    const result = await redisClient.storeMessage(
      [messagesKey, metaKey],
      [messageData, '500']
    );
    
    return result === 1;
  } catch (error) {
    logger.error({ error, roomName, messageId: message.id }, 'Error storing message');
    return false;
  }
};

/**
 * Get all messages for a room
 */
export const getRoomMessages = async (roomName) => {
  try {
    const messagesKey = `room:${roomName}:messages`;
    const messagesData = await redisClient.lRange(messagesKey, 0, -1);
    
    const messages = messagesData.map(msgData => JSON.parse(msgData));
    return messages;
  } catch (error) {
    logger.error({ error, roomName }, 'Error getting room messages');
    return [];
  }
};

/**
 * Clear all messages for a room
 */
export const clearRoomMessages = async (roomName) => {
  try {
    const messagesKey = `room:${roomName}:messages`;
    await redisClient.del(messagesKey);
    
    return true;
  } catch (error) {
    logger.error({ error, roomName }, 'Error clearing room messages');
    return false;
  }
};
