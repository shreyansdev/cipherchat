import { useEffect, useCallback, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useChat } from '../contexts/ChatContext';
import { User, Message, TypingUser, JoinRoomPayload, TypingPayload, FileUploadResponse, SendMessagePayload } from '../types';
import { encryptMessage, decryptMessage, encryptFileBuffer } from '../lib/crypto';
import DOMPurify from 'dompurify';
import { ERROR_CODES, ERROR_MESSAGES } from '../lib/errors';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export const useSocketChat = (currentUser: User | null, roomName: string): {
  sendMessage: (text: string, file?: File) => Promise<void>;
  sendTypingIndicator: (isTyping: boolean) => void;
} => {
  const { dispatch, encryptionKey, roomPassword } = useChat();
  const socketRef = useRef<Socket | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const isMounted = useRef(true);
  const reconnectionAttempts = useRef(0);
  const manualReconnectAttempts = useRef(0);
  const isReconnectingManually = useRef(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expiryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const encryptionKeyRef = useRef<CryptoKey | null>(encryptionKey);

  useEffect(() => {
    encryptionKeyRef.current = encryptionKey;
  }, [encryptionKey]);

  useEffect(() => {
    isMounted.current = true;
    if (!currentUser) return;

    // Create socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    // Custom manual reconnect with exponential backoff
    const attemptManualReconnect = () => {
      if (!isMounted.current) return;
      if (manualReconnectAttempts.current >= 5) {
        console.log('❌ Manual reconnection failed after 5 attempts.');
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'failed' });
        dispatch({ type: 'SET_ERROR', payload: 'CONNECTION_LOST' });
        isReconnectingManually.current = false;
        return;
      }

      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'reconnecting' });
      dispatch({ type: 'SET_ERROR', payload: 'SERVER_RESTARTING' });

      const delay = Math.min(Math.pow(2, manualReconnectAttempts.current) * 1000, 30000);
      console.log(`🔄 Attempting manual reconnect ${manualReconnectAttempts.current + 1}/5 in ${delay}ms...`);

      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isMounted.current) return;
        socket.connect();
      }, delay);
    };

    // Connection events
    const onConnect = () => {
      console.log('✅ Connected to server');
      reconnectionAttempts.current = 0;
      manualReconnectAttempts.current = 0;
      isReconnectingManually.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
      dispatch({ type: 'SET_ERROR', payload: null });

      const activePassword = roomPassword || '';

      const payload: JoinRoomPayload = {
        roomName,
        userName: currentUser.name,
        userId: currentUser.id,
        password: activePassword,
      };
      socket.emit('join-room', payload);
    };

    const onDisconnect = (reason: string) => {
      console.log('❌ Disconnected from server:', reason);
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
      
      if (reason === 'io server disconnect') {
        isReconnectingManually.current = true;
        manualReconnectAttempts.current = 0;
        attemptManualReconnect();
      }
    };

    const onConnectError = (error: Error) => {
      console.error('Connection error:', error);
      
      if (isReconnectingManually.current) {
        manualReconnectAttempts.current++;
        attemptManualReconnect();
      } else {
        reconnectionAttempts.current++;
        if (reconnectionAttempts.current >= 3) {
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'failed' });
          dispatch({ type: 'SET_ERROR', payload: 'NETWORK_ERROR' });
        } else {
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'reconnecting' });
        }
      }
    };

    const onReconnectAttempt = () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'reconnecting' });
    };

    // Room events
    const onUsersUpdated = (users: User[]) => {
      if (isMounted.current) {
        dispatch({ type: 'SET_USERS', payload: users });
      }
    };

    const onNewMessage = async (message: Message) => {
      let decryptedMessage = message;
      const currentKey = encryptionKeyRef.current;
      if (message.type === 'user' && message.ciphertext && message.iv && currentKey) {
        try {
          const text = await decryptMessage(message.ciphertext, message.iv, currentKey);
          decryptedMessage = { ...message, text };
        } catch (error) {
          console.error('Decryption failed for new message:', error);
          decryptedMessage = { ...message, text: '[Decryption Failed]' };
        }
      }
      if (isMounted.current) {
        dispatch({ type: 'ADD_MESSAGE', payload: decryptedMessage });
      }
    };

    const onError = (error: { message: string; code?: string }) => {
      console.error('Socket error:', error.message);
      if (error.code === 'ROOM_FULL') {
        dispatch({ type: 'SET_ERROR', payload: 'ROOM_FULL' });
      } else if (error.code === 'ROOM_NOT_FOUND') {
        dispatch({ type: 'SET_ERROR', payload: 'ROOM_NOT_FOUND' });
      } else if (error.code === 'RATE_LIMITED') {
        dispatch({ type: 'SET_ERROR', payload: 'RATE_LIMITED' });
      } else if (error.code === 'INVALID_PASSWORD' || error.code === 'PASSWORD_REQUIRED') {
        dispatch({ type: 'SET_ERROR', payload: 'WRONG_PASSWORD' });
      }
    };

    const onJoinError = (payload: { code: string; maxUsers?: number }) => {
      console.error('Join error:', payload);
      if (payload.code === 'ROOM_FULL') {
        dispatch({ type: 'SET_ERROR', payload: 'ROOM_FULL' });
      }
    };

    const onUserTyping = ({ userId, userName, isTyping }: TypingPayload) => {
      if (!isMounted.current) return;
      setTypingUsers(prev => {
        if (isTyping) {
          if (!prev.find(u => u.userId === userId)) {
            return [...prev, { userId, userName }];
          }
          return prev;
        } else {
          return prev.filter(u => u.userId !== userId);
        }
      });
    };

    const onMessageHistory = async (messages: Message[]) => {
      const currentKey = encryptionKeyRef.current;
      for (const message of messages) {
        let decryptedMessage = message;
        if (message.type === 'user' && message.ciphertext && message.iv && currentKey) {
          try {
            const text = await decryptMessage(message.ciphertext, message.iv, currentKey);
            decryptedMessage = { ...message, text };
          } catch (error) {
            console.error('Decryption failed for history message:', error);
            decryptedMessage = { ...message, text: '[Decryption Failed]' };
          }
        }
        if (isMounted.current) {
          dispatch({ type: 'ADD_MESSAGE', payload: decryptedMessage });
        }
      }
    };

    const onRoomJoined = ({ remainingTtl }: { remainingTtl: number }) => {
      if (remainingTtl > 0) {
        if (expiryTimeoutRef.current) {
          clearTimeout(expiryTimeoutRef.current);
        }
        expiryTimeoutRef.current = setTimeout(() => {
          if (isMounted.current) {
            dispatch({ type: 'SET_ERROR', payload: 'ROOM_EXPIRED' });
          }
        }, remainingTtl * 1000);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('reconnect_attempt', onReconnectAttempt);
    socket.on('users-updated', onUsersUpdated);
    socket.on('new-message', onNewMessage);
    socket.on('error', onError);
    socket.on('join_error', onJoinError);
    socket.on('user-typing', onUserTyping);
    socket.on('message-history', onMessageHistory);
    socket.on('room-joined', onRoomJoined);

    // Cleanup on unmount
    return () => {
      isMounted.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (expiryTimeoutRef.current) {
        clearTimeout(expiryTimeoutRef.current);
        expiryTimeoutRef.current = null;
      }
      console.log('🔌 Disconnecting socket and cleaning up listeners');
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('reconnect_attempt', onReconnectAttempt);
      socket.off('users-updated', onUsersUpdated);
      socket.off('new-message', onNewMessage);
      socket.off('error', onError);
      socket.off('join_error', onJoinError);
      socket.off('user-typing', onUserTyping);
      socket.off('message-history', onMessageHistory);
      socket.off('room-joined', onRoomJoined);
      socket.disconnect();
    };
  }, [currentUser, roomName, dispatch]);

  // Sync typing users with context
  useEffect(() => {
    if (isMounted.current) {
      dispatch({ type: 'SET_TYPING_USERS', payload: typingUsers });
    }
  }, [typingUsers, dispatch]);

  const sendMessage = useCallback(async (text: string, file?: File) => {
    if (!currentUser || !socketRef.current || !encryptionKey) return;

    let mediaUrl = '';
    let mediaType: 'image' | 'file' | undefined;
    let fileName = '';
    let fileSize = 0;

    // If there's a file, encrypt client-side and upload
    if (file) {
      try {
        // Encrypt file client-side using room AES-256-GCM key (E2EE)
        const fileBuffer = await file.arrayBuffer();
        const encryptedBytes = await encryptFileBuffer(fileBuffer, encryptionKey);
        const encryptedBlob = new Blob([encryptedBytes], { type: 'application/octet-stream' });

        const formData = new FormData();
        formData.append('file', encryptedBlob, file.name);

        const activePassword = roomPassword || '';
        const headers: Record<string, string> = {
          'x-room-name': roomName,
        };
        if (activePassword) {
          headers['x-room-password'] = activePassword;
        }

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/files/upload`, {
          method: 'POST',
          headers,
          body: formData,
        });

        if (response.status === 429) {
          throw new Error(ERROR_CODES.RATE_LIMITED);
        }

        if (!response.ok) {
          throw new Error('File upload failed');
        }

        const data: FileUploadResponse = await response.json();
        if (data?.url) {
          // Store relative URL path to prevent external domain injection
          mediaUrl = data.url.startsWith('http') ? data.url : `${API_URL}${data.url}`;
          mediaType = data.mediaType;
        }
        fileName = file.name;
        fileSize = file.size;
      } catch (error) {
        console.error('File upload error:', error);
        alert(error instanceof Error && error.message === ERROR_CODES.RATE_LIMITED 
          ? ERROR_MESSAGES.RATE_LIMITED(60) 
          : 'Failed to upload file. Please try again.');
        return;
      }
    }

    // Encrypt message text
    const sanitizedText = DOMPurify.sanitize(text.trim());
    const { ciphertext, iv } = await encryptMessage(sanitizedText, encryptionKey);

    const message: Message = {
      id: `msg-${Date.now()}-${currentUser.id}`,
      user: currentUser,
      ciphertext,
      iv,
      timestamp: Date.now(),
      type: 'user',
      status: 'sending',
      ...(mediaUrl && { mediaUrl, mediaType, fileName, fileSize }),
    };

    // Optimistically add to local state
    dispatch({ type: 'ADD_MESSAGE', payload: { ...message, text: sanitizedText } });

    // Send message to server with acknowledgment
    const payload: SendMessagePayload = {
      roomName,
      message,
    };

    socketRef.current.emit('send-message', payload, (ack: { success: boolean; messageId?: string; error?: string }) => {
      if (ack.success) {
        console.log(`✅ Message delivered: ${ack.messageId}`);
        dispatch({ type: 'UPDATE_MESSAGE_STATUS', payload: { messageId: message.id, status: 'delivered' } });
      } else {
        console.error(`❌ Message failed: ${ack.error}`);
        if (ack.error?.includes('Rate limit')) {
          alert('Message rate limit exceeded. Please slow down.');
        }
        dispatch({ type: 'REMOVE_MESSAGE', payload: message.id });
      }
    });
  }, [currentUser, roomName, dispatch, encryptionKey]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!currentUser || !socketRef.current) return;

    const payload: TypingPayload = {
      roomName,
      userId: currentUser.id,
      userName: currentUser.name,
      isTyping,
    };

    socketRef.current.emit('typing', payload);
  }, [currentUser, roomName]);

  return { sendMessage, sendTypingIndicator };
};
