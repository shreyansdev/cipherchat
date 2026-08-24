import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import redisClient from '../../server/config/redis.js';
import * as roomService from '../../server/services/roomService.js';
import * as messageService from '../../server/services/messageService.js';
import * as presenceService from '../../server/services/presenceService.js';

const MAX_MESSAGES_STORED = 500;

describe('Room Lifecycle Integration Tests', () => {
  const testRooms = new Set();

  beforeAll(async () => {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  });

  afterAll(async () => {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  });

  afterEach(async () => {
    for (const roomName of testRooms) {
      await roomService.deleteRoom(roomName);
    }
    testRooms.clear();
  });

  const createTestRoom = async (name, password = null, ttl = 3600) => {
    const result = await roomService.createRoom(null, password, ttl);
    const roomName = result.roomName;
    testRooms.add(roomName);
    return roomName;
  };

  it('1. Room creation and TTL', async () => {
    const roomName = await createTestRoom('ttl', null, 2);
    const metaKey = `room:${roomName}:meta`;
    
    // Confirm exists immediately
    const existsImmediately = await redisClient.exists(metaKey);
    expect(existsImmediately).toBe(1);

    // Wait 2100ms
    await new Promise(resolve => setTimeout(resolve, 2100));

    // Confirm no longer exists
    const existsAfter = await redisClient.exists(metaKey);
    expect(existsAfter).toBe(0);
  }, 10000);

  it('2. Message cap enforcement', async () => {
    const roomName = await createTestRoom('cap', null, 60);
    const messagesKey = `room:${roomName}:messages`;

    // Store MAX_MESSAGES_STORED + 10 messages
    // We use a loop to push messages. Since storeMessage uses multi().rPush().lTrim(), 
    // it will maintain the cap after each push.
    for (let i = 0; i < MAX_MESSAGES_STORED + 10; i++) {
      await messageService.storeMessage(roomName, { text: `message ${i}` });
    }

    // Confirm LLEN === MAX_MESSAGES_STORED
    const llen = await redisClient.lLen(messagesKey);
    expect(llen).toBe(MAX_MESSAGES_STORED);
  }, 20000);

  it('3. Password hash storage', async () => {
    const password = 'hunter2';
    const roomName = await createTestRoom('password', password);
    const metaKey = `room:${roomName}:meta`;

    // Fetch from Redis directly
    const roomMeta = await redisClient.hGetAll(metaKey);
    
    // Confirm the passwordHash field is a bcrypt hash (starts with $2b$ or similar)
    expect(roomMeta.passwordHash).toMatch(/^\$2[ayb]\$.{56}$/);
    expect(roomMeta.passwordHash).not.toBe(password);
  });

  it('4. Presence accuracy', async () => {
    const roomName = await createTestRoom('presence');
    
    // Add 3 socketIds
    await presenceService.addUser(roomName, 'socket1');
    await presenceService.addUser(roomName, 'socket2');
    await presenceService.addUser(roomName, 'socket3');

    // Remove 1
    await presenceService.removeUser(roomName, 'socket2');

    // Confirm count is 2
    const count = await presenceService.getUserCount(roomName);
    expect(count).toBe(2);
  });

  it('5. Concurrent message writes', async () => {
    const roomName = await createTestRoom('concurrent', null, 60);
    const messagesKey = `room:${roomName}:messages`;

    // Fill the room with some messages first (e.g., 470)
    const initialMessages = [];
    for (let i = 0; i < 470; i++) {
      initialMessages.push(messageService.storeMessage(roomName, { text: `initial ${i}` }));
    }
    await Promise.all(initialMessages);

    // Using Promise.all, write 50 messages simultaneously
    const concurrentWrites = Array.from({ length: 50 }, (_, i) => 
      messageService.storeMessage(roomName, { text: `concurrent ${i}` })
    );
    await Promise.all(concurrentWrites);

    // Confirm LLEN is exactly MAX_MESSAGES_STORED
    const llen = await redisClient.lLen(messagesKey);
    expect(llen).toBe(MAX_MESSAGES_STORED);
  }, 20000);
});
