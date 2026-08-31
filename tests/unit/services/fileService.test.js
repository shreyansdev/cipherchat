import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock redis
vi.mock('../../../server/config/redis.js', () => ({
  default: {
    storeFileMetadata: vi.fn(),
    hGetAll: vi.fn(),
  },
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn(),
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    unlink: vi.fn(),
  },
}));

import { storeFileMetadata, getFileMetadata, saveFile, deleteFile, getFilePath } from '../../../server/services/fileService.js';
import redisClient from '../../../server/config/redis.js';
import fs from 'fs/promises';

describe('fileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('storeFileMetadata', () => {
    it('returns true if redis storeFileMetadata returns 1', async () => {
      vi.mocked(redisClient.storeFileMetadata).mockResolvedValue(1);
      const metadata = { filename: 'test.txt', size: 123 };
      const result = await storeFileMetadata('file123', metadata, 'room-slug');
      expect(result).toBe(true);
      expect(redisClient.storeFileMetadata).toHaveBeenCalledWith(
        ['file:file123', 'room:room-slug:meta'],
        ['filename', 'test.txt', 'size', '123']
      );
    });

    it('returns false if redis storeFileMetadata returns 0', async () => {
      vi.mocked(redisClient.storeFileMetadata).mockResolvedValue(0);
      const result = await storeFileMetadata('file123', {}, 'room-slug');
      expect(result).toBe(false);
    });

    it('returns false if redis throws error', async () => {
      vi.mocked(redisClient.storeFileMetadata).mockRejectedValue(new Error('Redis error'));
      const result = await storeFileMetadata('file123', {}, 'room-slug');
      expect(result).toBe(false);
    });
  });

  describe('getFileMetadata', () => {
    it('returns metadata hash map', async () => {
      const mockMeta = { filename: 'test.txt' };
      vi.mocked(redisClient.hGetAll).mockResolvedValue(mockMeta);
      const result = await getFileMetadata('file123');
      expect(result).toBe(mockMeta);
    });

    it('returns null on redis error', async () => {
      vi.mocked(redisClient.hGetAll).mockRejectedValue(new Error('Redis error'));
      const result = await getFileMetadata('file123');
      expect(result).toBeNull();
    });
  });

  describe('saveFile', () => {
    it('ensures directory exists and writes file to disk', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const file = { originalname: 'test.png', buffer: Buffer.from('hello') };
      const result = await saveFile(file, 'file123');

      expect(result).not.toBeNull();
      expect(result?.filename).toBe('file123.png');
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('strips unsafe or disallowed extensions', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const file = { originalname: 'malicious.exe', buffer: Buffer.from('payload') };
      const result = await saveFile(file, 'file123');

      expect(result).not.toBeNull();
      expect(result?.filename).toBe('file123');
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('creates directory if it does not exist', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('No access'));
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const file = { originalname: 'test.png', buffer: Buffer.from('hello') };
      const result = await saveFile(file, 'file123');

      expect(fs.mkdir).toHaveBeenCalled();
      expect(result).not.toBeNull();
    });

    it('returns null on failure', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Write error'));

      const file = { originalname: 'test.png', buffer: Buffer.from('hello') };
      const result = await saveFile(file, 'file123');

      expect(result).toBeNull();
    });
  });

  describe('deleteFile', () => {
    it('unlinks file and returns true', async () => {
      vi.mocked(fs.unlink).mockResolvedValue(undefined);
      const result = await deleteFile('file123.png');
      expect(result).toBe(true);
    });

    it('returns false on error', async () => {
      vi.mocked(fs.unlink).mockRejectedValue(new Error('Unlink error'));
      const result = await deleteFile('file123.png');
      expect(result).toBe(false);
    });
  });

  describe('getFilePath', () => {
    it('returns correct full path', () => {
      const result = getFilePath('file123.png');
      expect(result).toContain('file123.png');
    });
  });
});
