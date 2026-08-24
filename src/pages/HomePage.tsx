import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff, Terminal, KeyRound, UserX, Fingerprint } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Switch from '../components/ui/Switch';
import PasswordModal from '../components/chat/PasswordModal';
import { motion, AnimatePresence } from 'framer-motion';
import { createRoom, checkRoomProtection, verifyRoomPassword } from '../lib/api';
import DOMPurify from 'dompurify';
import { ERROR_MESSAGES, ERROR_CODES } from '../lib/errors';

const ROOM_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

interface InitialViewProps {
  onSetMode: (mode: 'create' | 'join') => void;
}

const InitialView: React.FC<InitialViewProps> = ({ onSetMode }) => (
  <motion.div
    key="initial"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
    className="p-8 space-y-8"
  >
    {/* Cyber Logo */}
    <div className="flex justify-center relative">
      <div className="relative">
        <Shield className="h-20 w-20 text-cyber-green animate-glow-pulse" strokeWidth={1.5} />
        <Lock className="h-8 w-8 text-cyber-cyan absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
    </div>

    {/* Title Section */}
    <div className="text-center space-y-3">
      <h1 className="text-5xl font-bold tracking-wider text-cyber-terminal">
        <span className="inline-block">&gt;_</span> CIPHER<span className="text-cyber-cyan">CHAT</span>
      </h1>
      <p className="text-cyber-green/80 text-sm font-mono uppercase tracking-widest">
        [ENCRYPTED] • [EPHEMERAL] • [ANONYMOUS]
      </p>
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground font-mono mt-4">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse"></div>
          <span>E2E ENCRYPTED</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-cyber-cyan animate-pulse"></div>
          <span>NO LOGS</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-cyber-purple animate-pulse"></div>
          <span>ZERO TRACE</span>
        </div>
      </div>
    </div>

    {/* Security Features */}
    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
      <div className="bg-card/50 border border-primary/30 rounded p-3 hover:border-primary/60 transition-all">
        <UserX className="h-4 w-4 text-cyber-green mb-2" />
        <div className="text-cyber-terminal/90">Anonymous</div>
        <div className="text-muted-foreground text-[10px]">No registration</div>
      </div>
      <div className="bg-card/50 border border-primary/30 rounded p-3 hover:border-primary/60 transition-all">
        <Terminal className="h-4 w-4 text-cyber-cyan mb-2" />
        <div className="text-cyber-terminal/90">Ephemeral</div>
        <div className="text-muted-foreground text-[10px]">Auto-delete</div>
      </div>
      <div className="bg-card/50 border border-primary/30 rounded p-3 hover:border-primary/60 transition-all">
        <Lock className="h-4 w-4 text-cyber-purple mb-2" />
        <div className="text-cyber-terminal/90">Encrypted</div>
        <div className="text-muted-foreground text-[10px]">End-to-end</div>
      </div>
      <div className="bg-card/50 border border-primary/30 rounded p-3 hover:border-primary/60 transition-all">
        <Fingerprint className="h-4 w-4 text-cyber-red mb-2" />
        <div className="text-cyber-terminal/90">Private</div>
        <div className="text-muted-foreground text-[10px]">Zero tracking</div>
      </div>
    </div>

    {/* Action Buttons */}
    <div className="space-y-3">
      <Button 
        onClick={() => onSetMode('create')} 
        className="w-full font-mono uppercase tracking-wider border border-primary/50 hover:border-primary hover:shadow-[0_0_20px_rgba(0,255,65,0.3)]" 
        size="lg"
      >
        <Terminal className="mr-2 h-5 w-5" />
        [CREATE SECURE ROOM]
      </Button>
      <Button 
        onClick={() => onSetMode('join')} 
        variant="secondary" 
        className="w-full font-mono uppercase tracking-wider border border-accent/50 hover:border-accent hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]" 
        size="lg"
      >
        <KeyRound className="mr-2 h-5 w-5" />
        [JOIN EXISTING ROOM]
      </Button>
    </div>

    {/* Footer Warning */}
    <div className="text-center text-[10px] text-muted-foreground font-mono border-t border-border/30 pt-4">
      <div className="text-cyber-red/70">⚠ WARNING: MESSAGES AUTO-DELETE AFTER 1 HOUR</div>
      <div className="text-muted-foreground/50 mt-1">NO DATA RETENTION • NO BACKUPS • COMPLETE PRIVACY</div>
    </div>
  </motion.div>
);

interface FormViewProps {
  mode: 'create' | 'join';
  onBack: () => void;
}

const FormView: React.FC<FormViewProps> = ({ mode, onBack }) => {
  const [roomName, setRoomName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [ttl, setTtl] = useState(3600); // Default 1h
  const [isProtected, setIsProtected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalError, setPasswordModalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Rate limit countdown effect
  useEffect(() => {
    if (rateLimitSeconds > 0) {
      const timer = setInterval(() => {
        setRateLimitSeconds((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            setError(null);
            setPasswordModalError(null);
          }
          return next;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [rateLimitSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rateLimitSeconds > 0) return;
    setError(null);

    // Validate Room Name
    if (!roomName.trim()) {
      setError('Room name cannot be empty.');
      setIsLoading(false);
      return;
    }

    if (!ROOM_NAME_REGEX.test(roomName)) {
      setError('Room name can only contain letters, numbers, hyphens, and underscores.');
      setIsLoading(false);
      return;
    }

    if (mode === 'create' && isProtected && password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Sanitize nickname and password (if any)
    const sanitizedDisplayName = DOMPurify.sanitize(displayName.trim());
    const sanitizedPassword = password.trim();

    try {
      if (mode === 'create') {
        const response = await createRoom(roomName.trim(), isProtected ? sanitizedPassword : undefined, ttl);
        navigate(`/chat/${response.roomName}`, { 
          state: { 
            displayName: sanitizedDisplayName, 
            password: isProtected ? sanitizedPassword : '' 
          } 
        });
      } else {
        const isProtected = await checkRoomProtection(roomName.trim());
        if (isProtected) {
          setShowPasswordModal(true);
          setIsLoading(false);
        } else {
          navigate(`/chat/${roomName.trim()}`, { state: { displayName: sanitizedDisplayName } });
        }
      }
    } catch (err) {
      setIsLoading(false);
      const errorCode = err instanceof Error ? err.message : '';
      
      if (errorCode === ERROR_CODES.RATE_LIMITED) {
        setRateLimitSeconds(60);
        setError(ERROR_MESSAGES.RATE_LIMITED(60));
      } else if (errorCode === ERROR_CODES.ROOM_NOT_FOUND) {
        setError(ERROR_MESSAGES.ROOM_NOT_FOUND);
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    }
  };

  const handlePasswordSubmit = async (enteredPassword: string) => {
    setPasswordModalError(null);
    const sanitizedDisplayName = DOMPurify.sanitize(displayName.trim());
    try {
      await verifyRoomPassword(roomName.trim(), enteredPassword);
      setShowPasswordModal(false);
      navigate(`/chat/${roomName.trim()}`, { state: { displayName: sanitizedDisplayName, password: enteredPassword } });
    } catch (err) {
      const errorCode = err instanceof Error ? err.message : '';
      if (errorCode === ERROR_CODES.WRONG_PASSWORD) {
        setPasswordModalError(ERROR_MESSAGES.WRONG_PASSWORD);
      } else if (errorCode === ERROR_CODES.ROOM_NOT_FOUND) {
        setPasswordModalError(ERROR_MESSAGES.ROOM_NOT_FOUND);
      } else if (errorCode === ERROR_CODES.RATE_LIMITED) {
        setRateLimitSeconds(60);
        setPasswordModalError(ERROR_MESSAGES.RATE_LIMITED(60));
      } else {
        setPasswordModalError('An error occurred');
      }
    }
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (error) setError(null);
    if (passwordModalError) setPasswordModalError(null);
  };

  return (
    <>
      <motion.div
        key="form"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="p-8"
      >
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="text-cyber-cyan hover:text-cyber-terminal transition-colors mb-4 flex items-center gap-2 font-mono text-sm"
          >
            <span>&lt;</span> BACK
          </button>
          <h2 className="text-2xl font-bold text-cyber-terminal font-mono">
            {mode === 'create' ? '[CREATE ENCRYPTED ROOM]' : '[JOIN SECURE ROOM]'}
          </h2>
          <p className="text-muted-foreground text-xs font-mono mt-1">
            {mode === 'create' 
              ? 'INITIALIZE NEW SECURE CHANNEL' 
              : 'CONNECT TO EXISTING CHANNEL'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Room Name */}
          <div className="space-y-2">
            <Label htmlFor="roomName" className="font-mono text-xs text-cyber-green uppercase tracking-wider">
              &gt; Room Identifier
            </Label>
            <Input
              id="roomName"
              value={roomName}
              onChange={handleInputChange(setRoomName)}
              placeholder="enter-room-name"
              className="font-mono bg-input/50 border-primary/30 focus:border-primary text-cyber-terminal placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName" className="font-mono text-xs text-cyber-cyan uppercase tracking-wider">
              &gt; Anonymous Alias
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={handleInputChange(setDisplayName)}
              placeholder="anonymous-user"
              className="font-mono bg-input/50 border-primary/30 focus:border-primary text-cyber-terminal placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Password Protection (Create mode only) */}
          {mode === 'create' && (
            <>
              <div className="flex items-center justify-between p-3 bg-card/30 border border-border/50 rounded">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-cyber-purple" />
                  <Label htmlFor="protected" className="font-mono text-xs text-cyber-terminal uppercase">
                    Password Protection
                  </Label>
                </div>
                <Switch
                  id="protected"
                  checked={isProtected}
                  onCheckedChange={setIsProtected}
                />
              </div>

              {isProtected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="password" className="font-mono text-xs text-cyber-purple uppercase tracking-wider">
                      &gt; Encryption Key
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={handleInputChange(setPassword)}
                        placeholder="••••••••"
                        required={isProtected}
                        className="font-mono bg-input/50 border-primary/30 focus:border-primary text-cyber-terminal pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-cyber-terminal transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-mono text-xs text-cyber-cyan uppercase tracking-wider">
                      &gt; Room Persistence (TTL)
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        ...(import.meta.env.VITE_TEST_MIN_TTL ? [{ label: '2S', value: Number(import.meta.env.VITE_TEST_MIN_TTL) }] : []),
                        { label: '1H', value: 3600 },
                        { label: '6H', value: 21600 },
                        { label: '24H', value: 86400 },
                        { label: '7D', value: 604800 },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setTtl(option.value)}
                          className={`py-1 px-2 border font-mono text-[10px] rounded transition-all ${
                            ttl === option.value
                              ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan'
                              : 'bg-card/30 border-border/50 text-muted-foreground hover:border-cyber-cyan/50'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-destructive/10 border border-destructive/50 rounded text-destructive text-sm font-mono"
            >
              [ERROR] {rateLimitSeconds > 0 && error.includes('Too many attempts') 
                ? ERROR_MESSAGES.RATE_LIMITED(rateLimitSeconds) 
                : error}
            </motion.div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || rateLimitSeconds > 0}
            className="w-full font-mono uppercase tracking-wider border border-primary/50 hover:border-primary hover:shadow-[0_0_20px_rgba(0,255,65,0.3)]"
            size="lg"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-pulse">[CONNECTING...]</span>
              </span>
            ) : rateLimitSeconds > 0 ? (
              <span>[RETRY IN {rateLimitSeconds}S]</span>
            ) : (
              <span>{mode === 'create' ? '[INITIALIZE ROOM]' : '[CONNECT NOW]'}</span>
            )}
          </Button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-card/20 border border-border/30 rounded text-[10px] font-mono text-muted-foreground">
          <div className="flex items-start gap-2">
            <Shield className="h-3 w-3 text-cyber-green mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-cyber-green mb-1">SECURITY NOTICE:</div>
              <div className="space-y-0.5">
                <div>• Messages encrypted end-to-end</div>
                <div>• Auto-delete after 1 hour</div>
                <div>• No server-side storage</div>
                <div>• Complete anonymity guaranteed</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setIsLoading(false);
        }}
        onSubmit={handlePasswordSubmit}
        error={passwordModalError}
        rateLimitSeconds={rateLimitSeconds}
      />
    </>
  );
};

const HomePage: React.FC = () => {
  const [mode, setMode] = useState<'initial' | 'create' | 'join'>('initial');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(0, 255, 65, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 65, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}></div>
      </div>

      {/* Scan Line Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-cyber-cyan/30 to-transparent animate-scan-line"></div>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-card/80 backdrop-blur-sm border border-primary/30 rounded-lg shadow-[0_0_30px_rgba(0,255,65,0.1)] relative z-10"
      >
        <AnimatePresence mode="wait">
          {mode === 'initial' && (
            <InitialView onSetMode={setMode} />
          )}
          {(mode === 'create' || mode === 'join') && (
            <FormView mode={mode} onBack={() => setMode('initial')} />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default HomePage;
