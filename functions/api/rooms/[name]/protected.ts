import { getRoom, isRoomProtected, handleOptions, jsonResponse } from '../../../shared/store';

const ROOM_NAME_REGEX = /^[a-z0-9_-]+$/i;

export const onRequestOptions = () => handleOptions();

export const onRequestGet = async (context: {
  params: { name?: string | string[] };
  env?: { CIPHERCHAT_KV?: any };
}) => {
  try {
    const rawName = context.params.name;
    const name = Array.isArray(rawName) ? rawName[0] : rawName;

    if (!name || typeof name !== 'string' || !ROOM_NAME_REGEX.test(name)) {
      return jsonResponse({ error: 'Invalid room slug format' }, 400);
    }

    const room = await getRoom(name, context.env?.CIPHERCHAT_KV);
    if (!room) {
      return jsonResponse({ error: 'Room not found' }, 404);
    }

    const isProtected = await isRoomProtected(name, context.env?.CIPHERCHAT_KV);
    return jsonResponse({ isProtected });
  } catch {
    return jsonResponse({ error: 'Failed to check room protection' }, 500);
  }
};
