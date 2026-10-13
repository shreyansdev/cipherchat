/**
 * Edge store for Cloudflare Pages Functions
 * Ephemeral room metadata, message history, files, and socket presence.
 * Supports both Cloudflare KV (persistent across edge PoPs) and in-memory fallback.
 */

export interface RoomMeta {
  name: string;
  createdAt: string;
  passwordHash?: string;
  salt?: string;
  ttlSeconds: number;
  expiresAt: number;
  maxUsers: number;
}

export interface StoredMessage {
  id: string;
  type: string;
  text?: string;
  ciphertext?: string;
  iv?: string;
  timestamp: string | number;
  user: { id: string; name: string };
  mediaUrl?: string;
  mediaType?: 'image' | 'file';
  fileName?: string;
  fileSize?: number;
}

export interface StoredFile {
  fileId: string;
  filename: string;
  roomName: string;
  mimetype: string;
  size: number;
  data: Uint8Array;
  mediaType: 'image' | 'file';
  uploadedAt: number;
}

export interface UserSession {
  userId: string;
  userName: string;
  roomName: string;
  socketId: string;
  ws?: WebSocket;
}

// In-memory state persistent across requests within the worker isolate
const rooms = new Map<string, RoomMeta>();
const messageHistories = new Map<string, StoredMessage[]>();
const files = new Map<string, StoredFile>();
const sessions = new Map<string, UserSession>();

/**
 * Purges rooms and associated artifacts that have passed their TTL
 */
export function cleanExpired(): void {
  const now = Date.now();
  for (const [slug, room] of rooms.entries()) {
    if (now > room.expiresAt) {
      rooms.delete(slug);
      messageHistories.delete(slug);
      for (const [fileId, file] of files.entries()) {
        if (file.roomName === slug) {
          files.delete(fileId);
        }
      }
    }
  }
}

/**
 * Cryptographically derives a PBKDF2-SHA256 password hash using Web Crypto
 */
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  const saltHex = Array.from(saltBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(derivedBits)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return { hash: hashHex, salt: saltHex };
}

/**
 * Validates a password against stored PBKDF2 hash
 */
export async function verifyPasswordHash(password: string, expectedHash: string, saltHex: string): Promise<boolean> {
  const enc = new TextEncoder();
  const matched = saltHex.match(/.{1,2}/g);
  if (!matched) return false;
  const saltBytes = new Uint8Array(matched.map((byte) => parseInt(byte, 16)));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  const hashHex = Array.from(new Uint8Array(derivedBits)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex === expectedHash;
}

export async function createRoom(
  roomName: string,
  password?: string,
  ttlSeconds = 3600,
  maxUsers = 50,
  kv?: any
): Promise<{ success: boolean; roomName: string }> {
  cleanExpired();
  const slug = roomName.trim().toLowerCase();

  // Check KV and local memory
  const existingLocal = rooms.get(slug);
  if (existingLocal && Date.now() <= existingLocal.expiresAt) {
    throw new Error('ROOM_ALREADY_EXISTS');
  }

  if (kv) {
    const existingKv = await kv.get(`room:${slug}`, 'json');
    if (existingKv && Date.now() <= existingKv.expiresAt) {
      throw new Error('ROOM_ALREADY_EXISTS');
    }
  }

  let passwordHash: string | undefined;
  let salt: string | undefined;
  if (password && password.trim() !== '') {
    const res = await hashPassword(password.trim());
    passwordHash = res.hash;
    salt = res.salt;
  }

  const roomMeta: RoomMeta = {
    name: slug,
    createdAt: new Date().toISOString(),
    passwordHash,
    salt,
    ttlSeconds,
    expiresAt: Date.now() + ttlSeconds * 1000,
    maxUsers,
  };

  rooms.set(slug, roomMeta);
  messageHistories.set(slug, []);

  if (kv) {
    // Cloudflare KV minimum TTL is 60s
    const expirationTtl = Math.max(60, ttlSeconds);
    await kv.put(`room:${slug}`, JSON.stringify(roomMeta), { expirationTtl });
  }

  return { success: true, roomName: slug };
}

export async function getRoom(roomName: string, kv?: any): Promise<RoomMeta | null> {
  cleanExpired();
  const slug = roomName.trim().toLowerCase();

  const local = rooms.get(slug);
  if (local) {
    if (Date.now() > local.expiresAt) {
      rooms.delete(slug);
      messageHistories.delete(slug);
      return null;
    }
    return local;
  }

  if (kv) {
    try {
      const kvRoom = (await kv.get(`room:${slug}`, 'json')) as RoomMeta | null;
      if (kvRoom) {
        if (Date.now() > kvRoom.expiresAt) {
          return null;
        }
        // Cache locally in this isolate
        rooms.set(slug, kvRoom);
        return kvRoom;
      }
    } catch {
      // KV read fallback
    }
  }

  return null;
}

export async function isRoomProtected(roomName: string, kv?: any): Promise<boolean> {
  const room = await getRoom(roomName, kv);
  if (!room) return false;
  return Boolean(room.passwordHash && room.passwordHash !== '');
}

export async function verifyRoomPassword(roomName: string, password: string, kv?: any): Promise<boolean> {
  const room = await getRoom(roomName, kv);
  if (!room) {
    throw new Error('Room not found');
  }
  if (!room.passwordHash || !room.salt) {
    return true; // No password required
  }
  return verifyPasswordHash(password, room.passwordHash, room.salt);
}

export async function storeFile(file: StoredFile, kv?: any): Promise<void> {
  files.set(file.fileId, file);
  if (kv) {
    try {
      // Store metadata in KV
      const meta = {
        fileId: file.fileId,
        filename: file.filename,
        roomName: file.roomName,
        mimetype: file.mimetype,
        size: file.size,
        mediaType: file.mediaType,
        uploadedAt: file.uploadedAt,
      };
      await kv.put(`file_meta:${file.fileId}`, JSON.stringify(meta), { expirationTtl: 3600 });
      // Base64 encode for KV storage
      let binary = '';
      for (let i = 0; i < file.data.byteLength; i++) {
        binary += String.fromCharCode(file.data[i]);
      }
      const b64 = btoa(binary);
      await kv.put(`file_data:${file.fileId}`, b64, { expirationTtl: 3600 });
    } catch {
      // KV storage fallback
    }
  }
}

export async function getFile(fileId: string, kv?: any): Promise<StoredFile | null> {
  cleanExpired();
  const local = files.get(fileId);
  if (local) return local;

  if (kv) {
    try {
      const meta = await kv.get(`file_meta:${fileId}`, 'json');
      const b64 = await kv.get(`file_data:${fileId}`);
      if (meta && b64) {
        const binStr = atob(b64);
        const data = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
          data[i] = binStr.charCodeAt(i);
        }
        const file: StoredFile = {
          ...meta,
          data,
        };
        files.set(fileId, file);
        return file;
      }
    } catch {
      // KV fallback
    }
  }

  return null;
}

export function addSession(session: UserSession): void {
  sessions.set(session.socketId, session);
}

export function removeSession(socketId: string): { roomName?: string; remainingUsers: Array<{ id: string; name: string }> } {
  const session = sessions.get(socketId);
  if (!session) return { remainingUsers: [] };
  const roomName = session.roomName;
  sessions.delete(socketId);
  const remaining = getRoomUsers(roomName);
  return { roomName, remainingUsers: remaining };
}

export function getRoomUsers(roomName: string): Array<{ id: string; name: string }> {
  const map = new Map<string, string>();
  for (const session of sessions.values()) {
    if (session.roomName === roomName) {
      map.set(session.userId, session.userName);
    }
  }
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
}

export function addMessage(roomName: string, message: StoredMessage): void {
  let list = messageHistories.get(roomName);
  if (!list) {
    list = [];
    messageHistories.set(roomName, list);
  }
  list.push(message);
  if (list.length > 100) {
    list.splice(0, list.length - 100);
  }
}

export function getMessageHistory(roomName: string): StoredMessage[] {
  return messageHistories.get(roomName) || [];
}

export function broadcastToRoom(roomName: string, packet: string, excludeSocketId?: string): void {
  for (const session of sessions.values()) {
    if (session.roomName === roomName && session.socketId !== excludeSocketId && session.ws) {
      try {
        if (session.ws.readyState === WebSocket.OPEN) {
          session.ws.send(packet);
        }
      } catch {
        // Socket send error, will be cleaned up on close
      }
    }
  }
}

export function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-room-name, x-room-password',
      ...headers,
    },
  });
}

export function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-room-name, x-room-password',
      'Access-Control-Max-Age': '86400',
    },
  });
}
