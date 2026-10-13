import { getRoom, verifyRoomPassword, storeFile, handleOptions, jsonResponse } from '../../shared/store';

export const onRequestOptions = () => handleOptions();

export const onRequestPost = async (context: {
  request: Request;
  env?: { CIPHERCHAT_KV?: any };
}) => {
  try {
    const req = context.request;
    const roomName = req.headers.get('x-room-name');

    if (!roomName || !/^[a-z0-9_-]+$/i.test(roomName.trim())) {
      return jsonResponse({ error: 'Valid room name is required' }, 400);
    }

    const room = await getRoom(roomName, context.env?.CIPHERCHAT_KV);
    if (!room) {
      return jsonResponse({ error: 'Room not found or expired' }, 404);
    }

    if (room.passwordHash) {
      const roomPassword = req.headers.get('x-room-password');
      if (!roomPassword) {
        return jsonResponse({ error: 'Password required' }, 401);
      }
      const isValid = await verifyRoomPassword(roomName, roomPassword, context.env?.CIPHERCHAT_KV);
      if (!isValid) {
        return jsonResponse({ error: 'Invalid room password' }, 401);
      }
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return jsonResponse({ error: 'No file uploaded' }, 400);
    }

    const fileId = 'file-' + crypto.randomUUID().replace(/-/g, '');
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);
    const mediaType = file.type.startsWith('image/') ? 'image' : 'file';

    await storeFile(
      {
        fileId,
        filename: file.name,
        roomName: room.name,
        mimetype: file.type || 'application/octet-stream',
        size: data.byteLength,
        data,
        mediaType,
        uploadedAt: Date.now(),
      },
      context.env?.CIPHERCHAT_KV
    );

    return jsonResponse({
      success: true,
      fileId,
      filename: file.name,
      mediaType,
      url: `/api/files/${fileId}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to upload file';
    return jsonResponse({ error: message }, 500);
  }
};
