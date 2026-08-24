import { describe, it, expect, vi, beforeEach } from 'vitest';
import redisClient from '../../../server/config/redis.js';
import * as presenceService from '../../../server/services/presenceService.js';

// Mock redis client
vi.mock('../../../server/config/redis.js', () => {
  const mockMulti = {
    hSet: vi.fn().mockReturnThis(),
    expire: vi.fn().mockReturnThis(),
    exec: vi.fn(),
  };
  return {
    default: {
      sAdd: vi.fn(),
      sRem: vi.fn(),
      sCard: vi.fn(),
      hSet: vi.fn(),
      hDel: vi.fn(),
      hGetAll: vi.fn(),
      del: vi.fn(),
      expire: vi.fn(),
      ttl: vi.fn(),
      multi: vi.fn(() => mockMulti),
      checkAndAddLimit: vi.fn(),
      removeUser: vi.fn(),
    },
  };
});

describe('presenceService unit tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerSession', () => {
    it('registers session details and sets TTL', async () => {
      const mockMulti = redisClient.multi();
      mockMulti.exec.mockResolvedValue([]);

      const result = await presenceService.registerSession('socket1', { userId: 'u1', room: 'room1' });
      expect(result).toBe(true);
      expect(redisClient.multi).toHaveBeenCalled();
      expect(mockMulti.hSet).toHaveBeenCalledWith('session:socket1', expect.objectContaining({
        userId: 'u1',
        room: 'room1',
        connectedAt: expect.any(String),
      }));
      expect(mockMulti.expire).toHaveBeenCalledWith('session:socket1', 24 * 60 * 60);
    });

    it('returns false on error', async () => {
      const mockMulti = redisClient.multi();
      mockMulti.exec.mockRejectedValue(new Error('Redis error'));

      const result = await presenceService.registerSession('socket1', {});
      expect(result).toBe(false);
    });
  });

  describe('removeSession', () => {
    it('deletes session key', async () => {
      vi.mocked(redisClient.del).mockResolvedValue(1);
      const result = await presenceService.removeSession('socket1');
      expect(result).toBe(true);
      expect(redisClient.del).toHaveBeenCalledWith('session:socket1');
    });

    it('returns false on error', async () => {
      vi.mocked(redisClient.del).mockRejectedValue(new Error('Redis error'));
      const result = await presenceService.removeSession('socket1');
      expect(result).toBe(false);
    });
  });

  describe('addUser', () => {
    it('returns true, sets user mapping, and replicates TTL if checkAndAddLimit returns 1', async () => {
      const roomName = 'room1';
      const userId = 'u1';
      const userName = 'Alice';
      const maxUsers = 50;
      
      vi.mocked(redisClient.checkAndAddLimit).mockResolvedValue(1);
      vi.mocked(redisClient.ttl).mockResolvedValue(3600);

      const result = await presenceService.addUser(roomName, userId, userName, maxUsers);

      expect(result).toBe(true);
      expect(redisClient.checkAndAddLimit).toHaveBeenCalledWith(
        [`room:${roomName}:users`],
        [maxUsers.toString(), userId]
      );
      expect(redisClient.hSet).toHaveBeenCalledWith(
        `room:${roomName}:users_map`,
        userId,
        userName
      );
      expect(redisClient.ttl).toHaveBeenCalledWith(`room:${roomName}:meta`);
      expect(redisClient.expire).toHaveBeenCalledWith(`room:${roomName}:users`, 3600);
      expect(redisClient.expire).toHaveBeenCalledWith(`room:${roomName}:users_map`, 3600);
    });

    it('does not call expire if TTL <= 0', async () => {
      const roomName = 'room1';
      const userId = 'u1';
      vi.mocked(redisClient.checkAndAddLimit).mockResolvedValue(1);
      vi.mocked(redisClient.ttl).mockResolvedValue(0);

      const result = await presenceService.addUser(roomName, userId, 'Alice');
      expect(result).toBe(true);
      expect(redisClient.expire).not.toHaveBeenCalled();
    });

    it('returns false and does not update metadata if checkAndAddLimit returns 0 (room full)', async () => {
      const roomName = 'room1';
      const userId = 'u1';
      const userName = 'Alice';
      const maxUsers = 50;
      
      vi.mocked(redisClient.checkAndAddLimit).mockResolvedValue(0);

      const result = await presenceService.addUser(roomName, userId, userName, maxUsers);

      expect(result).toBe(false);
      expect(redisClient.checkAndAddLimit).toHaveBeenCalledWith(
        [`room:${roomName}:users`],
        [maxUsers.toString(), userId]
      );
      expect(redisClient.hSet).not.toHaveBeenCalled();
      expect(redisClient.ttl).not.toHaveBeenCalled();
      expect(redisClient.expire).not.toHaveBeenCalled();
    });

    it('returns false if the checkAndAddLimit Lua script throws an error', async () => {
      const roomName = 'room1';
      const userId = 'u1';
      
      vi.mocked(redisClient.checkAndAddLimit).mockRejectedValue(new Error('Redis connection lost'));

      const result = await presenceService.addUser(roomName, userId, 'Alice');

      expect(result).toBe(false);
      expect(redisClient.checkAndAddLimit).toHaveBeenCalled();
    });
  });

  describe('removeUser', () => {
    it('calls removeUser Lua script and returns the updated user count', async () => {
      const roomName = 'room1';
      const userId = 'u1';
      
      vi.mocked(redisClient.removeUser).mockResolvedValue(5);

      const count = await presenceService.removeUser(roomName, userId);

      expect(redisClient.removeUser).toHaveBeenCalledWith(
        [`room:${roomName}:users`, `room:${roomName}:users_map`],
        [userId]
      );
      expect(count).toBe(5);
    });

    it('returns 0 on error', async () => {
      const roomName = 'room1';
      const userId = 'u1';
      vi.mocked(redisClient.removeUser).mockRejectedValue(new Error('Redis error'));

      const count = await presenceService.removeUser(roomName, userId);
      expect(count).toBe(0);
    });
  });

  describe('getUserCount', () => {
    it('returns 0 for an empty or non-existent set', async () => {
      vi.mocked(redisClient.sCard).mockResolvedValue(0);
      const count = await presenceService.getUserCount('no-room');
      expect(count).toBe(0);
    });

    it('returns the correct user count', async () => {
      vi.mocked(redisClient.sCard).mockResolvedValue(10);
      const count = await presenceService.getUserCount('room1');
      expect(count).toBe(10);
    });

    it('returns 0 on error', async () => {
      vi.mocked(redisClient.sCard).mockRejectedValue(new Error('Redis error'));
      const count = await presenceService.getUserCount('room1');
      expect(count).toBe(0);
    });
  });

  describe('getRoomUsersList', () => {
    it('returns user objects array from hash map', async () => {
      vi.mocked(redisClient.hGetAll).mockResolvedValue({ u1: 'Alice', u2: 'Bob' });
      const result = await presenceService.getRoomUsersList('room1');
      expect(result).toEqual([
        { id: 'u1', name: 'Alice' },
        { id: 'u2', name: 'Bob' },
      ]);
    });

    it('returns empty array if room has no users', async () => {
      vi.mocked(redisClient.hGetAll).mockResolvedValue({});
      const result = await presenceService.getRoomUsersList('room1');
      expect(result).toEqual([]);
    });

    it('returns empty array on error', async () => {
      vi.mocked(redisClient.hGetAll).mockRejectedValue(new Error('Redis error'));
      const result = await presenceService.getRoomUsersList('room1');
      expect(result).toEqual([]);
    });
  });
});
