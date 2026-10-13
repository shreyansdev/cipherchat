import { verifyRoomPassword, handleOptions, jsonResponse } from '../../shared/store';

export const onRequestOptions = () => handleOptions();

export const onRequestPost = async (context: {
  request: Request;
  env?: { CIPHERCHAT_KV?: any };
}) => {
  try {
    const body = (await context.request.json()) as {
      roomName?: string;
      password?: string;
    };

    const { roomName, password } = body;

    if (!roomName || !password || typeof roomName !== 'string' || typeof password !== 'string') {
      return jsonResponse({ error: 'Room name and password are required' }, 400);
    }

    if (password.length > 72) {
      return jsonResponse({ error: 'Password cannot exceed 72 characters' }, 400);
    }

    const isValid = await verifyRoomPassword(roomName, password, context.env?.CIPHERCHAT_KV);
    if (isValid) {
      return jsonResponse({ success: true, valid: true });
    } else {
      return jsonResponse({ success: false, valid: false, error: 'Invalid password' }, 401);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
    if (message === 'Room not found') {
      return jsonResponse({ error: 'Room not found' }, 404);
    }
    return jsonResponse({ error: 'Failed to verify password' }, 500);
  }
};
