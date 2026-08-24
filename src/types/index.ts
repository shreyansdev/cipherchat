export interface User {
  id: string;
  name: string;
}

export interface TypingUser {
  userId: string;
  userName: string;
}

export interface Message {
  id: string;
  user: User;
  text?: string;
  ciphertext?: string;
  iv?: string;
  timestamp: number;
  type: 'user' | 'system';
  status?: 'sending' | 'delivered' | 'seen';
  mediaUrl?: string;
  mediaType?: 'image' | 'file';
  fileName?: string;
  fileSize?: number;
}

export type JoinError = 
  | 'WRONG_PASSWORD'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'NETWORK_ERROR'
  | 'RATE_LIMITED'
  | 'ROOM_EXPIRED'
  | 'SERVER_RESTARTING'
  | 'CONNECTION_LOST';

export interface ChatState {
  users: User[];
  messages: Message[];
  typingUsers: TypingUser[];
  error?: JoinError | null;
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected' | 'failed';
  roomSlug?: string | null;
}

// API Response Types
export interface RoomCreateResponse {
  success: boolean;
  roomName: string;
}

export interface RoomVerifyResponse {
  success: boolean;
  valid: boolean;
  error?: string;
}

export interface FileUploadResponse {
  success: boolean;
  fileId: string;
  filename: string;
  mediaType: 'image' | 'file';
  url: string;
}

// Socket Payload Types
export interface JoinRoomPayload {
  roomName: string;
  userName: string;
  userId: string;
}

export interface TypingPayload {
  roomName: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface SendMessagePayload {
  roomName: string;
  message: Message;
}
