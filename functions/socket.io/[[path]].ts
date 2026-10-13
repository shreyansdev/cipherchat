import {
  getRoom,
  verifyRoomPassword,
  addSession,
  removeSession,
  getRoomUsers,
  addMessage,
  getMessageHistory,
  broadcastToRoom,
  handleOptions,
} from '../shared/store';

export const onRequestOptions = () => handleOptions();

export const onRequest = async (context: { request: Request; env?: { CIPHERCHAT_KV?: any } }) => {
  const req = context.request;
  const kv = context.env?.CIPHERCHAT_KV;

  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  // Handle WebSocket Upgrade
  if (req.headers.get('Upgrade') === 'websocket') {
    // Cloudflare Workers WebSocketPair
    const pair = new (globalThis as any).WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    server.accept();

    let currentSocketId: string | null = null;
    let currentRoomName: string | null = null;
    const lastSeenMessageIds = new Set<string>();
    let lastUsersHash = '';

    // Send Engine.IO open handshake packet (0) and Socket.IO connect packet (40) immediately
    const sid = crypto.randomUUID().replace(/-/g, '');
    const handshake = JSON.stringify({
      sid,
      upgrades: [],
      pingInterval: 25000,
      pingTimeout: 20000,
      maxPayload: 1000000,
    });
    server.send(`0${handshake}`);
    server.send(`40{"sid":"${sid}"}`);

    // Heartbeat ping interval to keep connection alive
    const pingTimer = setInterval(() => {
      try {
        if (server.readyState === WebSocket.OPEN) {
          server.send('2');
        } else {
          clearInterval(pingTimer);
        }
      } catch {
        clearInterval(pingTimer);
      }
    }, 20000);

    // Cross-isolate synchronization timer: checks KV every 1s for new messages and user updates
    const syncTimer = setInterval(async () => {
      try {
        if (server.readyState !== WebSocket.OPEN) {
          clearInterval(syncTimer);
          return;
        }
        if (!currentRoomName) return;

        // 1. Sync messages from KV across edge isolates
        const history = await getMessageHistory(currentRoomName, kv);
        if (Array.isArray(history)) {
          for (const msg of history) {
            if (!lastSeenMessageIds.has(msg.id)) {
              lastSeenMessageIds.add(msg.id);
              server.send('42' + JSON.stringify(['new-message', msg]));
            }
          }
        }

        // 2. Sync room participants from KV across edge isolates
        const users = await getRoomUsers(currentRoomName, kv);
        if (Array.isArray(users)) {
          const usersHash = JSON.stringify(users);
          if (usersHash !== lastUsersHash) {
            lastUsersHash = usersHash;
            server.send('42' + JSON.stringify(['users-updated', users]));
          }
        }
      } catch {
        // Silent catch for background isolate sync
      }
    }, 1000);

    server.addEventListener('message', async (event: any) => {
      try {
        const text = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data);

        // Engine.IO Heartbeat Ping/Pong
        if (text === '2') {
          server.send('3');
          return;
        }

        if (text === '3') {
          // Pong response from client
          return;
        }

        // Engine.IO upgrade probe handshake
        if (text === '2probe') {
          server.send('3probe');
          return;
        }

        if (text === '5') {
          return;
        }

        // Socket.IO event packet format: 42[<ackId>]["eventName", payload]
        const eventMatch = text.match(/^42(\d*)(.*)$/);
        if (eventMatch) {
          const ackId = eventMatch[1];
          const jsonStr = eventMatch[2];
          const parsed = JSON.parse(jsonStr) as [string, any];
          const [eventName, payload] = parsed;

          if (eventName === 'join-room') {
            const { roomName, userName, userId, password } = payload || {};
            if (!roomName || !userId) return;

            const room = await getRoom(roomName, kv);
            if (room && room.passwordHash) {
              const isValid = await verifyRoomPassword(roomName, password || '', kv);
              if (!isValid) {
                if (ackId) {
                  server.send('43' + ackId + JSON.stringify([{ success: false, error: 'INVALID_PASSWORD' }]));
                }
                server.send(
                  '42' + JSON.stringify(['error', { code: 'INVALID_PASSWORD', message: 'Invalid room password' }])
                );
                return;
              }
            }

            currentSocketId = crypto.randomUUID();
            currentRoomName = roomName;

            const users = await addSession(
              {
                socketId: currentSocketId,
                roomName,
                userId,
                userName: userName || 'anonymous',
                ws: server,
              },
              kv
            );
            lastUsersHash = JSON.stringify(users);

            const remainingTtl = room
              ? Math.max(0, Math.floor((room.expiresAt - Date.now()) / 1000))
              : 3600;

            // Confirm join
            server.send(
              '42' +
                JSON.stringify([
                  'room-joined',
                  { roomName, remainingTtl, maxUsers: room?.maxUsers || 50 },
                ])
            );

            // Send updated participant list
            server.send('42' + JSON.stringify(['users-updated', users]));
            broadcastToRoom(roomName, '42' + JSON.stringify(['users-updated', users]), currentSocketId);

            // Send historical encrypted messages
            const history = await getMessageHistory(roomName, kv);
            if (Array.isArray(history)) {
              for (const m of history) {
                lastSeenMessageIds.add(m.id);
              }
              if (history.length > 0) {
                server.send('42' + JSON.stringify(['message-history', history]));
              }
            }

            if (ackId) {
              server.send('43' + ackId + JSON.stringify([{ success: true }]));
            }
          } else if (eventName === 'send-message') {
            const { roomName, message } = payload || {};
            if (!roomName || !message) return;

            lastSeenMessageIds.add(message.id);
            await addMessage(roomName, message, kv);
            broadcastToRoom(roomName, '42' + JSON.stringify(['new-message', message]));

            // Send acknowledgment back to client
            if (ackId) {
              server.send('43' + ackId + JSON.stringify([{ success: true, messageId: message.id }]));
            }
          } else if (eventName === 'typing') {
            const { roomName, userId, userName, isTyping } = payload || {};
            if (!roomName) return;

            broadcastToRoom(
              roomName,
              '42' + JSON.stringify(['user-typing', { userId, userName, isTyping }]),
              currentSocketId || undefined
            );

            if (ackId) {
              server.send('43' + ackId + JSON.stringify([{ success: true }]));
            }
          }
        }
      } catch (err) {
        console.error('Error handling socket message:', err);
      }
    });

    server.addEventListener('close', async () => {
      clearInterval(pingTimer);
      clearInterval(syncTimer);
      if (currentSocketId) {
        const { roomName, remainingUsers } = await removeSession(currentSocketId, kv);
        if (roomName) {
          broadcastToRoom(roomName, '42' + JSON.stringify(['users-updated', remainingUsers]));
        }
      }
    });

    server.addEventListener('error', () => {
      clearInterval(pingTimer);
      clearInterval(syncTimer);
    });

    try {
      return new Response(null, {
        status: 101,
        webSocket: client,
      } as any);
    } catch {
      const res = new Response(null, { status: 200 });
      Object.defineProperty(res, 'status', { value: 101 });
      (res as any).webSocket = client;
      return res;
    }
  }

  // Handle HTTP Polling fallback
  const url = new URL(req.url);
  const sid = url.searchParams.get('sid');
  const headers = {
    'Content-Type': 'text/plain; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-room-name, x-room-password',
  };

  if (req.method === 'GET') {
    if (!sid) {
      // Handshake packet
      const newSid = crypto.randomUUID().replace(/-/g, '');
      const handshake = JSON.stringify({
        sid: newSid,
        upgrades: ['websocket'],
        pingInterval: 25000,
        pingTimeout: 5000,
        maxPayload: 1000000,
      });
      return new Response(`0${handshake}`, { status: 200, headers });
    }
    // Socket.IO connect packet
    return new Response(`40{"sid":"${sid}"}`, { status: 200, headers });
  }

  if (req.method === 'POST') {
    return new Response('ok', { status: 200, headers });
  }

  return new Response('Not found', { status: 404, headers });
};
