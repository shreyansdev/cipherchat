import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Terminal, 
  KeyRound, 
  UserX, 
  Fingerprint, 
  Sparkles, 
  RefreshCw, 
  Zap, 
  ShieldCheck,
  Check,
  X,
  FileText,
  AlertTriangle,
  Users
} from 'lucide-react';
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
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15, transition: { duration: 0.15 } }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className="p-6 sm:p-8 space-y-6"
  >
    {/* Cyber Logo Emblem */}
    <div className="flex justify-center relative">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl animate-pulse"></div>
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-emerald-500/10 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center relative shadow-[0_0_30px_rgba(0,240,255,0.2)]">
          <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-cyber-green animate-pulse" strokeWidth={1.75} />
          <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-cyber-cyan absolute" strokeWidth={2} />
        </div>
      </div>
    </div>

    {/* Title Section */}
    <div className="text-center space-y-2.5">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-mono text-cyber-cyan tracking-wider">
        <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: '6s' }} />
        <span>ZERO-KNOWLEDGE PROTOCOL v2.4</span>
      </div>
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
        <span className="text-cyber-green">&gt;_</span> CIPHER<span className="text-cyber-cyan">CHAT</span>
      </h2>
      <p className="text-muted-foreground text-xs sm:text-sm font-mono uppercase tracking-widest">
        [ENCRYPTED] • [EPHEMERAL] • [ANONYMOUS]
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground font-mono pt-1">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px]">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span>E2EE AES-256</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px]">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
          <span>ZERO LOGS</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[11px]">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></div>
          <span>AUTO-PURGE</span>
        </div>
      </div>
    </div>

    {/* Security Guarantees Mini Grid */}
    <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
      <div className="bg-[#080b10]/60 border border-cyan-500/20 rounded-xl p-3 hover:border-cyan-500/50 hover:bg-[#080b10]/90 transition-all group">
        <UserX className="h-4 w-4 text-cyber-green mb-1.5 group-hover:scale-110 transition-transform" />
        <div className="text-slate-200 font-bold text-xs">Anonymous</div>
        <div className="text-muted-foreground text-[10px]">No accounts or telemetry</div>
      </div>
      <div className="bg-[#080b10]/60 border border-cyan-500/20 rounded-xl p-3 hover:border-cyan-500/50 hover:bg-[#080b10]/90 transition-all group">
        <Terminal className="h-4 w-4 text-cyber-cyan mb-1.5 group-hover:scale-110 transition-transform" />
        <div className="text-slate-200 font-bold text-xs">Ephemeral</div>
        <div className="text-muted-foreground text-[10px]">Strict Redis memory TTL</div>
      </div>
      <div className="bg-[#080b10]/60 border border-cyan-500/20 rounded-xl p-3 hover:border-cyan-500/50 hover:bg-[#080b10]/90 transition-all group">
        <Lock className="h-4 w-4 text-cyber-purple mb-1.5 group-hover:scale-110 transition-transform" />
        <div className="text-slate-200 font-bold text-xs">Encrypted</div>
        <div className="text-muted-foreground text-[10px]">Client-side Web Crypto</div>
      </div>
      <div className="bg-[#080b10]/60 border border-cyan-500/20 rounded-xl p-3 hover:border-cyan-500/50 hover:bg-[#080b10]/90 transition-all group">
        <Fingerprint className="h-4 w-4 text-cyber-red mb-1.5 group-hover:scale-110 transition-transform" />
        <div className="text-slate-200 font-bold text-xs">Private</div>
        <div className="text-muted-foreground text-[10px]">Zero disk persistence</div>
      </div>
    </div>

    {/* Action Triggers */}
    <div className="space-y-3 pt-1">
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
    <div className="text-center text-[10px] text-muted-foreground font-mono border-t border-cyan-500/20 pt-3.5">
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
  const [roomName, setRoomName] = useState(() => (mode === 'create' ? generateRandomSlug() : ''));
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

  // Ensure create mode always initializes with a random slug
  useEffect(() => {
    if (mode === 'create' && !roomName) {
      setRoomName(generateRandomSlug());
    } else if (mode === 'join' && !roomName) {
      setRoomName('');
    }
  }, [mode]);

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
        exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="p-6 sm:p-8"
      >
        {/* Header Navigation */}
        <div className="mb-5 pb-4 border-b border-cyan-500/20">
          <button
            onClick={onBack}
            className="text-cyber-cyan hover:text-white transition-colors mb-2.5 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">&lt;</span> BACK TO HUB
          </button>
          <h3 className="text-xl sm:text-2xl font-bold text-white font-mono flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-cyber-green" />
            {mode === 'create' ? '[CREATE ENCRYPTED ROOM]' : '[JOIN SECURE ROOM]'}
          </h3>
          <p className="text-muted-foreground text-xs font-mono mt-1">
            {mode === 'create' 
              ? 'INITIALIZE SECURE EPHEMERAL CHANNEL' 
              : 'CONNECT TO EXISTING ENCRYPTED ROOM'}
          </p>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Room Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="roomName" className="font-mono text-xs text-cyber-green uppercase tracking-wider flex items-center gap-1.5">
                <span>&gt; Room Identifier</span>
                {mode === 'create' && (
                  <span className="text-[10px] text-muted-foreground/80 font-normal lowercase tracking-normal">
                    (auto-generated)
                  </span>
                )}
              </Label>
              {mode === 'create' && (
                <button
                  type="button"
                  onClick={handleGenerateSlug}
                  className="text-[11px] text-cyber-cyan hover:text-white flex items-center gap-1 font-mono transition-colors"
                  title="Generate new random identifier"
                >
                  <RefreshCw className="h-3 w-3" />
                  [Random Slug]
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                id="roomName"
                value={roomName}
                readOnly={mode === 'create'}
                onChange={mode === 'create' ? undefined : handleInputChange(setRoomName)}
                placeholder="enter-room-name"
                className={`font-mono border-cyan-500/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white placeholder:text-muted-foreground/40 rounded-xl ${
                  mode === 'create'
                    ? 'bg-[#080b10]/90 text-emerald-400 font-bold select-all cursor-default pr-9 border-emerald-500/30'
                    : 'bg-[#080b10]/70'
                }`}
              />
              {mode === 'create' && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400/60 pointer-events-none" title="Random Identifier">
                  <Lock className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
            {mode === 'create' && (
              <div className="text-[10px] font-mono text-muted-foreground/80 flex items-center gap-1">
                <span>⚡ Ephemeral channel ID randomly assigned for zero metadata linkability.</span>
              </div>
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
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
              <div className="flex items-center justify-between p-3 bg-[#080b10]/60 border border-cyan-500/20 rounded-xl">
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

              {!isProtected && (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] font-mono text-amber-300/90 leading-tight">
                    <strong className="text-amber-300">Public Channel:</strong> Anyone who discovers this room slug can decrypt and read messages. Set a password for end-to-end confidential chats.
                  </p>
                </div>
              )}

              {isProtected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3.5 pt-1"
                >
                  <div className="space-y-1.5">
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors p-1"
                        title={showPassword ? "Hide password" : "Show password"}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
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
        <div className="mt-5 p-3 bg-[#080b10]/60 border border-cyan-500/20 rounded-xl text-[10px] font-mono text-muted-foreground">
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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#080b10] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-cyan-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[600px] h-[400px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* ========================================================================= */}
      {/* TOP NAVIGATION HEADER */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#080b10]/80 border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Protocol Badge */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setMode('initial');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 group text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 via-emerald-500/10 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center relative shadow-[0_0_15px_rgba(0,240,255,0.2)] group-hover:border-cyan-400 transition-colors">
                <Shield className="h-5 w-5 text-cyber-green" strokeWidth={1.75} />
                <Lock className="h-2.5 w-2.5 text-cyber-cyan absolute" strokeWidth={2.5} />
              </div>
              <div>
                <div className="font-mono font-extrabold text-base tracking-wider text-white flex items-center gap-1">
                  <span className="text-cyber-green">&gt;_</span>CIPHER<span className="text-cyber-cyan">CHAT</span>
                </div>
                <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest hidden sm:block">
                  ZERO-KNOWLEDGE PROTOCOL
                </div>
              </div>
            </button>

            <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              v2.4 LTS
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 font-mono text-xs text-muted-foreground">
            <button 
              onClick={() => scrollToSection('protocol')} 
              className="hover:text-cyber-cyan transition-colors"
            >
              // PROTOCOL
            </button>
            <button 
              onClick={() => scrollToSection('security')} 
              className="hover:text-cyber-cyan transition-colors"
            >
              // SECURITY
            </button>
            <button 
              onClick={() => scrollToSection('comparison')} 
              className="hover:text-cyber-cyan transition-colors"
            >
              // SPECS
            </button>
          </nav>

          {/* System Status Indicator & Quick CTA */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0d1420] border border-cyan-500/20 text-[11px] font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-bold">MEMORY-ONLY</span>
            </div>

            {mode === 'initial' ? (
              <Button
                onClick={() => {
                  setMode('create');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="font-mono text-xs uppercase tracking-wider bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 hover:border-emerald-400 h-9 px-3.5 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(0,255,101,0.15)]"
              >
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">LAUNCH ROOM</span>
                <span className="sm:hidden">LAUNCH</span>
              </Button>
            ) : (
              <Button
                onClick={() => setMode('initial')}
                variant="secondary"
                className="font-mono text-xs uppercase tracking-wider bg-[#0d1420] text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 h-9 px-3.5 rounded-lg font-bold transition-all"
              >
                HUB
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN HERO SECTION (2-Column Grid on Desktop, Stacked on Mobile) */}
      {/* ========================================================================= */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Hero Narrative & Cryptographic Telemetry */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-6 text-left">
            
            {/* Top Eyebrow Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono text-cyber-cyan tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.1)]">
              <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse"></span>
              <span>MIL-SPEC ENCRYPTION • ZERO DISK RESIDUE</span>
            </div>

            {/* Giant Main Headline */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-white font-mono leading-tight">
                Ephemeral Rooms. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400">
                  Zero Metadata Trace.
                </span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base lg:text-lg font-mono leading-relaxed pt-2">
                Real-time, zero-knowledge chat channels with browser-derived AES-256-GCM keys. All messages reside strictly in volatile Redis RAM with hard TTL expiration.
              </p>
            </div>

            {/* Key Metric Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-[#0d1420]/80 border border-cyan-500/20 rounded-xl p-3.5 font-mono">
                <div className="text-xs text-muted-foreground uppercase">Cipher</div>
                <div className="text-lg font-bold text-cyber-green">AES-256</div>
                <div className="text-[10px] text-muted-foreground/80">GCM Authenticated</div>
              </div>
              <div className="bg-[#0d1420]/80 border border-cyan-500/20 rounded-xl p-3.5 font-mono">
                <div className="text-xs text-muted-foreground uppercase">KDF Iterations</div>
                <div className="text-lg font-bold text-cyber-cyan">310,000</div>
                <div className="text-[10px] text-muted-foreground/80">PBKDF2 SHA-256</div>
              </div>
              <div className="bg-[#0d1420]/80 border border-cyan-500/20 rounded-xl p-3.5 font-mono">
                <div className="text-xs text-muted-foreground uppercase">Server Plaintext</div>
                <div className="text-lg font-bold text-purple-400">0.00%</div>
                <div className="text-[10px] text-muted-foreground/80">End-to-End Blind</div>
              </div>
              <div className="bg-[#0d1420]/80 border border-cyan-500/20 rounded-xl p-3.5 font-mono">
                <div className="text-xs text-muted-foreground uppercase">Persistence</div>
                <div className="text-lg font-bold text-cyber-amber">0 Disk</div>
                <div className="text-[10px] text-muted-foreground/80">Pure RAM + Hard TTL</div>
              </div>
            </div>

            {/* Live Cryptographic Telemetry Console */}
            <div className="bg-[#05070a]/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 font-mono shadow-[0_0_30px_rgba(0,240,255,0.08)] relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-cyan-500/20 text-xs">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-cyber-green" />
                  <span className="text-slate-200 font-bold tracking-wider">LIVE_SECURITY_TELEMETRY.SYS</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  SYSTEM READY
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-400 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">&gt; WebCrypto Subtle API:</span>
                  <span className="text-emerald-400 font-bold">ACTIVE (In-Browser Only)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">&gt; Key Derivation Vector:</span>
                  <span className="text-cyan-400">Deterministic Room Salt</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">&gt; Per-Packet Initialization:</span>
                  <span className="text-purple-400">Fresh 96-bit Random IV</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">&gt; Redis Memory Auto-Purge:</span>
                  <span className="text-cyber-amber">Hard TTL Auto-Destruction</span>
                </div>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs text-muted-foreground">
              <span className="px-2.5 py-1 rounded-lg bg-[#0d1420] border border-cyan-500/20 text-slate-300">
                #NoAccounts
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#0d1420] border border-cyan-500/20 text-slate-300">
                #ZeroTelemetry
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#0d1420] border border-cyan-500/20 text-slate-300">
                #HardTTL
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#0d1420] border border-cyan-500/20 text-slate-300">
                #DOMPurify
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#0d1420] border border-cyan-500/20 text-slate-300">
                #VolatilePresence
              </span>
            </div>

          </div>

          {/* Right Column: Main Interactive Card (InitialView / FormView) */}
          <div className="lg:col-span-6 xl:col-span-5 w-full flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg bg-[#0d1420]/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.15)] relative z-10 overflow-hidden"
            >
              {/* Terminal Title Bar */}
              <div className="bg-[#080b10] px-4 py-2.5 border-b border-cyan-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                  <span className="ml-2 text-[11px] font-mono text-muted-foreground uppercase tracking-widest">
                    SYS://CIPHER_DISPATCHER
                  </span>
                </div>
                <div className="text-[10px] font-mono text-cyber-green flex items-center gap-1 font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse"></div>
                  <span>ENCRYPTED</span>
                </div>
              </div>

              {/* Card Views */}
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

        </div>
      </main>

      {/* ========================================================================= */}
      {/* SECTION 2: HOW ZERO-KNOWLEDGE E2EE WORKS (PROTOCOL PIPELINE) */}
      {/* ========================================================================= */}
      <section id="protocol" className="w-full border-t border-cyan-500/20 bg-[#06090e]/80 py-16 lg:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Section Header */}
          <div className="text-center space-y-3 max-w-3xl mx-auto font-mono">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-cyber-green font-bold uppercase tracking-wider">
              <Terminal className="h-3.5 w-3.5" />
              // ARCHITECTURAL LIFECYCLE
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Zero-Knowledge Protocol Pipeline
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              The server acts purely as an ephemeral blind relay. Key synthesis, message encryption, and packet decryption occur exclusively inside the client runtime.
            </p>
          </div>

          {/* 4-Step Interactive Pipeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-mono">
            
            {/* Step 1 */}
            <div className="bg-[#0d1420]/70 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(0,240,255,0.12)] transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-cyber-green group-hover:scale-110 transition-transform">01</span>
                  <KeyRound className="h-6 w-6 text-cyber-green" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase">Key Synthesis</h3>
                  <div className="text-xs text-cyber-cyan mt-1">PBKDF2-SHA256 • 310k Rounds</div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  The client derives a 256-bit AES-GCM key using the room password and deterministic room slug salt. Keys never touch the network or server.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-cyan-500/15 text-[10px] text-muted-foreground flex items-center gap-1">
                <Check className="h-3 w-3 text-cyber-green" />
                <span>Isolated in client RAM</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#0d1420]/70 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(0,240,255,0.12)] transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-cyber-cyan group-hover:scale-110 transition-transform">02</span>
                  <Lock className="h-6 w-6 text-cyber-cyan" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase">Client Encryption</h3>
                  <div className="text-xs text-cyber-cyan mt-1">AES-256-GCM + 96-bit IV</div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Before sending, plaintext is encrypted in-browser using Web Crypto API. A cryptographically unique 96-bit IV is generated per message.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-cyan-500/15 text-[10px] text-muted-foreground flex items-center gap-1">
                <Check className="h-3 w-3 text-cyber-cyan" />
                <span>Ciphertext only over TLS</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#0d1420]/70 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(0,240,255,0.12)] transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-purple-400 group-hover:scale-110 transition-transform">03</span>
                  <ShieldCheck className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase">Ephemeral Relay</h3>
                  <div className="text-xs text-purple-400 mt-1">Redis 7 • Zero Disk Writes</div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Node.js relays ciphertext packets into Redis in-memory storage. A strict TTL timer counts down until automated unrecoverable data destruction.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-cyan-500/15 text-[10px] text-muted-foreground flex items-center gap-1">
                <Check className="h-3 w-3 text-purple-400" />
                <span>Auto-expiring memory</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-[#0d1420]/70 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(0,240,255,0.12)] transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-cyber-amber group-hover:scale-110 transition-transform">04</span>
                  <Shield className="h-6 w-6 text-cyber-amber" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase">Peer Decryption</h3>
                  <div className="text-xs text-cyber-amber mt-1">Local WebCrypto Verification</div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Peers receive ciphertext and decrypt locally with their derived key. Authenticated GCM tags ensure tampering or corruption is instantly rejected.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-cyan-500/15 text-[10px] text-muted-foreground flex items-center gap-1">
                <Check className="h-3 w-3 text-cyber-amber" />
                <span>Zero plaintext history</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: CORE SECURITY GUARANTEES */}
      {/* ========================================================================= */}
      <section id="security" className="w-full border-t border-cyan-500/20 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Section Header */}
          <div className="text-center space-y-3 max-w-3xl mx-auto font-mono">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyber-cyan font-bold uppercase tracking-wider">
              <AlertTriangle className="h-3.5 w-3.5" />
              // SECURITY ASSURANCES
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Engineered for Complete Privacy
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Built on transparent cryptographic principles and zero data retention standards.
            </p>
          </div>

          {/* 6-Grid Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono">
            
            <div className="bg-[#0d1420]/80 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-500/60 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-cyber-green">
                <UserX className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">No User Accounts or Tracking</h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Zero sign-ups, no cookies, no advertising telemetry, and no device fingerprinting. Users join with disposable pseudonyms without metadata association.
              </p>
            </div>

            <div className="bg-[#0d1420]/80 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-500/60 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyber-cyan">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Hard Redis Ephemeral TTL</h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Rooms automatically expire after 1h, 6h, 24h, or 7d. Once the TTL counter reaches zero, Redis deletes all message lists and metadata permanently.
              </p>
            </div>

            <div className="bg-[#0d1420]/80 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-500/60 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-cyber-purple">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Zero Server-Side Plaintext</h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Plaintext messages and room passwords never touch the server. The backend operates completely blind, acting solely as a real-time ciphertext relay.
              </p>
            </div>

            <div className="bg-[#0d1420]/80 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-500/60 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-cyber-amber">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Bcrypt-Hashed Protection</h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Room entry passwords are never stored in plaintext. Server-side verification utilizes bcrypt with cost factor 12 to reject unauthorized join requests.
              </p>
            </div>

            <div className="bg-[#0d1420]/80 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-500/60 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-cyber-green">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Dual-Layer DOMPurify</h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Strict input and payload sanitization with DOMPurify on both client and server blocks XSS, script injection, and malicious tag payloads.
              </p>
            </div>

            <div className="bg-[#0d1420]/80 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-500/60 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyber-cyan">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Strict Rate Limiting</h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Per-IP REST rate limits and socket throttling prevent credential brute forcing, automated channel flooding, and denial-of-service attempts.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: TECHNICAL COMPARISON MATRIX */}
      {/* ========================================================================= */}
      <section id="comparison" className="w-full border-t border-cyan-500/20 bg-[#06090e]/80 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 font-mono">
          
          {/* Section Header */}
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs text-purple-400 font-bold uppercase tracking-wider">
              <FileText className="h-3.5 w-3.5" />
              // ARCHITECTURAL BENCHMARK
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              CipherChat vs Traditional Messengers
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Comparing privacy assurances, cryptographic trust assumptions, and data lifecycle.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto rounded-2xl border border-cyan-500/30 bg-[#0d1420]/80 shadow-[0_0_30px_rgba(0,240,255,0.06)]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-cyan-500/30 bg-[#080b10] text-slate-400 font-bold">
                  <th className="py-4 px-4 sm:px-6 uppercase tracking-wider">Feature / Security Parameter</th>
                  <th className="py-4 px-4 sm:px-6 text-cyber-green uppercase tracking-wider">CipherChat</th>
                  <th className="py-4 px-4 sm:px-6 text-slate-500 uppercase tracking-wider">Discord / Slack</th>
                  <th className="py-4 px-4 sm:px-6 text-slate-500 uppercase tracking-wider">Telegram (Default)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/15 text-slate-300">
                <tr className="hover:bg-cyan-500/5 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-white">Browser-Derived AES-256 E2EE</td>
                  <td className="py-3.5 px-4 sm:px-6 text-cyber-green font-bold flex items-center gap-1.5">
                    <Check className="h-4 w-4" /> Always Active
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-500 flex items-center gap-1.5">
                    <X className="h-4 w-4 text-destructive" /> None (Plaintext Server)
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-500 flex items-center gap-1.5">
                    <X className="h-4 w-4 text-destructive" /> Server-side MTProto
                  </td>
                </tr>

                <tr className="hover:bg-cyan-500/5 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-white">Server Plaintext Access</td>
                  <td className="py-3.5 px-4 sm:px-6 text-cyber-green font-bold">
                    Zero (Server is Blind)
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-destructive">
                    Full Server Plaintext
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-destructive">
                    Stored on Server
                  </td>
                </tr>

                <tr className="hover:bg-cyan-500/5 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-white">Data Retention / Persistence</td>
                  <td className="py-3.5 px-4 sm:px-6 text-cyber-cyan font-bold">
                    Hard Ephemeral TTL (RAM Only)
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-500">
                    Indefinite Disk Storage
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-500">
                    Indefinite Cloud Sync
                  </td>
                </tr>

                <tr className="hover:bg-cyan-500/5 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-white">User Accounts &amp; Telemetry</td>
                  <td className="py-3.5 px-4 sm:px-6 text-cyber-green font-bold flex items-center gap-1.5">
                    <Check className="h-4 w-4" /> Zero (No Accounts/Logs)
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-500">
                    Mandatory Email / Phone / Analytics
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-500">
                    Mandatory Phone Number
                  </td>
                </tr>

                <tr className="hover:bg-cyan-500/5 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-white">Client Key Storage</td>
                  <td className="py-3.5 px-4 sm:px-6 text-cyber-green font-bold">
                    Isolated Browser Memory Only
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-500">
                    N/A
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-500">
                    Server Key Escrow
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FOOTER */}
      {/* ========================================================================= */}
      <footer className="w-full border-t border-cyan-500/20 bg-[#080b10] py-12 text-slate-400 font-mono text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Logo & Statement */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border border-cyan-500/40 flex items-center justify-center">
                <Shield className="h-4 w-4 text-cyber-green" />
              </div>
              <div>
                <div className="font-bold text-white text-sm">
                  <span className="text-cyber-green">&gt;_</span> CIPHER<span className="text-cyber-cyan">CHAT</span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  EPHEMERAL ZERO-KNOWLEDGE CHAT
                </div>
              </div>
            </div>

            {/* Quick Spec Tags */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-green"></div>
                AES-256-GCM
              </span>
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-cyan"></div>
                PBKDF2-SHA256
              </span>
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                Redis 7 RAM
              </span>
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-amber"></div>
                Zero Disk Persistence
              </span>
            </div>

            {/* Back to Top / Action */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-cyber-cyan hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wider"
            >
              <span>[BACK TO TOP]</span>
            </button>
          </div>

          <div className="border-t border-cyan-500/15 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-muted-foreground">
            <div>
              CIPHERCHAT ZERO-KNOWLEDGE PROTOCOL v2.4 • OPEN CRYPTOGRAPHIC SPECIFICATION
            </div>
            <div>
              ALL PACKETS ENCRYPTED VIA CLIENT WEBCRYPTO SUBTLE API
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;
