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

    server.addEventListener('message', async (event: any) => {
      try {
        const text = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data);

        // Engine.IO upgrade probe handshake
        if (text === '2probe') {
          server.send('3probe');
          return;
        }

        if (text === '5') {
          return;
        }

        // Engine.IO Heartbeat Ping/Pong
        if (text === '2') {
          server.send('3');
          return;
        }

        // Socket.IO event packet format: 42["eventName", payload]
        if (text.startsWith('42')) {
          const jsonStr = text.slice(2);
          const parsed = JSON.parse(jsonStr) as [string, any];
          const [eventName, payload] = parsed;

          if (eventName === 'join-room') {
            const { roomName, userName, userId, password } = payload || {};
            if (!roomName || !userId) return;

            const room = await getRoom(roomName, kv);
            if (room && room.passwordHash) {
              const isValid = await verifyRoomPassword(roomName, password || '', kv);
              if (!isValid) {
                server.send(
                  '42' + JSON.stringify(['error', { code: 'INVALID_PASSWORD', message: 'Invalid room password' }])
                );
                return;
              }
            }

            currentSocketId = crypto.randomUUID();
            currentRoomName = roomName;

            addSession({
              socketId: currentSocketId,
              roomName,
              userId,
              userName: userName || 'anonymous',
              ws: server,
            });

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
            const users = getRoomUsers(roomName);
            server.send('42' + JSON.stringify(['users-updated', users]));
            broadcastToRoom(roomName, '42' + JSON.stringify(['users-updated', users]), currentSocketId);

            // Send historical encrypted messages
            const history = getMessageHistory(roomName);
            if (history.length > 0) {
              server.send('42' + JSON.stringify(['message-history', history]));
            }
          } else if (eventName === 'send-message') {
            const { roomName, message } = payload || {};
            if (!roomName || !message) return;

            addMessage(roomName, message);
            broadcastToRoom(roomName, '42' + JSON.stringify(['new-message', message]));
          } else if (eventName === 'typing') {
            const { roomName, userId, userName, isTyping } = payload || {};
            if (!roomName) return;

            broadcastToRoom(
              roomName,
              '42' + JSON.stringify(['user-typing', { userId, userName, isTyping }]),
              currentSocketId || undefined
            );
          }
        }
      } catch {
        // Safe error handling for malformed packets
      }
    });

    server.addEventListener('close', () => {
      if (currentSocketId) {
        const { roomName, remainingUsers } = removeSession(currentSocketId);
        if (roomName) {
          broadcastToRoom(roomName, '42' + JSON.stringify(['users-updated', remainingUsers]));
        }
      }
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
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
