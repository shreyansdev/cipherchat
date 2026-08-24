import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock redis
const mockRedisMulti = {
  hSet: vi.fn().mockReturnThis(),
  expire: vi.fn().mockReturnThis(),
  expireAt: vi.fn().mockReturnThis(),
  rPush: vi.fn().mockReturnThis(),
  lTrim: vi.fn().mockReturnThis(),
  sAdd: vi.fn().mockReturnThis(),
  exec: vi.fn().mockResolvedValue([]),
};

vi.mock('../../../server/config/redis', () => ({
  default: {
    exists: vi.fn(),
    hSet: vi.fn(),
    hGet: vi.fn(),
    hGetAll: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
    multi: vi.fn(() => mockRedisMulti),
    expireTime: vi.fn(),
  },
}));

// Mock presence service to test aliases
vi.mock('../../../server/services/presenceService.js', () => ({
  addUser: vi.fn(),
  removeUser: vi.fn(),
  getRoomUsersList: vi.fn(),
}));

import * as roomService from '../../../server/services/roomService';
import redisClient from '../../../server/config/redis';
import * as presenceService from '../../../server/services/presenceService.js';
import bcrypt from 'bcrypt';

describe('roomService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRoom', () => {
    it('stores meta hash with all required fields', async () => {
      vi.mocked(redisClient.exists).mockResolvedValue(0);
      
      const result = await roomService.createRoom('test-room', 'password123', 3600);

      expect(result.success).toBe(true);
      expect(result.roomName).toMatch(/^[a-z]+-[a-z]+-[0-9]{4}$/);
      expect(mockRedisMulti.hSet).toHaveBeenCalled();
      const call = mockRedisMulti.hSet.mock.calls[0];
      expect(call[0]).toBe(`room:${result.roomName}:meta`);
      expect(call[1].name).toBe(result.roomName);
      expect(call[1].maxUsers).toBe('50');
      // Verify it's a bcrypt hash (starts with $2)
      expect(call[1].passwordHash).toMatch(/^\$2[ayb]\$.{56}$/);
    });

    it('calls EXPIRE on room:{slug}:meta with the correct TTL seconds', async () => {
      vi.mocked(redisClient.exists).mockResolvedValue(0);
      const result = await roomService.createRoom('ttl-room', null, 7200);
      expect(mockRedisMulti.expire).toHaveBeenCalledWith(`room:${result.roomName}:meta`, 7200);
    });

    it('rejects duplicate slugs (fails after 5 collision attempts)', async () => {
      vi.mocked(redisClient.exists).mockResolvedValue(1);
      await expect(roomService.createRoom('existing-room')).rejects.toThrow('SLUG_GENERATION_FAILED');
    });

    it('throws original error if exception happens', async () => {
      vi.mocked(redisClient.exists).mockRejectedValue(new Error('Redis connection failure'));
      await expect(roomService.createRoom('test')).rejects.toThrow('Redis connection failure');
    });
  });

  describe('isRoomProtected', () => {
    it('returns true if passwordHash exists', async () => {
      vi.mocked(redisClient.hGet).mockResolvedValue('some-hash');
      const res = await roomService.isRoomProtected('room1');
      expect(res).toBe(true);
      expect(redisClient.hGet).toHaveBeenCalledWith('room:room1:meta', 'passwordHash');
    });

    it('returns false if passwordHash is empty or undefined', async () => {
      vi.mocked(redisClient.hGet).mockResolvedValue('');
      let res = await roomService.isRoomProtected('room1');
      expect(res).toBe(false);

      vi.mocked(redisClient.hGet).mockResolvedValue(undefined as any);
      res = await roomService.isRoomProtected('room1');
      expect(res).toBe(false);
    });

    it('returns false on error', async () => {
      vi.mocked(redisClient.hGet).mockRejectedValue(new Error('Redis error'));
      const res = await roomService.isRoomProtected('room1');
      expect(res).toBe(false);
    });
  });

  describe('verifyRoomPassword', () => {
    it('returns true for correct password, false for incorrect', async () => {
      const password = 'my-secret-password';
      const hash = await bcrypt.hash(password, 12);
      
      vi.mocked(redisClient.hGet).mockResolvedValue(hash);
      
      let result = await roomService.verifyRoomPassword('room1', password);
      expect(result).toBe(true);
      
      result = await roomService.verifyRoomPassword('room1', 'wrong-password');
      expect(result).toBe(false);
    });

    it('never returns the stored hash in its result', async () => {
      const password = 'pwd';
      const hash = await bcrypt.hash(password, 12);
      vi.mocked(redisClient.hGet).mockResolvedValue(hash);
      
      const result = await roomService.verifyRoomPassword('room1', password);
      expect(result).toBe(true);
      expect(result).not.toBe(hash);
    });

    it('returns true if room is not protected (passwordHash is empty)', async () => {
      vi.mocked(redisClient.hGet).mockResolvedValue('');
      const result = await roomService.verifyRoomPassword('room1', 'any-pass');
      expect(result).toBe(true);
    });

    it('throws error if room is not found (hash is undefined)', async () => {
      vi.mocked(redisClient.hGet).mockResolvedValue(undefined as any);
      await expect(roomService.verifyRoomPassword('room1', 'pass')).rejects.toThrow('Room not found');
    });

    it('throws error on internal failure', async () => {
      vi.mocked(redisClient.hGet).mockRejectedValue(new Error('Redis failure'));
      await expect(roomService.verifyRoomPassword('room1', 'pass')).rejects.toThrow('Redis failure');
    });
  });

  describe('getRoomData', () => {
    it('returns room meta with remainingTtl', async () => {
      const mockMeta = { name: 'room1', maxUsers: '50' };
      vi.mocked(redisClient.hGetAll).mockResolvedValue(mockMeta);
      vi.mocked(redisClient.ttl).mockResolvedValue(1800);

      const res = await roomService.getRoomData('room1');
      expect(res).toEqual({ ...mockMeta, remainingTtl: 1800 });
      expect(redisClient.hGetAll).toHaveBeenCalledWith('room:room1:meta');
      expect(redisClient.ttl).toHaveBeenCalledWith('room:room1:meta');
    });

    it('returns null if room does not exist', async () => {
      vi.mocked(redisClient.hGetAll).mockResolvedValue({});
      const res = await roomService.getRoomData('room1');
      expect(res).toBeNull();
    });

    it('returns null on error', async () => {
      vi.mocked(redisClient.hGetAll).mockRejectedValue(new Error('Redis error'));
      const res = await roomService.getRoomData('room1');
      expect(res).toBeNull();
    });
  });

  describe('deleteRoom', () => {
    it('deletes all keys and returns true', async () => {
      vi.mocked(redisClient.del).mockResolvedValue(1);
      const res = await roomService.deleteRoom('room1');
      expect(res).toBe(true);
      expect(redisClient.del).toHaveBeenCalledWith('room:room1:meta');
      expect(redisClient.del).toHaveBeenCalledWith('room:room1:users');
      expect(redisClient.del).toHaveBeenCalledWith('room:room1:users_map');
      expect(redisClient.del).toHaveBeenCalledWith('room:room1:messages');
    });

    it('returns false on error', async () => {
      vi.mocked(redisClient.del).mockRejectedValue(new Error('Redis error'));
      const res = await roomService.deleteRoom('room1');
      expect(res).toBe(false);
    });
  });

  describe('Presence Aliases', () => {
    it('addUserToRoom calls presenceService.addUser', async () => {
      vi.mocked(presenceService.addUser).mockResolvedValue(true);
      const res = await roomService.addUserToRoom('room1', 'u1', 'Alice', 50);
      expect(res).toBe(true);
      expect(presenceService.addUser).toHaveBeenCalledWith('room1', 'u1', 'Alice', 50);
    });

    it('removeUserFromRoom calls presenceService.removeUser', async () => {
      vi.mocked(presenceService.removeUser).mockResolvedValue(1);
      const res = await roomService.removeUserFromRoom('room1', 'u1');
      expect(res).toBe(1);
      expect(presenceService.removeUser).toHaveBeenCalledWith('room1', 'u1');
    });

    it('getRoomUsers calls presenceService.getRoomUsersList', async () => {
      const mockUsers = [{ id: 'u1', name: 'Alice' }];
      vi.mocked(presenceService.getRoomUsersList).mockResolvedValue(mockUsers);
      const res = await roomService.getRoomUsers('room1');
      expect(res).toEqual(mockUsers);
      expect(presenceService.getRoomUsersList).toHaveBeenCalledWith('room1');
    });
  });
});
