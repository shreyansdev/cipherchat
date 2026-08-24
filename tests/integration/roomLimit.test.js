import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import redisClient from '../../server/config/redis.js';
import * as roomService from '../../server/services/roomService.js';
import * as presenceService from '../../server/services/presenceService.js';

describe('Room Connection Limit Integration Tests', () => {
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

  const createTestRoom = async (name, maxUsers = 5) => {
    const roomName = `test-limit-${name}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await roomService.createRoom(roomName, null, 60);
    
    // Set custom maxUsers in Redis metadata hash
    const metaKey = `room:${roomName}:meta`;
    await redisClient.hSet(metaKey, 'maxUsers', maxUsers.toString());
    
    testRooms.add(roomName);
    return roomName;
  };

  it('enforces room connection limit and rejects subsequent users when full', async () => {
    const maxUsers = 3;
    const roomName = await createTestRoom('enforce', maxUsers);

    // Add 3 users successfully
    const res1 = await presenceService.addUser(roomName, 'u1', 'Alice', maxUsers);
    const res2 = await presenceService.addUser(roomName, 'u2', 'Bob', maxUsers);
    const res3 = await presenceService.addUser(roomName, 'u3', 'Charlie', maxUsers);

    expect(res1).toBe(true);
    expect(res2).toBe(true);
    expect(res3).toBe(true);

    // Verify current user count is 3
    const countAfterThree = await presenceService.getUserCount(roomName);
    expect(countAfterThree).toBe(3);

    // Attempt to add a 4th user - should be rejected
    const res4 = await presenceService.addUser(roomName, 'u4', 'Diana', maxUsers);
    expect(res4).toBe(false);

    // Count remains 3
    const countAfterFour = await presenceService.getUserCount(roomName);
    expect(countAfterFour).toBe(3);
  });

  it('guarantees atomicity and prevents race conditions under concurrent joins', async () => {
    const maxUsers = 2;
    const roomName = await createTestRoom('concurrency', maxUsers);

    // Trigger 5 concurrent join requests
    const joinRequests = [
      presenceService.addUser(roomName, 'u1', 'Alice', maxUsers),
      presenceService.addUser(roomName, 'u2', 'Bob', maxUsers),
      presenceService.addUser(roomName, 'u3', 'Charlie', maxUsers),
      presenceService.addUser(roomName, 'u4', 'Diana', maxUsers),
      presenceService.addUser(roomName, 'u5', 'Eve', maxUsers),
    ];

    const results = await Promise.all(joinRequests);

    // Exactly 2 requests should succeed (return true) and 3 should fail (return false)
    const successCount = results.filter(res => res === true).length;
    const failureCount = results.filter(res => res === false).length;

    expect(successCount).toBe(2);
    expect(failureCount).toBe(3);

    // Verify the final set size in Redis is exactly maxUsers (2)
    const finalCount = await presenceService.getUserCount(roomName);
    expect(finalCount).toBe(2);
  });
});
