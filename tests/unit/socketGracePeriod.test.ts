import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../server/config/redis.js', () => ({
  default: {
    duplicate: vi.fn(() => ({
      on: vi.fn(),
      connect: vi.fn().mockResolvedValue(undefined),
      quit: vi.fn().mockResolvedValue(undefined),
    })),
    exists: vi.fn(),
    del: vi.fn(),
    hGet: vi.fn().mockResolvedValue('50'),
  },
}));

vi.mock('../../server/services/roomService.js', () => ({
  addUserToRoom: vi.fn(),
  removeUserFromRoom: vi.fn(),
  getRoomUsers: vi.fn(),
  deleteRoom: vi.fn(),
  getRoomData: vi.fn(),
  verifyRoomPassword: vi.fn(),
}));

vi.mock('../../server/services/messageService.js', () => ({
  storeMessage: vi.fn(),
  getRoomMessages: vi.fn(),
}));

vi.mock('../../server/services/presenceService.js', () => ({
  registerSession: vi.fn().mockResolvedValue(true),
  removeSession: vi.fn().mockResolvedValue(true),
  getUserCount: vi.fn().mockResolvedValue(0),
}));

vi.mock('@socket.io/redis-adapter', () => ({
  createAdapter: vi.fn(() => vi.fn()),
}));

import { setupSocketHandlers, closeSocketServices, emptyRoomTimers, getEmptyRoomGracePeriodMs } from '../../server/config/socket.js';
import * as roomService from '../../server/services/roomService.js';

describe('Socket Empty Room Grace Period Auto-Deletion Unit Tests', () => {
  let mockIo: any;
  let connectionHandler: any;
  let mockSocket: any;
  let socketEventHandlers: Record<string, (...args: any[]) => any> = {};

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    emptyRoomTimers.clear();

    socketEventHandlers = {};
    mockSocket = {
      id: 'socket-test-1',
      connected: true,
      join: vi.fn(),
      emit: vi.fn(),
      to: vi.fn().mockReturnValue({ emit: vi.fn() }),
      rooms: new Set(['alpha-beta-1234']),
      userData: null,
      on: vi.fn((event: string, handler: (...args: any[]) => any) => {
        socketEventHandlers[event] = handler;
      }),
    };

    mockIo = {
      adapter: vi.fn(),
      on: vi.fn((event: string, handler: (...args: any[]) => any) => {
        if (event === 'connection') {
          connectionHandler = handler;
        }
      }),
      to: vi.fn().mockReturnValue({ emit: vi.fn() }),
    };

    await setupSocketHandlers(mockIo);
    if (connectionHandler) {
      connectionHandler(mockSocket);
    }
  });

  afterEach(async () => {
    await closeSocketServices();
    vi.useRealTimers();
  });

  it('starts a grace period timer when the last user disconnects and deletes the room when timer expires', async () => {
    mockSocket.userData = {
      roomName: 'alpha-beta-1234',
      userName: 'Alice',
      userId: 'u1',
    };

    // When Alice disconnects, remaining users in room is 0
    vi.mocked(roomService.getRoomUsers).mockResolvedValue([]);
    vi.mocked(roomService.deleteRoom).mockResolvedValue(true);

    expect(emptyRoomTimers.has('alpha-beta-1234')).toBe(false);

    // Trigger disconnect
    await socketEventHandlers['disconnect']();

    // Timer should now be active
    expect(emptyRoomTimers.has('alpha-beta-1234')).toBe(true);
    expect(roomService.deleteRoom).not.toHaveBeenCalled();

    // Advance time by grace period duration
    const graceMs = getEmptyRoomGracePeriodMs();
    await vi.advanceTimersByTimeAsync(graceMs + 100);

    // deleteRoom should have been called
    expect(roomService.deleteRoom).toHaveBeenCalledWith('alpha-beta-1234');
    expect(emptyRoomTimers.has('alpha-beta-1234')).toBe(false);
  });

  it('cancels the grace period timer if a user rejoins before the timer expires', async () => {
    mockSocket.userData = {
      roomName: 'alpha-beta-1234',
      userName: 'Alice',
      userId: 'u1',
    };

    // Alice disconnects -> room empty
    vi.mocked(roomService.getRoomUsers).mockResolvedValue([]);
    await socketEventHandlers['disconnect']();
    expect(emptyRoomTimers.has('alpha-beta-1234')).toBe(true);

    // Bob joins before grace period expires
    vi.mocked(roomService.getRoomData).mockResolvedValue({ remainingTtl: 3600, maxUsers: '50' } as any);
    vi.mocked(roomService.addUserToRoom).mockResolvedValue(true);
    vi.mocked(roomService.getRoomUsers).mockResolvedValue([{ id: 'u2', name: 'Bob' }]);

    await socketEventHandlers['join-room']({
      roomName: 'alpha-beta-1234',
      userName: 'Bob',
      userId: 'u2',
    });

    // Timer should be cancelled
    expect(emptyRoomTimers.has('alpha-beta-1234')).toBe(false);

    // Advance time beyond initial grace period
    const graceMs = getEmptyRoomGracePeriodMs();
    await vi.advanceTimersByTimeAsync(graceMs + 100);

    // Room was NOT deleted
    expect(roomService.deleteRoom).not.toHaveBeenCalled();
  });

  it('does not delete room if other users remain when a user disconnects', async () => {
    mockSocket.userData = {
      roomName: 'alpha-beta-1234',
      userName: 'Alice',
      userId: 'u1',
    };

    // Alice disconnects, but Bob is still in the room
    vi.mocked(roomService.getRoomUsers).mockResolvedValue([{ id: 'u2', name: 'Bob' }]);

    await socketEventHandlers['disconnect']();

    // No timer started because room is not empty
    expect(emptyRoomTimers.has('alpha-beta-1234')).toBe(false);
    expect(roomService.deleteRoom).not.toHaveBeenCalled();
  });
});
