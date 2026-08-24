import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff, Terminal, KeyRound, UserX, Fingerprint, Sparkles, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
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

const ADJECTIVES = ['cyber', 'neon', 'quantum', 'stealth', 'shadow', 'hyper', 'crypto', 'dark', 'void', 'sonic'];
const NOUNS = ['pulse', 'matrix', 'vault', 'cipher', 'nexus', 'shield', 'specter', 'core', 'signal', 'node'];
const RANDOM_ALIASES = ['Ghost_Protocol', 'Cipher_007', 'Neon_Specter', 'Quantum_Rebel', 'Void_Runner', 'Shadow_Agent'];

const generateRandomSlug = () => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj}-${noun}-${num}`;
};

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
    className="p-6 sm:p-8 space-y-8"
  >
    {/* Cyber Logo Emblem */}
    <div className="flex justify-center relative">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl animate-pulse"></div>
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-emerald-500/10 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center relative shadow-[0_0_30px_rgba(0,240,255,0.2)]">
          <Shield className="h-10 w-10 text-cyber-green animate-pulse" strokeWidth={1.75} />
          <Lock className="h-5 w-5 text-cyber-cyan absolute" strokeWidth={2} />
        </div>
      </div>
    </div>

    {/* Title Section */}
    <div className="text-center space-y-3">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-mono text-cyber-cyan tracking-wider">
        <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: '6s' }} />
        <span>ZERO-KNOWLEDGE PROTOCOL v2.4</span>
      </div>
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-mono">
        <span className="text-cyber-green">&gt;_</span> CIPHER<span className="text-cyber-cyan">CHAT</span>
      </h1>
      <p className="text-muted-foreground text-xs sm:text-sm font-mono uppercase tracking-widest">
        [ENCRYPTED] • [EPHEMERAL] • [ANONYMOUS]
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground font-mono pt-2">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span>E2EE AES-256</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
          <span>ZERO LOGS</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></div>
          <span>AUTO-PURGE</span>
        </div>
      </div>
    </div>

    {/* Security Guarantees Grid */}
    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
      <div className="bg-[#080b10]/60 border border-cyan-500/20 rounded-xl p-3.5 hover:border-cyan-500/50 hover:bg-[#080b10]/90 transition-all group">
        <UserX className="h-4 w-4 text-cyber-green mb-2 group-hover:scale-110 transition-transform" />
        <div className="text-slate-200 font-bold">Anonymous</div>
        <div className="text-muted-foreground text-[10px]">No accounts or telemetry</div>
      </div>
      <div className="bg-[#080b10]/60 border border-cyan-500/20 rounded-xl p-3.5 hover:border-cyan-500/50 hover:bg-[#080b10]/90 transition-all group">
        <Terminal className="h-4 w-4 text-cyber-cyan mb-2 group-hover:scale-110 transition-transform" />
        <div className="text-slate-200 font-bold">Ephemeral</div>
        <div className="text-muted-foreground text-[10px]">Strict Redis memory TTL</div>
      </div>
      <div className="bg-[#080b10]/60 border border-cyan-500/20 rounded-xl p-3.5 hover:border-cyan-500/50 hover:bg-[#080b10]/90 transition-all group">
        <Lock className="h-4 w-4 text-cyber-purple mb-2 group-hover:scale-110 transition-transform" />
        <div className="text-slate-200 font-bold">Encrypted</div>
        <div className="text-muted-foreground text-[10px]">Client-side Web Crypto</div>
      </div>
      <div className="bg-[#080b10]/60 border border-cyan-500/20 rounded-xl p-3.5 hover:border-cyan-500/50 hover:bg-[#080b10]/90 transition-all group">
        <Fingerprint className="h-4 w-4 text-cyber-red mb-2 group-hover:scale-110 transition-transform" />
        <div className="text-slate-200 font-bold">Private</div>
        <div className="text-muted-foreground text-[10px]">Zero disk persistence</div>
      </div>
    </div>

    {/* Action Triggers */}
    <div className="space-y-3 pt-2">
      <Button 
        onClick={() => onSetMode('create')} 
        className="w-full font-mono uppercase tracking-wider bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(0,255,101,0.3)] transition-all h-12 rounded-xl text-sm font-bold" 
        size="lg"
      >
        <Zap className="mr-2 h-4 w-4" />
        [CREATE SECURE ROOM]
      </Button>
      <Button 
        onClick={() => onSetMode('join')} 
        variant="secondary" 
        className="w-full font-mono uppercase tracking-wider bg-[#080b10]/70 hover:bg-[#080b10] text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(0,240,255,0.2)] transition-all h-12 rounded-xl text-sm font-bold" 
        size="lg"
      >
        <KeyRound className="mr-2 h-4 w-4" />
        [JOIN EXISTING ROOM]
      </Button>
    </div>

    {/* Footer Security Notice */}
    <div className="text-center text-[10px] text-muted-foreground font-mono border-t border-cyan-500/20 pt-4">
      <div className="text-cyber-amber/90 font-bold">⚡ HARD EPHEMERAL TTL • IN-MEMORY STORAGE ONLY</div>
      <div className="text-muted-foreground/60 mt-1">NO DATA RETENTION • NO SERVER-SIDE PLAINTEXT</div>
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

  const handleGenerateSlug = () => {
    const slug = generateRandomSlug();
    setRoomName(slug);
    if (error) setError(null);
  };

  const handleRandomAlias = () => {
    const alias = RANDOM_ALIASES[Math.floor(Math.random() * RANDOM_ALIASES.length)];
    setDisplayName(alias);
    if (error) setError(null);
  };

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
            displayName: sanitizedDisplayName || 'anonymous', 
            password: isProtected ? sanitizedPassword : '' 
          } 
        });
      } else {
        const isProtected = await checkRoomProtection(roomName.trim());
        if (isProtected) {
          setShowPasswordModal(true);
          setIsLoading(false);
        } else {
          navigate(`/chat/${roomName.trim()}`, { state: { displayName: sanitizedDisplayName || 'anonymous' } });
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
      navigate(`/chat/${roomName.trim()}`, { state: { displayName: sanitizedDisplayName || 'anonymous', password: enteredPassword } });
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
        className="p-6 sm:p-8"
      >
        {/* Header Navigation */}
        <div className="mb-6 pb-4 border-b border-cyan-500/20">
          <button
            onClick={onBack}
            className="text-cyber-cyan hover:text-white transition-colors mb-3 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">&lt;</span> BACK TO HUB
          </button>
          <h2 className="text-2xl font-bold text-white font-mono flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-cyber-green" />
            {mode === 'create' ? '[CREATE ENCRYPTED ROOM]' : '[JOIN SECURE ROOM]'}
          </h2>
          <p className="text-muted-foreground text-xs font-mono mt-1">
            {mode === 'create' 
              ? 'INITIALIZE SECURE EPHEMERAL CHANNEL' 
              : 'CONNECT TO EXISTING ENCRYPTED ROOM'}
          </p>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Room Name */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="roomName" className="font-mono text-xs text-cyber-green uppercase tracking-wider">
                &gt; Room Identifier
              </Label>
              {mode === 'create' && (
                <button
                  type="button"
                  onClick={handleGenerateSlug}
                  className="text-[11px] text-cyber-cyan hover:text-white flex items-center gap-1 font-mono transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  [Random Slug]
                </button>
              )}
            </div>
            <Input
              id="roomName"
              value={roomName}
              onChange={handleInputChange(setRoomName)}
              placeholder="enter-room-name"
              className="font-mono bg-[#080b10]/70 border-cyan-500/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white placeholder:text-muted-foreground/40 rounded-xl"
            />
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="displayName" className="font-mono text-xs text-cyber-cyan uppercase tracking-wider">
                &gt; Anonymous Alias
              </Label>
              <button
                type="button"
                onClick={handleRandomAlias}
                className="text-[11px] text-cyber-cyan/80 hover:text-white flex items-center gap-1 font-mono transition-colors"
              >
                <Sparkles className="h-3 w-3" />
                [Random Alias]
              </button>
            </div>
            <Input
              id="displayName"
              value={displayName}
              onChange={handleInputChange(setDisplayName)}
              placeholder="anonymous-user"
              className="font-mono bg-[#080b10]/70 border-cyan-500/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white placeholder:text-muted-foreground/40 rounded-xl"
            />
          </div>

          {/* Password Protection (Create mode only) */}
          {mode === 'create' && (
            <>
              <div className="flex items-center justify-between p-3.5 bg-[#080b10]/60 border border-cyan-500/20 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <Lock className="h-4 w-4 text-cyber-purple" />
                  <div>
                    <Label htmlFor="protected" className="font-mono text-xs text-white uppercase cursor-pointer">
                      Password Protection
                    </Label>
                    <div className="text-[10px] font-mono text-muted-foreground">Derives in-browser AES-256 key</div>
                  </div>
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
                  className="space-y-4 pt-1"
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
                        className="font-mono bg-[#080b10]/70 border-purple-500/40 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-white pr-10 rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
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
                          className={`py-2 px-2 border font-mono text-xs rounded-xl transition-all font-bold ${
                            ttl === option.value
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                              : 'bg-[#080b10]/50 border-cyan-500/20 text-muted-foreground hover:border-cyan-500/50 hover:text-slate-200'
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
              className="p-3 bg-destructive/15 border border-destructive/50 rounded-xl text-destructive text-xs font-mono flex items-center gap-2"
            >
              <span>[ERROR] {rateLimitSeconds > 0 && error.includes('Too many attempts') 
                ? ERROR_MESSAGES.RATE_LIMITED(rateLimitSeconds) 
                : error}</span>
            </motion.div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || rateLimitSeconds > 0}
            className={`w-full font-mono uppercase tracking-wider h-12 rounded-xl text-sm font-bold transition-all ${
              mode === 'create'
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(0,255,101,0.3)]'
                : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(0,240,255,0.3)]'
            }`}
            size="lg"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="animate-pulse">[CONNECTING...]</span>
              </span>
            ) : rateLimitSeconds > 0 ? (
              <span>[RETRY IN {rateLimitSeconds}S]</span>
            ) : (
              <span>{mode === 'create' ? '[INITIALIZE ROOM]' : '[CONNECT NOW]'}</span>
            )}
          </Button>
        </form>

        {/* Security Telemetry Notice */}
        <div className="mt-6 p-3.5 bg-[#080b10]/60 border border-cyan-500/20 rounded-xl text-[10px] font-mono text-muted-foreground">
          <div className="flex items-start gap-2.5">
            <Shield className="h-4 w-4 text-cyber-green mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <div className="text-cyber-green font-bold uppercase tracking-wider">CRYPTOGRAPHIC ASSURANCES</div>
              <div className="text-slate-400 leading-relaxed">
                • AES-256-GCM encryption derived in-browser via PBKDF2<br />
                • Ephemeral auto-expiry with zero persistent logs<br />
                • Ephemeral socket presence without user trackers
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
    <div className="min-h-screen bg-[#080b10] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/10 via-emerald-500/5 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Scan Line Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent animate-scan-line"></div>
      </div>

      {/* Main Glassmorphic Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg bg-[#0d1420]/85 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-[0_0_45px_rgba(0,240,255,0.12)] relative z-10 overflow-hidden"
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
