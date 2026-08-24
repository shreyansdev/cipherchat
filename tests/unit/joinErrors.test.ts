import { describe, it, expect } from 'vitest';
import { ERROR_MESSAGES, ERROR_CODES } from '../../src/lib/errors';
import { ChatState, JoinError } from '../../src/types';
import { chatReducer } from '../../src/contexts/ChatContext';

describe('Join Error States', () => {
  const initialState: ChatState = {
    users: [],
    messages: [],
    typingUsers: [],
    error: null,
    connectionStatus: 'disconnected',
  };

  describe('Reducer Transitions', () => {
    it('should handle SET_ERROR for ROOM_FULL', () => {
      const state = chatReducer(initialState, { type: 'SET_ERROR', payload: 'ROOM_FULL' });
      expect(state.error).toBe('ROOM_FULL');
    });

    it('should handle SET_ERROR for ROOM_NOT_FOUND', () => {
      const state = chatReducer(initialState, { type: 'SET_ERROR', payload: 'ROOM_NOT_FOUND' });
      expect(state.error).toBe('ROOM_NOT_FOUND');
    });

    it('should handle SET_CONNECTION_STATUS for reconnecting', () => {
      const state = chatReducer(initialState, { type: 'SET_CONNECTION_STATUS', payload: 'reconnecting' });
      expect(state.connectionStatus).toBe('reconnecting');
    });

    it('should handle SET_CONNECTION_STATUS for failed', () => {
      const state = chatReducer(initialState, { type: 'SET_CONNECTION_STATUS', payload: 'failed' });
      expect(state.connectionStatus).toBe('failed');
    });

    it('should clear error on SET_STATE', () => {
      const errorState = { ...initialState, error: 'ROOM_FULL' as JoinError };
      const state = chatReducer(errorState, { 
        type: 'SET_STATE', 
        payload: { users: [], messages: [] } 
      });
      expect(state.error).toBe(null);
    });
  });

  describe('Error Constants', () => {
    it('should have the correct WRONG_PASSWORD message', () => {
      expect(ERROR_MESSAGES.WRONG_PASSWORD).toBe('Incorrect room password');
    });

    it('should have the correct ROOM_NOT_FOUND message', () => {
      expect(ERROR_MESSAGES.ROOM_NOT_FOUND).toBe('This room has expired or does not exist');
    });

    it('should have the correct ROOM_FULL message', () => {
      expect(ERROR_MESSAGES.ROOM_FULL).toBe('This room is full (max 50 users)');
    });

    it('should have the correct NETWORK_ERROR message', () => {
      expect(ERROR_MESSAGES.NETWORK_ERROR).toBe('Could not connect. Please check your connection.');
    });

    it('should have the correct RECONNECTING message', () => {
      expect(ERROR_MESSAGES.RECONNECTING).toBe('Connection lost. Reconnecting...');
    });

    it('should have the correct RATE_LIMITED message with countdown', () => {
      expect(ERROR_MESSAGES.RATE_LIMITED(60)).toBe('Too many attempts. Please wait 60 seconds.');
      expect(ERROR_MESSAGES.RATE_LIMITED(30)).toBe('Too many attempts. Please wait 30 seconds.');
    });
  });

  describe('Error Code Mapping', () => {
    it('should have consistent codes and messages', () => {
      expect(ERROR_CODES.WRONG_PASSWORD).toBe('WRONG_PASSWORD');
      expect(ERROR_CODES.ROOM_NOT_FOUND).toBe('ROOM_NOT_FOUND');
      expect(ERROR_CODES.ROOM_FULL).toBe('ROOM_FULL');
      expect(ERROR_CODES.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(ERROR_CODES.RATE_LIMITED).toBe('RATE_LIMITED');
    });
  });
});
