import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import redisClient from '../../server/config/redis.js';
import * as roomService from '../../server/services/roomService.js';

const mockRedisMulti = {
  hSet: vi.fn().mockReturnThis(),
  expire: vi.fn().mockReturnThis(),
  exec: vi.fn().mockResolvedValue([]),
};

vi.mock('../../server/config/redis.js', () => ({
  default: {
    exists: vi.fn(),
    hSet: vi.fn(),
    expire: vi.fn(),
    multi: vi.fn(() => mockRedisMulti),
  },
}));

describe('Room Slug Generation and Collision Retry Unit Tests', () => {
  let randomIntSpy;
  let mathRandomSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    randomIntSpy = vi.spyOn(crypto, 'randomInt');
    mathRandomSpy = vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Generated slugs match the regex pattern', async () => {
    vi.mocked(redisClient.exists).mockResolvedValue(0);

    const result = await roomService.createRoom();

    expect(result.success).toBe(true);
    expect(result.roomName).toMatch(/^[a-z]+-[a-z]+-[0-9]{4}$/);
  });

  it('2. crypto.randomInt is called and Math.random is NOT called', async () => {
    vi.mocked(redisClient.exists).mockResolvedValue(0);

    await roomService.createRoom();

    // Verify crypto.randomInt was called
    expect(randomIntSpy).toHaveBeenCalled();
    
    // Verify Math.random was NOT called
    expect(mathRandomSpy).not.toHaveBeenCalled();
  });

  it('3. Collision retry logic retries up to 5 times and then returns the error', async () => {
    // Mock exists to always return 1 (simulate collision every time)
    vi.mocked(redisClient.exists).mockResolvedValue(1);

    await expect(roomService.createRoom()).rejects.toThrow('SLUG_GENERATION_FAILED');
    
    // Verify exists was checked exactly 5 times
    expect(redisClient.exists).toHaveBeenCalledTimes(5);
  });

  it('4. Collision retry logic succeeds if a unique slug is found within 5 attempts', async () => {
    // Mock exists to return 1 (collision) for the first 3 attempts, and then 0 (success) on 4th
    let existsCallCount = 0;
    vi.mocked(redisClient.exists).mockImplementation(async () => {
      existsCallCount++;
      return existsCallCount <= 3 ? 1 : 0;
    });

    const result = await roomService.createRoom();

    expect(result.success).toBe(true);
    expect(result.roomName).toMatch(/^[a-z]+-[a-z]+-[0-9]{4}$/);
    expect(redisClient.exists).toHaveBeenCalledTimes(4);
  });
});
