import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';
import { useSocketChat } from '../hooks/useSocketChat';
import { User } from '../types';
import UserList from '../components/chat/UserList';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import Header from '../components/chat/Header';
import { AlertCircle, WifiOff, RefreshCw, LogOut, Terminal, Shield, Lock, Sparkles, ShieldCheck } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import PasswordModal from '../components/chat/PasswordModal';
import LeaveRoomModal from '../components/chat/LeaveRoomModal';
import { ERROR_MESSAGES, ERROR_CODES } from '../lib/errors';
import { motion, AnimatePresence } from 'framer-motion';
import { checkRoomProtection, verifyRoomPassword } from '../lib/api';

const RANDOM_ALIASES = ['Ghost_Protocol', 'Cipher_007', 'Neon_Specter', 'Quantum_Rebel', 'Void_Runner', 'Shadow_Agent'];

const ChatPage: React.FC = () => {
  const { roomName } = useParams<{ roomName: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { state, dispatch, setupEncryption, encryptionKey, clearEncryption } = useChat();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  
  // Direct join states
  const [needsDisplayName, setNeedsDisplayName] = useState(!location.state?.displayName);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalError, setPasswordModalError] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);

  // Security & Privacy: Ensure crawlers never index active or direct-access chat rooms
  useEffect(() => {
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    const previousContent = robotsMeta.getAttribute('content') || 'index, follow';
    robotsMeta.setAttribute('content', 'noindex, nofollow');

    return () => {
      robotsMeta.setAttribute('content', previousContent);
    };
  }, []);

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
  
  const handleRandomAlias = () => {
    const alias = RANDOM_ALIASES[Math.floor(Math.random() * RANDOM_ALIASES.length)];
    setDisplayNameInput(alias);
    if (error) setError(null);
  };

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
      <div className="min-h-screen bg-[#080b10] flex items-center justify-center p-4 relative overflow-hidden font-mono">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-cyan-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#0d1420]/85 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 sm:p-8 relative z-10 shadow-[0_0_40px_rgba(0,240,255,0.12)]"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(0,255,101,0.2)]">
              <Shield className="h-8 w-8 text-cyber-green animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-wider">[JOIN CHANNEL]</h2>
            <div className="inline-block mt-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyber-cyan text-xs font-semibold">
              #{roomName}
            </div>
          </div>

          <form onSubmit={handleDirectJoin} className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="displayName" className="text-xs text-cyber-green uppercase tracking-widest">
                  &gt; Anonymous Alias
                </Label>
                <button
                  type="button"
                  onClick={handleRandomAlias}
                  className="text-[11px] text-cyber-cyan/80 hover:text-white flex items-center gap-1 font-mono transition-colors"
                >
                  <Sparkles className="h-3 w-3" />
                  [Randomize]
                </button>
              </div>
              <Input
                id="displayName"
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                placeholder="anonymous-user"
                autoFocus
                className="bg-[#080b10]/70 border-cyan-500/30 focus:border-cyan-400 text-white rounded-xl"
              />
            </div>

            {error && (
              <div className="text-destructive text-xs p-3 rounded-xl bg-destructive/10 border border-destructive/30">
                [ERROR] {error === ERROR_CODES.ROOM_NOT_FOUND ? ERROR_MESSAGES.ROOM_NOT_FOUND : error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !displayNameInput.trim()}
              className="w-full h-12 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(0,255,101,0.3)] font-bold transition-all"
            >
              {isLoading ? '[CONNECTING...]' : '[CONNECT NOW]'}
            </Button>
            
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/')}
              className="w-full rounded-xl bg-[#080b10]/70 border border-cyan-500/20 text-slate-300 hover:bg-[#080b10]"
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

  if (!encryptionKey && !needsDisplayName) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080b10] text-cyber-cyan font-mono">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#0d1420]/80 border border-cyan-500/30 shadow-[0_0_30px_rgba(0,240,255,0.15)] animate-pulse">
          <RefreshCw className="h-5 w-5 animate-spin text-cyber-green" />
          <span>[INITIALIZING SECURE CHANNEL & DERIVING KEYS...]</span>
        </div>
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
      <div className="flex flex-col h-screen items-center justify-center bg-[#080b10] text-slate-100 font-mono p-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,51,102,0.2)]">
          <AlertCircle className="h-10 w-10 text-destructive animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white">[CHANNEL NOT FOUND]</h2>
        <p className="text-muted-foreground mb-8 max-w-sm text-sm">
          {ERROR_MESSAGES.ROOM_NOT_FOUND}
        </p>
        <Button onClick={handleLeave} variant="secondary" className="font-mono rounded-xl bg-card border border-cyan-500/30 text-cyber-cyan hover:border-cyan-400">
          <RefreshCw className="mr-2 h-4 w-4" />
          [CREATE NEW ROOM]
        </Button>
      </div>
    );
  }

  // Full-page error for expired room
  if (state.error === 'ROOM_EXPIRED') {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#080b10] text-slate-100 font-mono p-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
          <Terminal className="h-10 w-10 text-cyber-purple animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white">[CHANNEL EXPIRED]</h2>
        <p className="text-muted-foreground mb-8 max-w-sm text-sm">
          This room has reached its configured TTL and expired. All cryptographic data and message history has been wiped.
        </p>
        <Button onClick={handleLeave} variant="secondary" className="font-mono rounded-xl bg-card border border-cyan-500/30 text-cyber-cyan hover:border-cyan-400">
          <RefreshCw className="mr-2 h-4 w-4" />
          [START NEW SESSION]
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#080b10] text-slate-100 relative overflow-hidden font-sans">
      {/* Inline Banner for Room Full */}
      <AnimatePresence>
        {state.error === ERROR_CODES.ROOM_FULL && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-destructive/20 border-b border-destructive text-destructive px-4 py-2.5 text-center font-mono text-xs z-50 absolute top-0 left-0 right-0 backdrop-blur-md"
          >
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>[ACCESS DENIED] {ERROR_MESSAGES.ROOM_FULL}</span>
              <button 
                onClick={handleLeave}
                className="ml-4 underline hover:text-white transition-colors font-bold"
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
            <div className={`p-4 rounded-xl border shadow-2xl flex items-center gap-3 font-mono text-sm backdrop-blur-xl ${
              state.connectionStatus === 'failed' || state.error === 'CONNECTION_LOST'
                ? 'bg-destructive/95 border-destructive text-white' 
                : 'bg-[#0d1420]/95 border-cyan-500/40 text-cyan-300'
            }`}>
              {state.connectionStatus === 'failed' || state.error === 'CONNECTION_LOST' ? (
                <WifiOff className="h-5 w-5 flex-shrink-0" />
              ) : (
                <RefreshCw className="h-5 w-5 animate-spin flex-shrink-0 text-cyber-cyan" />
              )}
              <div className="flex-1 text-xs">
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
                  className="px-2.5 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-xs font-bold"
                >
                  RETRY
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Stream Container */}
      <main className="flex-1 flex flex-col transition-all duration-300 bg-[#080b10] min-w-0 h-full">
        <Header 
          roomName={roomName || 'default-room'} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onLeaveRoom={() => setShowLeaveModal(true)}
        />
        <MessageList messages={state.messages} currentUser={currentUser} typingUsers={state.typingUsers} />
        <MessageInput onSendMessage={sendMessage} onTyping={sendTypingIndicator} />
      </main>

      {/* Active Peers Sidebar (Right Side) */}
      <UserList 
        isSidebarOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        users={state.users} 
        onLeaveRoom={() => setShowLeaveModal(true)}
      />

      {/* Leave Room Modal */}
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
