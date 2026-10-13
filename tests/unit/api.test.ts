import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoom, checkRoomProtection, verifyRoomPassword } from '../../src/lib/api';
import { ERROR_CODES } from '../../src/lib/errors';

describe('Client API Module Unit Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('createRoom posts payload and returns created room data', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, roomName: 'test-room-1234' }),
    } as unknown as Response);

    const result = await createRoom('test-room-1234', 'secret123', 3600);
    expect(result.success).toBe(true);
    expect(result.roomName).toBe('test-room-1234');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/rooms/create'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Headers),
        body: JSON.stringify({ roomName: 'test-room-1234', password: 'secret123', ttl: 3600 }),
      })
    );
  });

  it('createRoom maps 429 response to RATE_LIMITED error code', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
    } as unknown as Response);

    await expect(createRoom('test-room')).rejects.toThrow(ERROR_CODES.RATE_LIMITED);
  });

  it('checkRoomProtection queries protection endpoint and returns boolean', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ isProtected: true }),
    } as unknown as Response);

    const isProtected = await checkRoomProtection('locked-vault');
    expect(isProtected).toBe(true);
  });

  it('checkRoomProtection maps 404 response to ROOM_NOT_FOUND error code', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as unknown as Response);

    await expect(checkRoomProtection('unknown-room')).rejects.toThrow(ERROR_CODES.ROOM_NOT_FOUND);
  });

  it('verifyRoomPassword maps 401 response to WRONG_PASSWORD error code', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    } as unknown as Response);

    await expect(verifyRoomPassword('vault', 'bad-pass')).rejects.toThrow(ERROR_CODES.WRONG_PASSWORD);
  });
});
