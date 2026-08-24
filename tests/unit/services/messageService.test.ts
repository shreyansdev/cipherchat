import { describe, it, expect, vi, beforeEach } from 'vitest';
import redisClient from '../../../server/config/redis';
import * as messageService from '../../../server/services/messageService';

// Mock redis client
vi.mock('../../../server/config/redis', () => ({
  default: {
    rPush: vi.fn(),
    lTrim: vi.fn(),
    expireAt: vi.fn(),
    expireTime: vi.fn(),
    lRange: vi.fn(),
    del: vi.fn(),
    multi: vi.fn(),
    storeMessage: vi.fn(),
  },
}));

describe('messageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('storeMessage', () => {
    it('calls storeMessage Lua script with correct parameters', async () => {
      const roomName = 'test-room';
      const message = { id: 'm1', text: 'hello' };
      
      vi.mocked(redisClient.storeMessage).mockResolvedValue(1);

      const result = await messageService.storeMessage(roomName, message);

      expect(result).toBe(true);
      expect(redisClient.storeMessage).toHaveBeenCalledWith(
        [`room:${roomName}:messages`, `room:${roomName}:meta`],
        [JSON.stringify(message), '500']
      );
    });

    it('returns false if the storeMessage Lua script returns a failure code', async () => {
      const roomName = 'test-room';
      const message = { id: 'm1', text: 'hello' };
      
      vi.mocked(redisClient.storeMessage).mockResolvedValue(-1);

      const result = await messageService.storeMessage(roomName, message);

      expect(result).toBe(false);
      expect(redisClient.storeMessage).toHaveBeenCalled();
    });

    it('returns false on error', async () => {
      const roomName = 'test-room';
      const message = { id: 'm1', text: 'hello' };
      
      vi.mocked(redisClient.storeMessage).mockRejectedValue(new Error('Redis error'));

      const result = await messageService.storeMessage(roomName, message);
      expect(result).toBe(false);
    });
  });

  describe('getRoomMessages', () => {
    it('returns an empty array for a non-existent room (not an error)', async () => {
      vi.mocked(redisClient.lRange).mockResolvedValue([]);
      const result = await messageService.getRoomMessages('empty-room');
      expect(result).toEqual([]);
    });

    it('returns messages in chronological order (LRANGE 0 -1)', async () => {
      const msgs = [JSON.stringify({ id: '1' }), JSON.stringify({ id: '2' })];
      vi.mocked(redisClient.lRange).mockResolvedValue(msgs);
      
      const result = await messageService.getRoomMessages('room1');
      
      expect(redisClient.lRange).toHaveBeenCalledWith(`room:room1:messages`, 0, -1);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    it('returns empty array on error', async () => {
      vi.mocked(redisClient.lRange).mockRejectedValue(new Error('Redis error'));
      const result = await messageService.getRoomMessages('room1');
      expect(result).toEqual([]);
    });
  });

  describe('clearRoomMessages', () => {
    it('deletes the messages key and returns true', async () => {
      vi.mocked(redisClient.del).mockResolvedValue(1);
      const result = await messageService.clearRoomMessages('room1');
      expect(result).toBe(true);
      expect(redisClient.del).toHaveBeenCalledWith('room:room1:messages');
    });

    it('returns false on error', async () => {
      vi.mocked(redisClient.del).mockRejectedValue(new Error('Redis error'));
      const result = await messageService.clearRoomMessages('room1');
      expect(result).toBe(false);
    });
  });
});
