import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Header from '../../src/components/chat/Header';
import UserList from '../../src/components/chat/UserList';
import LeaveRoomModal from '../../src/components/chat/LeaveRoomModal';
import { User } from '../../src/types';
import '@testing-library/jest-dom';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    aside: ({ children, ...props }: any) => <aside {...props}>{children}</aside>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('Voluntary Room Leaving Components', () => {
  describe('Header Component', () => {
    it('renders room name and triggers onLeaveRoom when clicking the back button', () => {
      const handleLeave = vi.fn();
      const handleToggleSidebar = vi.fn();

      render(
        <Header
          roomName="cipher-channel"
          isSidebarOpen={true}
          onToggleSidebar={handleToggleSidebar}
          onLeaveRoom={handleLeave}
        />
      );

      expect(screen.getByText(/cipher-channel/)).toBeInTheDocument();
      
      // Top-left leave / back button
      const backBtn = screen.getByLabelText('Back to Home');
      fireEvent.click(backBtn);
      expect(handleLeave).toHaveBeenCalledTimes(1);
    });

    it('renders explicit [LEAVE] button and triggers onLeaveRoom when clicked', () => {
      const handleLeave = vi.fn();
      const handleToggleSidebar = vi.fn();

      render(
        <Header
          roomName="secure-test-room"
          isSidebarOpen={true}
          onToggleSidebar={handleToggleSidebar}
          onLeaveRoom={handleLeave}
        />
      );

      const leaveBtn = screen.getByText(/\[LEAVE\]/);
      expect(leaveBtn).toBeInTheDocument();
      fireEvent.click(leaveBtn);
      expect(handleLeave).toHaveBeenCalledTimes(1);
    });
  });

  describe('UserList Component', () => {
    const mockUsers: User[] = [
      { id: 'u1', name: 'Alice' },
      { id: 'u2', name: 'Bob' },
    ];

    it('renders [LEAVE CHANNEL] button and triggers onLeaveRoom when clicked', () => {
      const handleLeave = vi.fn();

      render(
        <UserList
          users={mockUsers}
          isSidebarOpen={true}
          onLeaveRoom={handleLeave}
        />
      );

      const leaveChannelBtn = screen.getByText(/\[LEAVE CHANNEL\]/);
      expect(leaveChannelBtn).toBeInTheDocument();
      fireEvent.click(leaveChannelBtn);
      expect(handleLeave).toHaveBeenCalledTimes(1);
    });
  });

  describe('LeaveRoomModal Component', () => {
    it('renders confirmation text and allows canceling or confirming room departure', () => {
      const handleClose = vi.fn();
      const handleConfirm = vi.fn();

      const { rerender } = render(
        <LeaveRoomModal
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
          roomName="cyber-matrix"
        />
      );

      expect(screen.getByText(/\[LEAVE ENCRYPTED CHANNEL\]/)).toBeInTheDocument();
      expect(screen.getByText(/#cyber-matrix/)).toBeInTheDocument();
      expect(screen.getByText(/Session Termination/)).toBeInTheDocument();
      expect(screen.getByText(/All local cryptographic keys and ephemeral chat history will be immediately purged/)).toBeInTheDocument();

      // Click Cancel
      const cancelBtn = screen.getByText(/\[CANCEL\]/);
      fireEvent.click(cancelBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);

      // Click Confirm [PURGE & LEAVE]
      const confirmBtn = screen.getByText(/\[PURGE & LEAVE\]/);
      fireEvent.click(confirmBtn);
      expect(handleConfirm).toHaveBeenCalledTimes(1);

      // Verify closed modal does not render
      rerender(
        <LeaveRoomModal
          isOpen={false}
          onClose={handleClose}
          onConfirm={handleConfirm}
          roomName="cyber-matrix"
        />
      );
      expect(screen.queryByText(/\[LEAVE ENCRYPTED CHANNEL\]/)).not.toBeInTheDocument();
    });
  });
});
