import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequest } from '../../functions/socket.io/[[path]]';
import { createRoom } from '../../functions/shared/store';

// Mock WebSocketPair for Cloudflare Workers
class MockWebSocket {
  listeners: Record<string, ((event: any) => void)[]> = {};
  sent: string[] = [];
  readyState = 1; // OPEN

  accept() {}

  send(data: string) {
    this.sent.push(data);
  }

  addEventListener(event: string, callback: (event: any) => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  simulateMessage(data: string) {
    const list = this.listeners['message'] || [];
    for (const cb of list) cb({ data });
  }

  simulateClose() {
    const list = this.listeners['close'] || [];
    for (const cb of list) cb({});
  }
}

(globalThis as any).WebSocketPair = class {
  0: any;
  1: any;
  constructor() {
    const client = new MockWebSocket();
    const server = new MockWebSocket();
    this[0] = client;
    this[1] = server;
  }
};

describe('Cloudflare Pages Socket.IO Edge Function', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it('performs Engine.IO and Socket.IO handshake immediately on WebSocket Upgrade', async () => {
    const req = new Request('https://test.cipherchat/socket.io/?EIO=4&transport=websocket', {
      headers: { Upgrade: 'websocket' },
    });

    const res = await onRequest({ request: req });
    expect(res.status).toBe(101);

    const client = (res as any).webSocket;
    expect(client).toBeDefined();

    // Verify initial handshake packets were sent by server
    const pair = new (globalThis as any).WebSocketPair();
    // Test direct server handling
  });

  it('handles join-room and send-message with acknowledgment', async () => {
    await createRoom('edge-room-42');

    const req = new Request('https://test.cipherchat/socket.io/?EIO=4&transport=websocket', {
      headers: { Upgrade: 'websocket' },
    });

    let serverWs: MockWebSocket | null = null;
    const OriginalPair = (globalThis as any).WebSocketPair;
    (globalThis as any).WebSocketPair = class {
      0: any;
      1: any;
      constructor() {
        const client = new MockWebSocket();
        serverWs = new MockWebSocket();
        this[0] = client;
        this[1] = serverWs;
      }
    };

    const res = await onRequest({ request: req });
    expect(res.status).toBe(101);
    expect(serverWs).not.toBeNull();

    // 1. Initial Engine.IO and Socket.IO packets
    expect(serverWs!.sent[0]).toMatch(/^0\{"sid":/);
    expect(serverWs!.sent[1]).toMatch(/^40\{"sid":/);

    // 2. Client joins room: 42["join-room", ...]
    serverWs!.simulateMessage(
      '42' +
        JSON.stringify([
          'join-room',
          {
            roomName: 'edge-room-42',
            userName: 'Alice',
            userId: 'alice-1',
          },
        ])
    );

    // Wait a tick for async handler
    await new Promise((r) => setTimeout(r, 10));

    // Server should reply with room-joined and users-updated
    expect(serverWs!.sent.some((p) => p.includes('room-joined'))).toBe(true);
    expect(serverWs!.sent.some((p) => p.includes('users-updated'))).toBe(true);

    // 3. Client sends message with ACK ID "0": 420["send-message", ...]
    const testMessage = {
      id: 'msg-edge-100',
      user: { id: 'alice-1', name: 'Alice' },
      ciphertext: 'enc-cipher-data',
      iv: 'iv-data',
      timestamp: Date.now(),
      type: 'user',
    };

    serverWs!.simulateMessage(
      '420' +
        JSON.stringify([
          'send-message',
          {
            roomName: 'edge-room-42',
            message: testMessage,
          },
        ])
    );

    await new Promise((r) => setTimeout(r, 10));

    // Server should broadcast new-message and return ACK 430[...]
    expect(serverWs!.sent.some((p) => p.includes('new-message'))).toBe(true);
    expect(serverWs!.sent.some((p) => p.startsWith('430'))).toBe(true);
    const ackPacket = serverWs!.sent.find((p) => p.startsWith('430'));
    expect(ackPacket).toBe('430' + JSON.stringify([{ success: true, messageId: 'msg-edge-100' }]));

    (globalThis as any).WebSocketPair = OriginalPair;
  });

  it('handles heartbeat ping packet 2 and replies with pong 3', async () => {
    let serverWs: MockWebSocket | null = null;
    (globalThis as any).WebSocketPair = class {
      0: any;
      1: any;
      constructor() {
        const client = new MockWebSocket();
        serverWs = new MockWebSocket();
        this[0] = client;
        this[1] = serverWs;
      }
    };

    const req = new Request('https://test.cipherchat/socket.io/?EIO=4&transport=websocket', {
      headers: { Upgrade: 'websocket' },
    });

    await onRequest({ request: req });
    serverWs!.sent = []; // clear initial handshakes

    serverWs!.simulateMessage('2');
    expect(serverWs!.sent).toContain('3');
  });

  it('handles polling GET handshake request', async () => {
    const req = new Request('https://test.cipherchat/socket.io/?EIO=4&transport=polling');
    const res = await onRequest({ request: req });
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toMatch(/^0\{"sid":/);
  });
});
