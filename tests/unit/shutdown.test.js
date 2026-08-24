import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import process from 'process';
import http from 'http';
import { EventEmitter } from 'events';

const mockHttpServer = new EventEmitter();
mockHttpServer.listen = vi.fn((port, cb) => cb && cb());
mockHttpServer.close = vi.fn((cb) => {
  if (cb) cb();
  return mockHttpServer;
});

vi.spyOn(http, 'createServer').mockReturnValue(mockHttpServer);

vi.mock('socket.io', () => {
  return {
    Server: vi.fn().mockImplementation(() => {
      return {
        close: vi.fn(),
        adapter: vi.fn(),
        on: vi.fn(),
        sockets: {
          sockets: {
            size: 15,
          },
        },
      };
    }),
  };
});

vi.mock('../../server/config/redis.js', () => ({
  default: {
    quit: vi.fn().mockResolvedValue(true),
    connect: vi.fn().mockResolvedValue(true),
  },
  connectRedis: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../server/config/socket.js', () => ({
  setupSocketHandlers: vi.fn().mockResolvedValue(true),
  closeSocketServices: vi.fn().mockResolvedValue(true),
}));

describe('Server Graceful Shutdown', () => {
  let exitSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('SIGTERM graceful shutdown flow closes HTTP server, Socket.IO, Redis, and exits with 0', async () => {
    const { gracefulShutdown } = await import('../../server/server.js');

    await gracefulShutdown('SIGTERM');

    // HTTP server closed
    expect(mockHttpServer.close).toHaveBeenCalled();

    // Redis adapter quit
    const { closeSocketServices } = await import('../../server/config/socket.js');
    expect(closeSocketServices).toHaveBeenCalled();

    // Main Redis client quit
    const { default: redisClient } = await import('../../server/config/redis.js');
    expect(redisClient.quit).toHaveBeenCalled();

    // Process exits with code 0
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});
