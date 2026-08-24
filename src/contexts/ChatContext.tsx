import React, { createContext, useContext, useReducer, ReactNode, useState, useCallback, useMemo } from 'react';
import { User, Message, TypingUser, ChatState, JoinError } from '../types';
import { deriveKey } from '../lib/crypto';

type ChatAction =
  | { type: 'SET_STATE'; payload: { users: User[]; messages: Message[] } }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'REMOVE_USER'; payload: string }
  | { type: 'REMOVE_MESSAGE'; payload: string }
  | { type: 'SET_TYPING_USERS'; payload: TypingUser[] }
  | { type: 'UPDATE_MESSAGE_STATUS'; payload: { messageId: string; status: 'delivered' | 'seen' | 'failed' } }
  | { type: 'SET_ERROR'; payload: JoinError | null }
  | { type: 'SET_CONNECTION_STATUS'; payload: 'connected' | 'reconnecting' | 'disconnected' | 'failed' }
  | { type: 'CLEAR_ROOM' };

const initialState: ChatState = {
  users: [],
  messages: [],
  typingUsers: [],
  error: null,
  connectionStatus: 'disconnected',
  roomSlug: null,
};

export const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload, typingUsers: [], error: null };
    case 'SET_USERS':
      return { ...state, users: action.payload };
    case 'ADD_MESSAGE':
      // Prevent duplicate system messages
      if (action.payload.type === 'system') {
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage?.type === 'system' && lastMessage.text === action.payload.text) {
          return state;
        }
      }
      // Prevent duplicate user messages by ID
      if (state.messages.some(m => m.id === action.payload.id)) {
        return {
          ...state,
          messages: state.messages.map(m => m.id === action.payload.id ? { ...m, ...action.payload } : m)
        };
      }
      // Prevent duplicate user messages by sender ID + ciphertext + iv (if ID differed between optimistic and server)
      if (action.payload.type === 'user' && action.payload.ciphertext && action.payload.iv) {
        const existingIdx = state.messages.findIndex(
          m => m.type === 'user' &&
               m.user?.id === action.payload.user?.id &&
               m.ciphertext === action.payload.ciphertext &&
               m.iv === action.payload.iv
        );
        if (existingIdx !== -1) {
          return {
            ...state,
            messages: state.messages.map((m, idx) => idx === existingIdx ? { ...m, ...action.payload } : m)
          };
        }
      }
      return { ...state, messages: [...state.messages, action.payload] };
    case 'REMOVE_MESSAGE':
      return { ...state, messages: state.messages.filter(msg => msg.id !== action.payload) };
    case 'ADD_USER':
      if (state.users.find(u => u.id === action.payload.id)) return state;
      return { ...state, users: [...state.users, action.payload] };
    case 'REMOVE_USER':
      return { ...state, users: state.users.filter(user => user.id !== action.payload) };
    case 'SET_TYPING_USERS':
      return { ...state, typingUsers: action.payload };
    case 'UPDATE_MESSAGE_STATUS':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? { ...msg, status: action.payload.status }
            : msg
        ),
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };
    case 'CLEAR_ROOM':
      return initialState;
    default:
      return state;
  }
};

const ChatContext = createContext<{
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  encryptionKey: CryptoKey | null;
  setupEncryption: (password: string, roomSlug: string) => Promise<void>;
  clearEncryption: () => void;
} | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);

  const setupEncryption = useCallback(async (password: string, roomSlug: string) => {
    const key = await deriveKey(password, roomSlug);
    setEncryptionKey(key);
  }, []);

  const clearEncryption = useCallback(() => {
    setEncryptionKey(null);
  }, []);

  const value = useMemo(() => ({
    state,
    dispatch,
    encryptionKey,
    setupEncryption,
    clearEncryption
  }), [state, encryptionKey, setupEncryption, clearEncryption]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
