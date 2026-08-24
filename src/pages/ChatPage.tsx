import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';
import { useSocketChat } from '../hooks/useSocketChat';
import { User } from '../types';
import UserList from '../components/chat/UserList';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import Header from '../components/chat/Header';
import { AlertCircle, WifiOff, RefreshCw, LogOut, Terminal, Shield, Lock } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import PasswordModal from '../components/chat/PasswordModal';
import LeaveRoomModal from '../components/chat/LeaveRoomModal';
import { ERROR_MESSAGES, ERROR_CODES } from '../lib/errors';
import { motion, AnimatePresence } from 'framer-motion';
import { checkRoomProtection, verifyRoomPassword } from '../lib/api';

const ChatPage = () => {
  const { roomName } = useParams<{ roomName: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { state, dispatch, setupEncryption, encryptionKey, clearEncryption } = useChat();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Direct join states
  const [needsDisplayName, setNeedsDisplayName] = useState(!location.state?.displayName);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalError, setPasswordModalError] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);

  useEffect(() => {
    let active = true;
    const displayName = location.state?.displayName;
    const password = location.state?.password || '';
    
    if (displayName && roomName) {
      const init = async () => {
        try {
          await setupEncryption(password, roomName);
          if (!active) return;
          const userId = `user-${Math.random().toString(36).substring(2, 9)}`;
          setCurrentUser({ id: userId, name: displayName });
        } catch (error) {
          if (!active) return;
          console.error('Failed to setup encryption:', error);
          navigate('/');
        }
      };

      init();
    }

    return () => {
      active = false;
    };
  }, [location.state, roomName, navigate, setupEncryption]);

  const { sendMessage, sendTypingIndicator } = useSocketChat(currentUser, roomName || '');
  
  const handleDirectJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayNameInput.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const isProtected = await checkRoomProtection(roomName!);
      if (isProtected) {
        setShowPasswordModal(true);
        setIsLoading(false);
      } else {
        navigate(`/chat/${roomName}`, { state: { displayName: displayNameInput.trim() } });
        setNeedsDisplayName(false);
      }
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to join room');
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    try {
      await verifyRoomPassword(roomName!, password);
      setShowPasswordModal(false);
      navigate(`/chat/${roomName}`, { state: { displayName: displayNameInput.trim(), password } });
      setNeedsDisplayName(false);
    } catch (err) {
      const errorCode = err instanceof Error ? err.message : '';
      if (errorCode === ERROR_CODES.WRONG_PASSWORD) {
        setPasswordModalError(ERROR_MESSAGES.WRONG_PASSWORD);
      } else {
        setPasswordModalError('An error occurred');
      }
    }
  };

  if (needsDisplayName) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden font-mono">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(0, 255, 65, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 65, 0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}></div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-card/80 backdrop-blur-sm border border-primary/30 rounded-lg p-8 relative z-10 shadow-[0_0_30px_rgba(0,255,65,0.1)]"
        >
          <div className="text-center mb-8">
            <Shield className="h-12 w-12 text-cyber-green mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-cyber-terminal uppercase">[JOIN CHANNEL]</h2>
            <p className="text-cyber-cyan text-sm mt-2">{roomName}</p>
          </div>

          <form onSubmit={handleDirectJoin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-xs text-cyber-green uppercase tracking-widest">
                &gt; Anonymous Alias
              </Label>
              <Input
                id="displayName"
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                placeholder="anonymous-user"
                autoFocus
                className="bg-input/50 border-primary/30 focus:border-primary text-cyber-terminal"
              />
            </div>

            {error && (
              <div className="text-cyber-red text-xs">
                [ERROR] {error === ERROR_CODES.ROOM_NOT_FOUND ? ERROR_MESSAGES.ROOM_NOT_FOUND : error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !displayNameInput.trim()}
              className="w-full border border-primary/50 hover:border-primary hover:shadow-[0_0_20px_rgba(0,255,65,0.3)]"
            >
              {isLoading ? '[CONNECTING...]' : '[CONNECT NOW]'}
            </Button>
            
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/')}
              className="w-full border border-border/50"
            >
              [CANCEL]
            </Button>
          </form>
        </motion.div>

        <PasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSubmit={handlePasswordSubmit}
          error={passwordModalError}
          rateLimitSeconds={rateLimitSeconds}
        />
      </div>
    );
  }

  if (!encryptionKey && location.state?.password) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-cyber-terminal font-mono">
        <div className="animate-pulse">[INITIALIZING SECURE CHANNEL...]</div>
      </div>
    );
  }

  const handleLeave = () => {
    clearEncryption();
    dispatch({ type: 'CLEAR_ROOM' });
    navigate('/');
  };

  // Full-page error for room not found
  if (state.error === ERROR_CODES.ROOM_NOT_FOUND) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background text-cyber-terminal font-mono p-6 text-center">
        <AlertCircle className="h-16 w-16 text-cyber-red mb-6 animate-pulse" />
        <h2 className="text-2xl font-bold mb-2">[CHANNEL NOT FOUND]</h2>
        <p className="text-muted-foreground mb-8 max-w-xs">
          {ERROR_MESSAGES.ROOM_NOT_FOUND}
        </p>
        <Button onClick={handleLeave} variant="secondary" className="font-mono">
          <RefreshCw className="mr-2 h-4 w-4" />
          [CREATE NEW ROOM]
        </Button>
      </div>
    );
  }

  // Full-page error for expired room
  if (state.error === 'ROOM_EXPIRED') {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background text-cyber-terminal font-mono p-6 text-center">
        <Terminal className="h-16 w-16 text-cyber-purple mb-6 animate-pulse" />
        <h2 className="text-2xl font-bold mb-2">[CHANNEL EXPIRED]</h2>
        <p className="text-muted-foreground mb-8 max-w-xs">
          This room has expired or does not exist. All data has been securely wiped.
        </p>
        <Button onClick={handleLeave} variant="secondary" className="font-mono">
          <RefreshCw className="mr-2 h-4 w-4" />
          [START NEW SESSION]
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground relative overflow-hidden">
      {/* Inline Banner for Room Full */}
      <AnimatePresence>
        {state.error === ERROR_CODES.ROOM_FULL && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-destructive/20 border-b border-destructive text-destructive px-4 py-2 text-center font-mono text-xs z-50 absolute top-0 left-0 right-0"
          >
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>[ACCESS DENIED] {ERROR_MESSAGES.ROOM_FULL}</span>
              <button 
                onClick={handleLeave}
                className="ml-4 underline hover:text-white transition-colors"
              >
                [EXIT]
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reconnection Toast */}
      <AnimatePresence>
        {(state.connectionStatus === 'reconnecting' || state.connectionStatus === 'failed' || state.error === 'SERVER_RESTARTING' || state.error === 'CONNECTION_LOST') && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4"
          >
            <div className={`p-4 rounded-md border shadow-lg flex items-center gap-3 font-mono text-sm ${
              state.connectionStatus === 'failed' || state.error === 'CONNECTION_LOST'
                ? 'bg-destructive/90 border-destructive text-white' 
                : 'bg-card/90 border-primary/50 text-cyber-terminal'
            }`}>
              {state.connectionStatus === 'failed' || state.error === 'CONNECTION_LOST' ? (
                <WifiOff className="h-5 w-5 flex-shrink-0" />
              ) : (
                <RefreshCw className="h-5 w-5 animate-spin flex-shrink-0" />
              )}
              <div className="flex-1">
                {state.error === 'SERVER_RESTARTING'
                  ? 'Server is restarting. Reconnecting...'
                  : state.error === 'CONNECTION_LOST'
                  ? 'Connection lost. Please refresh the page.'
                  : state.connectionStatus === 'failed' 
                  ? ERROR_MESSAGES.NETWORK_ERROR 
                  : ERROR_MESSAGES.RECONNECTING}
              </div>
              {(state.connectionStatus === 'failed' || state.error === 'CONNECTION_LOST') && (
                <button 
                  onClick={() => window.location.reload()}
                  className="px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
                >
                  RETRY
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <UserList 
        isSidebarOpen={isSidebarOpen} 
        users={state.users} 
        onLeaveRoom={() => setShowLeaveModal(true)}
      />
      <main className="flex-1 flex flex-col transition-all duration-300">
        <Header 
          roomName={roomName || 'default-room'} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onLeaveRoom={() => setShowLeaveModal(true)}
        />
        <MessageList messages={state.messages} currentUser={currentUser} typingUsers={state.typingUsers} />
        <MessageInput onSendMessage={sendMessage} onTyping={sendTypingIndicator} />
      </main>

      <LeaveRoomModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={handleLeave}
        roomName={roomName || 'channel'}
      />
    </div>
  );
};

export default ChatPage;
