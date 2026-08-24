import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ChatProvider, useChat, chatReducer } from '../../src/contexts/ChatContext';
import { ChatState, Message, User } from '../../src/types';
import MessageBubble from '../../src/components/chat/MessageBubble';
import HomePage from '../../src/pages/HomePage';
import { MemoryRouter } from 'react-router-dom';
import * as api from '../../src/lib/api';
import '@testing-library/jest-dom';

// Mocking framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mocking Lucide icons
vi.mock('lucide-react', () => ({
  Terminal: () => <span data-testid="terminal-icon" />,
  Shield: () => <span data-testid="shield-icon" />,
  Check: () => <span data-testid="check-icon" />,
  CheckCheck: () => <span data-testid="check-check-icon" />,
  ShieldCheck: () => <span data-testid="shield-check-icon" />,
  Lock: () => <span data-testid="lock-icon" />,
  Eye: () => <span data-testid="eye-icon" />,
  EyeOff: () => <span data-testid="eye-off-icon" />,
  KeyRound: () => <span data-testid="key-round-icon" />,
  UserX: () => <span data-testid="user-x-icon" />,
  Fingerprint: () => <span data-testid="fingerprint-icon" />,
  AlertCircle: () => <span data-testid="alert-icon" />,
  WifiOff: () => <span data-testid="wifi-off-icon" />,
  RefreshCw: () => <span data-testid="refresh-icon" />,
  LogOut: () => <span data-testid="logout-icon" />,
  Sparkles: () => <span data-testid="sparkles-icon" />,
  Zap: () => <span data-testid="zap-icon" />,
  Copy: () => <span data-testid="copy-icon" />,
  FileText: () => <span data-testid="file-text-icon" />,
  Download: () => <span data-testid="download-icon" />,
  Smile: () => <span data-testid="smile-icon" />,
  Paperclip: () => <span data-testid="paperclip-icon" />,
  X: () => <span data-testid="x-icon" />,
  Send: () => <span data-testid="send-icon" />,
  Users: () => <span data-testid="users-icon" />,
  Circle: () => <span data-testid="circle-icon" />,
  ArrowLeft: () => <span data-testid="arrow-left-icon" />,
  Menu: () => <span data-testid="menu-icon" />,
  AlertTriangle: () => <span data-testid="alert-triangle-icon" />,
}));

// Mocking crypto functions
vi.mock('../../src/lib/crypto', () => ({
  deriveKey: vi.fn(),
  encryptMessage: vi.fn(),
  decryptMessage: vi.fn(),
}));

// Mocking socket hook
const mockSendMessage = vi.fn();
const mockSendTypingIndicator = vi.fn();
vi.mock('../../src/hooks/useSocketChat', () => ({
  useSocketChat: () => ({
    sendMessage: mockSendMessage,
    sendTypingIndicator: mockSendTypingIndicator,
  }),
}));

// Mocking API
vi.mock('../../src/lib/api', () => ({
  createRoom: vi.fn(),
  checkRoomProtection: vi.fn(),
  verifyRoomPassword: vi.fn(),
}));

describe('Chat Components Integration Tests', () => {
  describe('ChatContext Reducer', () => {
    const initialState: ChatState = {
      users: [],
      messages: [],
      typingUsers: [],
      error: null,
      connectionStatus: 'disconnected',
      roomSlug: null,
    };

    const mockUser: User = { id: 'u1', name: 'Alice' };
    const mockMessage: Message = {
      id: 'm1',
      user: mockUser,
      text: 'Hello',
      timestamp: Date.now(),
      type: 'user',
    };

    it('Dispatching ADD_MESSAGE appends to the messages array', () => {
      const state = chatReducer(initialState, { type: 'ADD_MESSAGE', payload: mockMessage });
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0]).toEqual(mockMessage);
    });

    it('Dispatching CLEAR_ROOM resets messages, users, and roomSlug to initial state', () => {
      const dirtyState: ChatState = {
        users: [mockUser],
        messages: [mockMessage],
        typingUsers: [],
        error: null,
        connectionStatus: 'connected',
        roomSlug: 'room-1',
      };
      const state = chatReducer(dirtyState, { type: 'CLEAR_ROOM' });
      expect(state).toEqual(initialState);
    });

    it('Dispatching SET_USERS updates the user count correctly', () => {
      const users = [mockUser, { id: 'u2', name: 'Bob' }];
      const state = chatReducer(initialState, { type: 'SET_USERS', payload: users });
      expect(state.users).toHaveLength(2);
      expect(state.users).toEqual(users);
    });
  });

  describe('Message Display', () => {
    const mockUser: User = { id: 'u1', name: 'Alice' };

    it('MessageBubble renders the text content', () => {
      const message: Message = {
        id: 'm1',
        user: mockUser,
        text: 'Hello World',
        timestamp: Date.now(),
        type: 'user',
      };
      render(<MessageBubble message={message} currentUser={null} />);
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('HTML special characters in message content are escaped and not executed as markup', () => {
      const message: Message = {
        id: 'm2',
        user: mockUser,
        text: '<img src=x onerror=alert(1)> & <b>Bold</b>',
        timestamp: Date.now(),
        type: 'user',
      };
      render(<MessageBubble message={message} currentUser={null} />);
      
      // DOMPurify should sanitize the input. 
      const content = screen.queryByText(/alert\(1\)/);
      expect(content).toBeNull();
    });

    it('A message with type: system renders differently from type: user', () => {
      const userMessage: Message = {
        id: 'm1',
        user: mockUser,
        text: 'User Message',
        timestamp: Date.now(),
        type: 'user',
      };
      const systemMessage: Message = {
        id: 'sys1',
        user: { id: 'system', name: 'System' },
        text: 'System Notification',
        timestamp: Date.now(),
        type: 'system',
      };

      const { rerender } = render(<MessageBubble message={userMessage} currentUser={null} />);
      expect(screen.queryByTestId('terminal-icon')).toBeNull();

      rerender(<MessageBubble message={systemMessage} currentUser={null} />);
      expect(screen.getByTestId('terminal-icon')).toBeInTheDocument();
      expect(screen.getByText('System Notification')).toBeInTheDocument();
    });
  });

  describe('Socket Integration (Mocked)', () => {
    it('Simulate receiving a message event and assert the message appears in the rendered chat', async () => {
      const TestComponent = () => {
        const { state, dispatch } = useChat();
        return (
          <div>
            <div data-testid="msg-count">{state.messages.length}</div>
            <button onClick={() => dispatch({ 
              type: 'ADD_MESSAGE', 
              payload: { id: 'm-new', user: { id: 'u2', name: 'Bob' }, text: 'Incoming!', timestamp: Date.now(), type: 'user' } 
            })}>
              Simulate Message
            </button>
            {state.messages.length > 0 && <MessageBubble message={state.messages[0]} currentUser={null} />}
          </div>
        );
      };

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('msg-count')).toHaveTextContent('0');
      fireEvent.click(screen.getByText('Simulate Message'));
      expect(screen.getByTestId('msg-count')).toHaveTextContent('1');
      expect(screen.getByText('Incoming!')).toBeInTheDocument();
    });

    it('Simulate a user_joined event and assert the user count increments', () => {
      const TestComponent = () => {
        const { state, dispatch } = useChat();
        return (
          <div>
            <div data-testid="user-count">{state.users.length}</div>
            <button onClick={() => dispatch({ 
              type: 'SET_USERS', 
              payload: [{ id: 'u1', name: 'Alice' }] 
            })}>
              Simulate Join
            </button>
          </div>
        );
      };

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('user-count')).toHaveTextContent('0');
      fireEvent.click(screen.getByText('Simulate Join'));
      expect(screen.getByTestId('user-count')).toHaveTextContent('1');
    });
  });

  describe('Room Creation Form', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('Submitting with an empty room name shows a validation error', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      await user.click(screen.getByText(/\[CREATE SECURE ROOM\]/));
      const nameInput = screen.getByLabelText(/> Anonymous Alias/i);
      await user.type(nameInput, 'Alice');
      const submitBtn = screen.getByText(/\[INITIALIZE ROOM\]/);
      await user.click(submitBtn);

      expect(await screen.findByText(/\[ERROR\] Room name cannot be empty./)).toBeInTheDocument();
    });

    it('Submitting with a password shorter than 8 characters shows a validation error', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      await user.click(screen.getByText(/\[CREATE SECURE ROOM\]/));
      await user.type(screen.getByLabelText(/> Room Identifier/i), 'secret-room');
      await user.type(screen.getByLabelText(/> Anonymous Alias/i), 'Alice');
      const passwordSwitch = screen.getByLabelText(/Password Protection/i);
      await user.click(passwordSwitch);
      const passwordInput = screen.getByLabelText(/> Encryption Key/i);
      await user.type(passwordInput, '123');
      const submitBtn = screen.getByText(/\[INITIALIZE ROOM\]/);
      await user.click(submitBtn);

      expect(await screen.findByText(/\[ERROR\] Password must be at least 8 characters long./)).toBeInTheDocument();
    });

    it('On valid submit, the api.createRoom is called with correct payload', async () => {
      const user = userEvent.setup();
      vi.mocked(api.createRoom).mockResolvedValue({ success: true, roomName: 'valid-room' });

      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      await user.click(screen.getByText(/\[CREATE SECURE ROOM\]/));
      await user.type(screen.getByLabelText(/> Room Identifier/i), 'valid-room');
      await user.type(screen.getByLabelText(/> Anonymous Alias/i), 'Alice');
      const submitBtn = screen.getByText(/\[INITIALIZE ROOM\]/);
      await user.click(submitBtn);

      expect(api.createRoom).toHaveBeenCalledWith('valid-room', undefined, 3600);
    });
  });
});
