import { createRoom, handleOptions, jsonResponse } from '../../shared/store';

const ROOM_NAME_REGEX = /^[a-z0-9_-]+$/;
const ALLOWED_TTLS = [3600, 21600, 86400, 604800, 2];

export const onRequestOptions = () => handleOptions();

export const onRequestPost = async (context: { request: Request; env?: { CIPHERCHAT_KV?: any } }) => {
  try {
    const body = (await context.request.json()) as {
      roomName?: string;
      password?: string;
      ttl?: number;
    };

    let { roomName, password, ttl } = body;

    if (roomName !== undefined) {
      if (typeof roomName !== 'string') {
        return jsonResponse({ error: 'Room name is required' }, 400);
      }
      roomName = roomName.trim().toLowerCase();
      if (roomName.length > 64) {
        return jsonResponse({ error: 'Room name must be 64 characters or less' }, 400);
      }
      if (!ROOM_NAME_REGEX.test(roomName)) {
        return jsonResponse(
          { error: 'Room name can only contain lowercase letters, numbers, hyphens, and underscores' },
          400
        );
      }
    } else {
      roomName = `vault-${Math.random().toString(36).substring(2, 8)}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    if (password !== undefined && typeof password !== 'string') {
      return jsonResponse({ error: 'Password must be a valid string' }, 400);
    }

    if (ttl !== undefined && !ALLOWED_TTLS.includes(Number(ttl))) {
      return jsonResponse({ error: 'Invalid TTL value. Allowed values are: 1h, 6h, 24h, 7d' }, 400);
    }

    if (password && password.length < 8) {
      return jsonResponse({ error: 'Password must be at least 8 characters long' }, 400);
    }

    if (password && password.length > 72) {
      return jsonResponse({ error: 'Password cannot exceed 72 characters' }, 400);
    }

    const ttlSeconds = Number(ttl) || 3600;
    const result = await createRoom(roomName, password, ttlSeconds, 50, context.env?.CIPHERCHAT_KV);

    return jsonResponse({ success: true, roomName: result.roomName });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
    if (message === 'ROOM_ALREADY_EXISTS') {
      return jsonResponse({ error: 'Room already exists' }, 409);
    }
    return jsonResponse({ error: 'Failed to create room' }, 500);
  }
};
