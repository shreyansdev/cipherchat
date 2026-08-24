import { storeMessage, getRoomMessages } from '../services/messageService.js';
import { addUserToRoom, removeUserFromRoom, getRoomUsers, deleteRoom } from '../services/roomService.js';
import { registerSession, removeSession, getUserCount } from '../services/presenceService.js';
import DOMPurify from 'isomorphic-dompurify';
import logger from '../lib/logger.js';
import { createAdapter } from '@socket.io/redis-adapter';
import redisClient from './redis.js';

// Rate limiting for Socket.IO messages
const messageRateLimits = new Map();
const MESSAGE_RATE_LIMIT = parseInt(process.env.SOCKET_MSG_RATE_PER_SECOND) || 5; 
const MESSAGE_RATE_WINDOW = 1000; // 1 second

// Empty room grace period deletion management
export const emptyRoomTimers = new Map();
const DEFAULT_EMPTY_ROOM_GRACE_PERIOD_MS = parseInt(process.env.EMPTY_ROOM_GRACE_PERIOD_SECONDS || '120', 10) * 1000;

export const getEmptyRoomGracePeriodMs = () => {
  if (process.env.TEST_GRACE_PERIOD_MS) {
    return parseInt(process.env.TEST_GRACE_PERIOD_MS, 10);
  }
  if (process.env.EMPTY_ROOM_GRACE_PERIOD_MS) {
    return parseInt(process.env.EMPTY_ROOM_GRACE_PERIOD_MS, 10);
  }
  return DEFAULT_EMPTY_ROOM_GRACE_PERIOD_MS;
};

const checkMessageRateLimit = (userId) => {
  const now = Date.now();
  const timestamps = messageRateLimits.get(userId) || [];
  
  // Filter out timestamps older than the window
  const windowStart = now - MESSAGE_RATE_WINDOW;
  const recentTimestamps = timestamps.filter(ts => ts > windowStart);
  
  if (recentTimestamps.length >= MESSAGE_RATE_LIMIT) {
    return false; // Rate limit exceeded
  }
  
  recentTimestamps.push(now);
  messageRateLimits.set(userId, recentTimestamps);
  return true;
};

const BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;
const ROOM_NAME_REGEX = /^[a-z0-9_-]+$/;

let pubClient;
let subClient;

export const closeSocketServices = async () => {
  for (const timer of emptyRoomTimers.values()) {
    clearTimeout(timer);
  }
  emptyRoomTimers.clear();

  const promises = [];
  if (pubClient) {
    promises.push(pubClient.quit().catch(err => logger.error(err, 'Error quitting pubClient')));
  }
  if (subClient) {
    promises.push(subClient.quit().catch(err => logger.error(err, 'Error quitting subClient')));
  }
  await Promise.all(promises);
  pubClient = null;
  subClient = null;
};

export const setupSocketHandlers = async (io) => {
  // Enable Redis adapter for multi-node scaling
  pubClient = redisClient.duplicate();
  subClient = redisClient.duplicate();
  
  pubClient.on('error', (err) => {
    logger.error(err, 'Redis Pub Client Error');
  });
  
  subClient.on('error', (err) => {
    logger.error(err, 'Redis Sub Client Error');
  });
  
  await Promise.all([
    pubClient.connect(),
    subClient.connect()
  ]);
  
  io.adapter(createAdapter(pubClient, subClient));

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'User connected');

    // Join room event
    socket.on('join-room', async (data) => {
      try {
        if (!data || typeof data !== 'object') return;
        const { roomName, userName, userId, password } = data;

        if (!roomName || !userName || !userId) {
          logger.warn({ data }, 'Join-room failed: Invalid room or user data');
          socket.emit('error', { message: 'Invalid room or user data' });
          return;
        }

        // Sanitize and validate inputs
        const sanitizedRoomName = DOMPurify.sanitize(roomName).trim().toLowerCase();
        const sanitizedUserName = DOMPurify.sanitize(userName).trim();
        const sanitizedUserId = DOMPurify.sanitize(userId).trim();
        
        const SLUG_REGEX = /^[a-z]+-[a-z]+-[0-9]{4}$/;
        if (!SLUG_REGEX.test(sanitizedRoomName)) {
          logger.warn({ sanitizedRoomName, socketId: socket.id }, 'Join-room failed: Invalid room slug format');
          socket.emit('error', { message: 'Invalid room slug format' });
          return;
        }

        if (sanitizedRoomName.length > 64 || !ROOM_NAME_REGEX.test(sanitizedRoomName)) {
          logger.warn({ sanitizedRoomName, socketId: socket.id }, 'Join-room failed: Invalid room identifier');
          socket.emit('error', { message: 'Invalid room identifier' });
          return;
        }

        if (sanitizedUserName.length > 32) {
          logger.warn({ sanitizedUserName, socketId: socket.id }, 'Join-room failed: Nickname too long');
          socket.emit('error', { message: 'Nickname too long (max 32 characters)' });
          return;
        }
        
        logger.info({ 
          userName: sanitizedUserName, 
          userId: sanitizedUserId, 
          roomName: sanitizedRoomName,
          socketId: socket.id 
        }, 'User joining room');
        
        // Get room data (including remaining TTL)
        const { getRoomData, verifyRoomPassword } = await import('../services/roomService.js');
        const roomData = await getRoomData(sanitizedRoomName);
        
        if (!socket.connected) {
          logger.warn({ roomName: sanitizedRoomName, socketId: socket.id }, 'Join-room aborted: Socket disconnected during getRoomData');
          return;
        }
        
        if (!roomData) {
          socket.emit('error', { 
            message: 'Room not found or expired',
            code: 'ROOM_NOT_FOUND'
          });
          return;
        }

        // Enforce password verification if the room is password-protected
        if (roomData.passwordHash && roomData.passwordHash !== '') {
          if (!password) {
            logger.warn({ roomName: sanitizedRoomName, socketId: socket.id }, 'Join-room failed: Password required');
            socket.emit('error', { message: 'Password required', code: 'PASSWORD_REQUIRED' });
            return;
          }
          const isPasswordValid = await verifyRoomPassword(sanitizedRoomName, password);
          if (!isPasswordValid) {
            logger.warn({ roomName: sanitizedRoomName, socketId: socket.id }, 'Join-room failed: Invalid password');
            socket.emit('error', { message: 'Invalid room password', code: 'INVALID_PASSWORD' });
            return;
          }
        }

        // Call presenceService.getUserCount
        const currentCount = await getUserCount(sanitizedRoomName);
        
        // Fetch room:{slug}:meta maxUsers from Redis
        const maxUsersRaw = await redisClient.hGet(`room:${sanitizedRoomName}:meta`, 'maxUsers');
        const maxUsers = maxUsersRaw ? parseInt(maxUsersRaw, 10) : (parseInt(process.env.MAX_USERS_PER_ROOM, 10) || 50);
        
        if (!socket.connected) {
          logger.warn({ roomName: sanitizedRoomName, socketId: socket.id }, 'Join-room aborted: Socket disconnected during getUserCount check');
          return;
        }
        
        if (currentCount >= maxUsers) {
          logger.warn({ roomName: sanitizedRoomName, socketId: socket.id }, 'Join-room failed: Room is full');
          socket.emit('join_error', { 
            code: 'ROOM_FULL',
            maxUsers
          });
          return;
        }

        // Clean up previous room presence if socket was already in another room
        if (socket.userData && socket.userData.roomName && socket.userData.roomName !== sanitizedRoomName) {
          const oldRoom = socket.userData.roomName;
          logger.info({ socketId: socket.id, oldRoom, newRoom: sanitizedRoomName }, 'Socket switching rooms, cleaning up old room presence');
          
          socket.leave(oldRoom);
          await removeUserFromRoom(oldRoom, socket.userData.userId);
          const oldRoomUsers = await getRoomUsers(oldRoom);
          io.to(oldRoom).emit('users-updated', oldRoomUsers);
          
          // Send system leave message for old room
          const leaveMessage = {
            id: `msg-${Date.now()}-leave-${socket.userData.userId}`,
            user: { id: 'system', name: 'System' },
            text: `${socket.userData.userName} has left the chat.`,
            timestamp: Date.now(),
            type: 'system',
          };
          await storeMessage(oldRoom, leaveMessage);
          io.to(oldRoom).emit('new-message', leaveMessage);
        }

        // Add user to Redis atomically (with capacity check to prevent race conditions)
        const addSuccess = await addUserToRoom(sanitizedRoomName, sanitizedUserId, sanitizedUserName, maxUsers);
        
        if (!socket.connected) {
          if (addSuccess) {
            await removeUserFromRoom(sanitizedRoomName, sanitizedUserId);
          }
          logger.warn({ roomName: sanitizedRoomName, socketId: socket.id }, 'Join-room aborted: Socket disconnected during addUserToRoom');
          return;
        }

        if (!addSuccess) {
          logger.warn({ roomName: sanitizedRoomName, socketId: socket.id }, 'Join-room failed: Room is full (atomic check)');
          socket.emit('join_error', { 
            code: 'ROOM_FULL',
            maxUsers
          });
          return;
        }

        // Join the Socket.IO room
        socket.join(sanitizedRoomName);
        
        // Cancel empty room grace period deletion if user joined
        if (emptyRoomTimers.has(sanitizedRoomName)) {
          clearTimeout(emptyRoomTimers.get(sanitizedRoomName));
          emptyRoomTimers.delete(sanitizedRoomName);
          logger.info({ roomName: sanitizedRoomName }, 'User rejoined empty room. Cancelled grace period deletion timer.');
        }
        
        // Store user info in socket and register session
        socket.userData = { roomName: sanitizedRoomName, userName: sanitizedUserName, userId: sanitizedUserId };
        await registerSession(socket.id, socket.userData);
        
        // Get all users in room
        const users = await getRoomUsers(sanitizedRoomName);
        
        // Send room joined event with meta
        socket.emit('room-joined', {
          roomName: sanitizedRoomName,
          remainingTtl: roomData.remainingTtl,
          maxUsers: roomData.maxUsers
        });

        // Get encrypted message history and send to joining user
        const messageHistory = await getRoomMessages(sanitizedRoomName);
        socket.emit('message-history', messageHistory);
        
        // Notify all users in room about updated user list
        io.to(sanitizedRoomName).emit('users-updated', users);
        
        // Send system message
        const joinMessage = {
          id: `msg-${Date.now()}-join-${sanitizedUserId}`,
          user: { id: 'system', name: 'System' },
          text: `${sanitizedUserName} has joined the chat.`,
          timestamp: Date.now(),
          type: 'system',
        };
        
        // Store and broadcast join message (system messages are plaintext)
        await storeMessage(sanitizedRoomName, joinMessage);
        io.to(sanitizedRoomName).emit('new-message', joinMessage);
        
        logger.info({ 
          userName: sanitizedUserName, 
          roomName: sanitizedRoomName, 
          userCount: users.length 
        }, 'User successfully joined room');
      } catch (error) {
        logger.error(error, 'Error joining room');
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Send message event
    socket.on('send-message', async (data, callback) => {
      try {
        if (!data || typeof data !== 'object') return;
        const { message } = data;

        if (!socket.userData || !socket.userData.roomName) {
          logger.warn({ socketId: socket.id }, 'Send-message failed: User not authenticated');
          socket.emit('error', { message: 'User not authenticated' });
          if (callback) callback({ success: false, error: 'Not authenticated' });
          return;
        }

        const authenticatedRoom = socket.userData.roomName;

        // Verify that the socket is actually in the Socket.IO room before relaying
        if (!socket.rooms.has(authenticatedRoom)) {
          logger.warn({ socketId: socket.id, authenticatedRoom }, 'Send-message failed: Socket not in Socket.IO room');
          socket.emit('error', { message: 'Not authorized for this room' });
          if (callback) callback({ success: false, error: 'Not authorized' });
          return;
        }

        // Validate message payload shape and content
        if (!message || typeof message !== 'object') {
          logger.warn({ socketId: socket.id }, 'Send-message failed: Invalid message payload');
          if (callback) callback({ success: false, error: 'Invalid message payload' });
          return;
        }

        // User messages must have ciphertext and iv as base64 strings
        if (message.type === 'user') {
          if (!message.ciphertext || !message.iv || 
              !BASE64_REGEX.test(message.ciphertext) || !BASE64_REGEX.test(message.iv)) {
            logger.warn({ message, socketId: socket.id }, 'Send-message failed: Invalid encrypted payload');
            if (callback) callback({ success: false, error: 'Invalid encrypted payload' });
            return;
          }
        }

        // Check rate limit
        if (!checkMessageRateLimit(socket.userData.userId)) {
          logger.warn({ userId: socket.userData.userId, socketId: socket.id }, 'Send-message failed: Rate limit exceeded');
          socket.emit('rate_limited', { message: 'Rate limit exceeded. Please slow down.' });
          if (callback) callback({ success: false, error: 'Rate limit exceeded' });
          return;
        }

        // Server is a "dumb relay" for user messages.
        // We broadcast ciphertext and IV as-is.
        logger.info({ 
          roomName: authenticatedRoom, 
          userName: socket.userData.userName, 
          userId: socket.userData.userId,
          messageId: message.id,
          ciphertext: message.ciphertext // Will be redacted by Pino
        }, 'Relaying encrypted message');
        
        // Prevent Prototype Pollution / Property Injection: Construct clean message object
        const messageId = (typeof message.id === 'string' && message.id.trim() !== '')
          ? DOMPurify.sanitize(message.id)
          : `msg-${Date.now()}-${socket.userData.userId}`;

        const relayedMessage = {
          id: messageId,
          user: {
            id: socket.userData.userId,
            name: socket.userData.userName
          },
          ciphertext: message.ciphertext,
          iv: message.iv,
          timestamp: typeof message.timestamp === 'number' ? message.timestamp : Date.now(),
          type: 'user',
          status: 'delivered',
        };

        // Forward optional file-sharing properties if present (Phase 2 feature check)
        if (message.mediaUrl) {
          relayedMessage.mediaUrl = DOMPurify.sanitize(message.mediaUrl);
          relayedMessage.mediaType = message.mediaType === 'image' ? 'image' : 'file';
          relayedMessage.fileName = DOMPurify.sanitize(message.fileName || '');
          relayedMessage.fileSize = Number(message.fileSize) || 0;
        }
        
        // Store message in Redis
        await storeMessage(authenticatedRoom, relayedMessage);
        
        // Broadcast to all users in room (including sender)
        io.to(authenticatedRoom).emit('new-message', relayedMessage);
        
        // Send acknowledgment
        if (callback) callback({ success: true, messageId: relayedMessage.id });
      } catch (error) {
        logger.error(error, 'Error sending message');
        socket.emit('error', { message: 'Failed to send message' });
        if (callback) callback({ success: false, error: 'Failed to send message' });
      }
    });

    // Typing indicator event
    socket.on('typing', (data) => {
      try {
        if (!data || typeof data !== 'object') return;
        const { isTyping } = data;

        if (!socket.userData || !socket.userData.roomName) return;

        const authenticatedRoom = socket.userData.roomName;
        const { userId, userName } = socket.userData;

        // Verify that the socket is actually in the Socket.IO room before relaying
        if (!socket.rooms.has(authenticatedRoom)) return;

        // Sanitize inputs
        const sanitizedUserName = DOMPurify.sanitize(userName).trim().substring(0, 32);
        
        // Broadcast typing status to all other users in room (not sender)
        socket.to(authenticatedRoom).emit('user-typing', { userId, userName: sanitizedUserName, isTyping });
      } catch (error) {
        logger.error(error, 'Error handling typing indicator');
      }
    });

    // Disconnect event
    socket.on('disconnect', async () => {
      try {
        // Remove session
        await removeSession(socket.id);

        if (socket.userData) {
          const { roomName, userName, userId } = socket.userData;
          logger.info({ userName, userId, roomName, socketId: socket.id }, 'User disconnecting from room');
          
          // Clean up rate limit data
          messageRateLimits.delete(userId);
          
          // Remove user from Redis
          await removeUserFromRoom(roomName, userId);
          
          // Get updated user list
          const users = await getRoomUsers(roomName);
          
          // Notify remaining users
          io.to(roomName).emit('users-updated', users);
          
          // Send system message
          const leaveMessage = {
            id: `msg-${Date.now()}-leave-${userId}`,
            user: { id: 'system', name: 'System' },
            text: `${userName} has left the chat.`,
            timestamp: Date.now(),
            type: 'system',
          };
          
          // Store and broadcast leave message
          await storeMessage(roomName, leaveMessage);
          io.to(roomName).emit('new-message', leaveMessage);
          
          logger.info({ 
            userName, 
            roomName, 
            remainingUsers: users.length 
          }, 'User left room');

          // If room is now empty, schedule grace period deletion
          if (users.length === 0) {
            if (!emptyRoomTimers.has(roomName)) {
              const graceMs = getEmptyRoomGracePeriodMs();
              logger.info({ roomName, gracePeriodMs: graceMs }, 'Room is now empty. Starting grace period timer for auto-deletion.');

              const timer = setTimeout(async () => {
                try {
                  emptyRoomTimers.delete(roomName);
                  const currentUsers = await getRoomUsers(roomName);
                  if (currentUsers.length === 0) {
                    logger.info({ roomName }, 'Room remained empty after grace period. Deleting room data from Redis.');
                    await deleteRoom(roomName);
                  } else {
                    logger.info({ roomName, userCount: currentUsers.length }, 'Room is no longer empty. Grace period deletion skipped.');
                  }
                } catch (err) {
                  logger.error({ err, roomName }, 'Error during empty room grace period deletion');
                }
              }, graceMs);

              emptyRoomTimers.set(roomName, timer);
            }
          }
        }
      } catch (error) {
        logger.error(error, 'Error handling disconnect');
      }
      
      logger.info({ socketId: socket.id }, 'User disconnected');
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error(error, 'Socket error');
    });
  });
};

