import { describe, it, expect } from 'vitest';
import {
  createRoom,
  getRoom,
  isRoomProtected,
  verifyRoomPassword,
  storeFile,
  getFile,
  addSession,
  removeSession,
  getRoomUsers,
  addMessage,
  getMessageHistory,
  cleanExpired,
} from '../../functions/shared/store';

describe('Edge Store Module Unit Tests', () => {
  it('creates an unpassworded room and verifies protection status', async () => {
    const res = await createRoom('open-lounge-1234', undefined, 3600);
    expect(res.success).toBe(true);
    expect(res.roomName).toBe('open-lounge-1234');

    const room = await getRoom('open-lounge-1234');
    expect(room).not.toBeNull();
    expect(room?.name).toBe('open-lounge-1234');
    expect(await isRoomProtected('open-lounge-1234')).toBe(false);

    // Unpassworded room password verification returns true
    const isValid = await verifyRoomPassword('open-lounge-1234', 'any-pass');
    expect(isValid).toBe(true);
  });

  it('creates a password-protected room and verifies password correctness', async () => {
    await createRoom('vault-alpha-9999', 'SuperSecretPass123', 3600);
    expect(await isRoomProtected('vault-alpha-9999')).toBe(true);

    const validAttempt = await verifyRoomPassword('vault-alpha-9999', 'SuperSecretPass123');
    expect(validAttempt).toBe(true);

    const invalidAttempt = await verifyRoomPassword('vault-alpha-9999', 'WrongPassword123');
    expect(invalidAttempt).toBe(false);
  });

  it('rejects duplicate room creation while room is active', async () => {
    await createRoom('unique-hub-0001', undefined, 3600);
    await expect(createRoom('unique-hub-0001', undefined, 3600)).rejects.toThrow('ROOM_ALREADY_EXISTS');
  });

  it('stores and retrieves ephemeral encrypted files', async () => {
    const fileBytes = new Uint8Array([1, 2, 3, 4, 5]);
    await storeFile({
      fileId: 'file-test-123',
      filename: 'secret.enc',
      roomName: 'open-lounge-1234',
      mimetype: 'application/octet-stream',
      size: fileBytes.byteLength,
      data: fileBytes,
      mediaType: 'file',
      uploadedAt: Date.now(),
    });

    const file = await getFile('file-test-123');
    expect(file).not.toBeNull();
    expect(file?.filename).toBe('secret.enc');
    expect(file?.size).toBe(5);
  });

  it('tracks user sessions and active room participants', () => {
    addSession({
      socketId: 'sock-1',
      roomName: 'session-room',
      userId: 'user-1',
      userName: 'Alice',
    });
    addSession({
      socketId: 'sock-2',
      roomName: 'session-room',
      userId: 'user-2',
      userName: 'Bob',
    });

    const users = getRoomUsers('session-room');
    expect(users).toHaveLength(2);
    expect(users.map((u) => u.name)).toContain('Alice');
    expect(users.map((u) => u.name)).toContain('Bob');

    const { remainingUsers } = removeSession('sock-1');
    expect(remainingUsers).toHaveLength(1);
    expect(remainingUsers[0]?.name).toBe('Bob');
  });

  it('stores and retrieves message history capped at 100', () => {
    const roomName = 'msg-room';
    for (let i = 0; i < 110; i++) {
      addMessage(roomName, {
        id: `msg-${i}`,
        type: 'user',
        text: `Message ${i}`,
        timestamp: Date.now(),
        user: { id: 'u1', name: 'Alice' },
      });
    }

    const history = getMessageHistory(roomName);
    expect(history).toHaveLength(100);
    expect(history[0]?.id).toBe('msg-10');
    expect(history[99]?.id).toBe('msg-109');
  });

  it('purges expired rooms and files', async () => {
    await createRoom('short-lived', undefined, -10); // already expired
    cleanExpired();
    expect(await getRoom('short-lived')).toBeNull();
  });
});
