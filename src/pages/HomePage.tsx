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
  Users,
  Copy
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Switch from '../components/ui/Switch';
import PasswordModal from '../components/chat/PasswordModal';
import AnimatedNavFramer, { NavItem } from '../components/ui/navigation-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { createRoom, checkRoomProtection, verifyRoomPassword } from '../lib/api';
import DOMPurify from 'dompurify';
import { ERROR_MESSAGES, ERROR_CODES } from '../lib/errors';
import CryptoPlayground from '../components/home/CryptoPlayground';
import ProtocolPipeline from '../components/home/ProtocolPipeline';
import SecurityFaq from '../components/home/SecurityFaq';

const ROOM_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

const ADJECTIVES = ['cyber', 'neon', 'quantum', 'stealth', 'shadow', 'hyper', 'crypto', 'dark', 'void', 'sonic', 'phantom', 'zero'];
const NOUNS = ['pulse', 'matrix', 'vault', 'cipher', 'nexus', 'shield', 'specter', 'core', 'signal', 'node', 'relay', 'bastion'];
const RANDOM_ALIASES = ['Ghost_Protocol', 'Cipher_007', 'Neon_Specter', 'Quantum_Rebel', 'Void_Runner', 'Shadow_Agent', 'Cipherpunk_42'];

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
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12, transition: { duration: 0.15 } }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
    className="p-6 sm:p-8 space-y-6"
  >
    {/* Cyber Emblem Badge */}
    <div className="flex justify-center relative">
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-cyan-500/25 blur-xl animate-pulse" aria-hidden="true" />
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-emerald-500/10 to-purple-500/20 border border-cyan-400/50 flex items-center justify-center relative shadow-[0_0_30px_rgba(0,240,255,0.25)]">
          <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-cyber-green animate-pulse" strokeWidth={1.75} aria-hidden="true" />
          <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-cyber-cyan absolute" strokeWidth={2} aria-hidden="true" />
        </div>
      </div>
    </div>

    {/* Title Section */}
    <div className="text-center space-y-2.5">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-mono text-cyber-cyan tracking-wider">
        <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: '6s' }} aria-hidden="true" />
        <span>ZERO-KNOWLEDGE PROTOCOL v2.4</span>
      </div>
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
        <span className="text-cyber-green">&gt;_</span> CIPHER<span className="text-cyber-cyan">CHAT</span>
      </h2>
      <p className="text-slate-400 text-xs sm:text-sm font-mono uppercase tracking-widest">
        [ENCRYPTED] • [EPHEMERAL] • [ANONYMOUS]
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground font-mono pt-1">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
          <span>E2EE AES-256-GCM</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-semibold">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" aria-hidden="true" />
          <span>ZERO LOGS</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[11px] font-semibold">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" aria-hidden="true" />
          <span>AUTO-PURGE RAM</span>
        </div>
      </div>
    </div>

    {/* Security Guarantees Mini Grid */}
    <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
      <div className="bg-[#080b10]/70 border border-cyan-500/20 rounded-xl p-3 hover:border-cyan-500/50 hover:bg-[#080b10] transition-all group">
        <UserX className="h-4 w-4 text-cyber-green mb-1.5 group-hover:scale-110 transition-transform" aria-hidden="true" />
        <div className="text-slate-200 font-bold text-xs">Anonymous</div>
        <div className="text-slate-400 text-[10px]">No accounts or telemetry</div>
      </div>
      <div className="bg-[#080b10]/70 border border-cyan-500/20 rounded-xl p-3 hover:border-cyan-500/50 hover:bg-[#080b10] transition-all group">
        <Terminal className="h-4 w-4 text-cyber-cyan mb-1.5 group-hover:scale-110 transition-transform" aria-hidden="true" />
        <div className="text-slate-200 font-bold text-xs">Ephemeral</div>
        <div className="text-slate-400 text-[10px]">Strict Redis memory TTL</div>
      </div>
      <div className="bg-[#080b10]/70 border border-cyan-500/20 rounded-xl p-3 hover:border-cyan-500/50 hover:bg-[#080b10] transition-all group">
        <Lock className="h-4 w-4 text-cyber-purple mb-1.5 group-hover:scale-110 transition-transform" aria-hidden="true" />
        <div className="text-slate-200 font-bold text-xs">Encrypted</div>
        <div className="text-slate-400 text-[10px]">Client-side Web Crypto</div>
      </div>
      <div className="bg-[#080b10]/70 border border-cyan-500/20 rounded-xl p-3 hover:border-cyan-500/50 hover:bg-[#080b10] transition-all group">
        <Fingerprint className="h-4 w-4 text-cyber-red mb-1.5 group-hover:scale-110 transition-transform" aria-hidden="true" />
        <div className="text-slate-200 font-bold text-xs">Private</div>
        <div className="text-slate-400 text-[10px]">Zero disk persistence</div>
      </div>
    </div>

    {/* Action Triggers */}
    <div className="space-y-3 pt-1">
      <Button 
        onClick={() => onSetMode('create')} 
        className="w-full font-mono uppercase tracking-wider bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(0,255,101,0.35)] transition-all h-12 rounded-xl text-sm font-bold focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none" 
        size="lg"
      >
        <Zap className="mr-2 h-4 w-4" aria-hidden="true" />
        [CREATE SECURE ROOM]
      </Button>
      <Button 
        onClick={() => onSetMode('join')} 
        variant="secondary" 
        className="w-full font-mono uppercase tracking-wider bg-[#080b10]/80 hover:bg-[#080b10] text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(0,240,255,0.25)] transition-all h-12 rounded-xl text-sm font-bold focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none" 
        size="lg"
      >
        <KeyRound className="mr-2 h-4 w-4" aria-hidden="true" />
        [JOIN EXISTING ROOM]
      </Button>
    </div>

    {/* Footer Security Notice */}
    <div className="text-center text-[10px] text-muted-foreground font-mono border-t border-cyan-500/20 pt-3.5">
      <div className="text-cyber-amber font-bold">⚡ HARD EPHEMERAL TTL • IN-MEMORY STORAGE ONLY</div>
      <div className="text-slate-500 mt-1">NO DATA RETENTION • NO SERVER-SIDE PLAINTEXT</div>
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
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
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
    setIsGeneratingSlug(true);
    const slug = generateRandomSlug();
    setRoomName(slug);
    if (error) setError(null);
    setTimeout(() => setIsGeneratingSlug(false), 300);
  };

  const handleRandomAlias = () => {
    const alias = RANDOM_ALIASES[Math.floor(Math.random() * RANDOM_ALIASES.length)];
    setDisplayName(alias);
    if (error) setError(null);
  };

  // Compute visual password strength meter
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-slate-700' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score: 2, label: 'Moderate', color: 'bg-amber-500' };
    if (score <= 4) return { score: 3, label: 'Strong', color: 'bg-cyan-400' };
    return { score: 4, label: 'Fortified', color: 'bg-emerald-400' };
  };

  const pwdStrength = getPasswordStrength(password);

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
            type="button"
            onClick={onBack}
            className="text-cyber-cyan hover:text-white transition-colors mb-2.5 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider group focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none rounded-md px-1"
          >
            <span className="group-hover:-translate-x-1 transition-transform" aria-hidden="true">&lt;</span> BACK TO HUB
          </button>
          <h3 className="text-xl sm:text-2xl font-bold text-white font-mono flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-cyber-green" aria-hidden="true" />
            {mode === 'create' ? '[CREATE ENCRYPTED ROOM]' : '[JOIN SECURE ROOM]'}
          </h3>
          <p className="text-slate-400 text-xs font-mono mt-1">
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
              <Label htmlFor="roomName" className="font-mono text-xs text-cyber-green uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                <span>&gt; Room Identifier</span>
                {mode === 'create' && (
                  <span className="text-[10px] text-slate-400 font-normal lowercase tracking-normal">
                    (auto-generated)
                  </span>
                )}
              </Label>
              {mode === 'create' && (
                <button
                  type="button"
                  onClick={handleGenerateSlug}
                  className="text-[11px] text-cyber-cyan hover:text-white flex items-center gap-1 font-mono transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none rounded px-1"
                  title="Generate new random identifier"
                  aria-label="Generate new random identifier"
                >
                  <RefreshCw className={`h-3 w-3 ${isGeneratingSlug ? 'animate-spin' : ''}`} aria-hidden="true" />
                  <span>[Random Slug]</span>
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                id="roomName"
                name="roomName"
                value={roomName}
                readOnly={mode === 'create'}
                onChange={mode === 'create' ? undefined : handleInputChange(setRoomName)}
                placeholder="enter-room-name"
                spellCheck={false}
                autoComplete="off"
                className={`font-mono border-cyan-500/30 focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400 text-white placeholder:text-slate-600 rounded-xl ${
                  mode === 'create'
                    ? 'bg-[#080b10]/90 text-emerald-400 font-bold select-all cursor-default pr-9 border-emerald-500/40'
                    : 'bg-[#080b10]/80'
                }`}
              />
              {mode === 'create' && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400/70 pointer-events-none" title="Random Identifier">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
              )}
            </div>
            {mode === 'create' && (
              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <span>⚡ Ephemeral channel ID randomly assigned for zero metadata linkability.</span>
              </div>
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="displayName" className="font-mono text-xs text-cyber-cyan uppercase tracking-wider cursor-pointer">
                &gt; Anonymous Alias
              </Label>
              <button
                type="button"
                onClick={handleRandomAlias}
                className="text-[11px] text-cyber-cyan/90 hover:text-white flex items-center gap-1 font-mono transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none rounded px-1"
                aria-label="Generate random alias"
              >
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                <span>[Random Alias]</span>
              </button>
            </div>
            <Input
              id="displayName"
              name="displayName"
              value={displayName}
              onChange={handleInputChange(setDisplayName)}
              placeholder="anonymous-user"
              spellCheck={false}
              autoComplete="off"
              className="font-mono bg-[#080b10]/80 border-cyan-500/30 focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400 text-white placeholder:text-slate-600 rounded-xl"
            />
          </div>

          {/* Password Protection (Create mode only) */}
          {mode === 'create' && (
            <>
              <div className="flex items-center justify-between p-3.5 bg-[#080b10]/80 border border-cyan-500/25 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <Lock className="h-4 w-4 text-cyber-purple" aria-hidden="true" />
                  <div>
                    <Label htmlFor="protected" className="font-mono text-xs text-white uppercase cursor-pointer block font-bold">
                      Password Protection
                    </Label>
                    <div className="text-[10px] font-mono text-slate-400">Derives in-browser AES-256 key</div>
                  </div>
                </div>
                <Switch
                  id="protected"
                  checked={isProtected}
                  onCheckedChange={setIsProtected}
                />
              </div>

              {!isProtected && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-[11px] font-mono text-amber-300/90 leading-relaxed">
                    <strong className="text-amber-300">Public Channel:</strong> Anyone with this room identifier can decrypt messages. Enable password protection for confidential E2EE chats.
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="font-mono text-xs text-cyber-purple uppercase tracking-wider cursor-pointer font-bold">
                        &gt; Encryption Key
                      </Label>
                      {password && (
                        <span className="text-[10px] font-mono text-slate-400">
                          Strength: <span className="font-bold text-slate-200">{pwdStrength.label}</span>
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={handleInputChange(setPassword)}
                        placeholder="••••••••"
                        required={isProtected}
                        spellCheck={false}
                        autoComplete="new-password"
                        className="font-mono bg-[#080b10]/90 border-purple-500/40 focus-visible:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-400 text-white pr-10 rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none rounded"
                        title={showPassword ? "Hide password" : "Show password"}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <Eye className="h-4 w-4" aria-hidden="true" /> : <EyeOff className="h-4 w-4" aria-hidden="true" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator Bars */}
                    {password && (
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-1 rounded-full transition-all duration-300 ${
                              step <= pwdStrength.score ? pwdStrength.color : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    )}
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
                          className={`py-2 px-2 border font-mono text-xs rounded-xl transition-all font-bold focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                            ttl === option.value
                              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                              : 'bg-[#080b10]/60 border-cyan-500/20 text-slate-400 hover:border-cyan-500/50 hover:text-slate-200'
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
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-destructive/15 border border-destructive/50 rounded-xl text-destructive text-xs font-mono flex items-center gap-2"
              role="alert"
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
            className={`w-full font-mono uppercase tracking-wider h-12 rounded-xl text-sm font-bold transition-all focus-visible:ring-2 focus-visible:outline-none ${
              mode === 'create'
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(0,255,101,0.35)] focus-visible:ring-emerald-400'
                : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(0,240,255,0.35)] focus-visible:ring-cyan-400'
            }`}
            size="lg"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span className="animate-pulse">[CONNECTING…]</span>
              </span>
            ) : rateLimitSeconds > 0 ? (
              <span>[RETRY IN {rateLimitSeconds}S]</span>
            ) : (
              <span>{mode === 'create' ? '[INITIALIZE ROOM]' : '[CONNECT NOW]'}</span>
            )}
          </Button>
        </form>

        {/* Security Telemetry Notice */}
        <div className="mt-5 p-3.5 bg-[#080b10]/70 border border-cyan-500/20 rounded-xl text-[10px] font-mono text-slate-400">
          <div className="flex items-start gap-2.5">
            <Shield className="h-4 w-4 text-cyber-green mt-0.5 flex-shrink-0" aria-hidden="true" />
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
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-cyan-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10 opacity-70" aria-hidden="true" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[700px] h-[450px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none -z-10 opacity-60" aria-hidden="true" />

      {/* ========================================================================= */}
      {/* TOP NAVIGATION: ANIMATED FRAMER MOTION PILL NAVBAR */}
      {/* ========================================================================= */}
      <AnimatedNavFramer
        items={[
          { name: "Home", href: "#" },
          { name: "Playground", href: "#playground" },
          { name: "Protocol", href: "#protocol" },
          { name: "Security", href: "#security" },
          { name: "Specs", href: "#comparison" },
          { name: "FAQ", href: "#faq" },
        ]}
        logo={
          <button
            type="button"
            onClick={() => {
              setMode('initial');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 group text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none rounded-lg p-0.5"
            aria-label="Home"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/25 via-emerald-500/15 to-purple-500/25 border border-cyan-400/50 flex items-center justify-center relative shadow-[0_0_15px_rgba(0,240,255,0.25)] group-hover:border-cyan-300 transition-colors">
              <Shield className="h-4 w-4 text-cyber-green" strokeWidth={1.75} aria-hidden="true" />
              <Lock className="h-2 w-2 text-cyber-cyan absolute" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <span className="font-mono font-extrabold text-xs tracking-wider text-white hidden sm:flex items-center gap-0.5">
              <span className="text-cyber-green">&gt;_</span>CIPHER<span className="text-cyber-cyan">CHAT</span>
            </span>
          </button>
        }
        onItemClick={(item, e) => {
          e.preventDefault();
          const name = item.name.toLowerCase();
          if (name === 'home' || item.href === '#') {
            setMode('initial');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else if (name === 'playground') {
            scrollToSection('playground');
          } else if (name === 'protocol' || name === 'about') {
            scrollToSection('protocol');
          } else if (name === 'security' || name === 'services') {
            scrollToSection('security');
          } else if (name === 'specs' || name === 'contact') {
            scrollToSection('comparison');
          } else if (name === 'faq') {
            scrollToSection('faq');
          } else if (item.href.startsWith('#')) {
            scrollToSection(item.href.slice(1));
          }
        }}
      />

      {/* ========================================================================= */}
      {/* MAIN HERO SECTION (2-Column Grid on Desktop, Stacked on Mobile) */}
      {/* ========================================================================= */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12 sm:pb-16 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Hero Narrative & Cryptographic Telemetry */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-6 text-left">
            
            {/* Top Eyebrow Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono text-cyber-cyan tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.12)]">
              <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" aria-hidden="true" />
              <span>MIL-SPEC ENCRYPTION • ZERO DISK RESIDUE</span>
            </div>

            {/* Giant Main Headline */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-white font-mono leading-tight">
                Ephemeral Rooms. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400">
                  Zero Metadata Trace.
                </span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base lg:text-lg font-mono leading-relaxed pt-1 max-w-2xl">
                Real-time, zero-knowledge chat channels with browser-derived AES-256-GCM keys. All messages reside strictly in volatile Redis RAM with hard TTL expiration.
              </p>
            </div>

            {/* Key Metric Highlights with tabular numbers */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono tabular-nums">
              <div className="bg-[#0b121e]/80 border border-cyan-500/20 rounded-xl p-3.5">
                <div className="text-xs text-slate-400 uppercase">Cipher</div>
                <div className="text-lg font-bold text-cyber-green">AES-256</div>
                <div className="text-[10px] text-slate-500">GCM Authenticated</div>
              </div>
              <div className="bg-[#0b121e]/80 border border-cyan-500/20 rounded-xl p-3.5">
                <div className="text-xs text-slate-400 uppercase">KDF Iterations</div>
                <div className="text-lg font-bold text-cyber-cyan">310,000</div>
                <div className="text-[10px] text-slate-500">PBKDF2 SHA-256</div>
              </div>
              <div className="bg-[#0b121e]/80 border border-cyan-500/20 rounded-xl p-3.5">
                <div className="text-xs text-slate-400 uppercase">Server Plaintext</div>
                <div className="text-lg font-bold text-purple-400">0.00%</div>
                <div className="text-[10px] text-slate-500">End-to-End Blind</div>
              </div>
              <div className="bg-[#0b121e]/80 border border-cyan-500/20 rounded-xl p-3.5">
                <div className="text-xs text-slate-400 uppercase">Persistence</div>
                <div className="text-lg font-bold text-cyber-amber">0 Disk</div>
                <div className="text-[10px] text-slate-500">Pure RAM + Hard TTL</div>
              </div>
            </div>

            {/* Live Cryptographic Telemetry Console */}
            <div className="bg-[#05080e]/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 font-mono shadow-[0_0_30px_rgba(0,240,255,0.08)] relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-cyan-500/20 text-xs">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-cyber-green" aria-hidden="true" />
                  <span className="text-slate-200 font-bold tracking-wider">LIVE_SECURITY_TELEMETRY.SYS</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
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
              <span className="px-2.5 py-1 rounded-lg bg-[#0b121e] border border-cyan-500/20 text-slate-300">
                #NoAccounts
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#0b121e] border border-cyan-500/20 text-slate-300">
                #ZeroTelemetry
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#0b121e] border border-cyan-500/20 text-slate-300">
                #HardTTL
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#0b121e] border border-cyan-500/20 text-slate-300">
                #DOMPurify
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#0b121e] border border-cyan-500/20 text-slate-300">
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
              className="w-full max-w-lg bg-[#0a101a]/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.15)] relative z-10 overflow-hidden"
            >
              {/* Terminal Title Bar */}
              <div className="bg-[#05080e] px-4 py-2.5 border-b border-cyan-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" aria-hidden="true" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" aria-hidden="true" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" aria-hidden="true" />
                  <span className="ml-2 text-[11px] font-mono text-slate-400 uppercase tracking-widest">
                    SYS://CIPHER_DISPATCHER
                  </span>
                </div>
                <div className="text-[10px] font-mono text-cyber-green flex items-center gap-1 font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" aria-hidden="true" />
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

        {/* ========================================================================= */}
        {/* INTERACTIVE CRYPTOGRAPHIC PLAYGROUND SECTION */}
        {/* ========================================================================= */}
        <section id="playground" className="mt-16 sm:mt-24 pt-10 border-t border-cyan-500/20">
          <CryptoPlayground />
        </section>
      </main>

      {/* ========================================================================= */}
      {/* SECTION 2: PROTOCOL PIPELINE ARCHITECTURE */}
      {/* ========================================================================= */}
      <ProtocolPipeline />

      {/* ========================================================================= */}
      {/* SECTION 3: CORE SECURITY GUARANTEES */}
      {/* ========================================================================= */}
      <section id="security" className="w-full border-t border-cyan-500/20 py-16 sm:py-20 lg:py-24 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Section Header */}
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyber-cyan font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.12)]">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              <span>// SECURITY ASSURANCES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Engineered for Complete Privacy
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm lg:text-base leading-relaxed">
              Built on mathematical cryptography, zero persistent retention, and blind packet relays.
            </p>
          </div>

          {/* 6-Grid Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="bg-[#090f18]/85 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-500/60 transition-all space-y-3 shadow-[0_0_25px_rgba(0,240,255,0.04)]">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-cyber-green">
                <UserX className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-white">No User Accounts or Tracking</h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Zero sign-ups, no cookies, no advertising telemetry, and no device fingerprinting. Users join with disposable pseudonyms without metadata association.
              </p>
            </div>

            <div className="bg-[#090f18]/85 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-500/60 transition-all space-y-3 shadow-[0_0_25px_rgba(0,240,255,0.04)]">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyber-cyan">
                <Zap className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-white">Hard Redis Ephemeral TTL</h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Rooms automatically expire after 1h, 6h, 24h, or 7d. Once the TTL counter reaches zero, Redis deletes all message lists and metadata permanently.
              </p>
            </div>

            <div className="bg-[#090f18]/85 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-500/60 transition-all space-y-3 shadow-[0_0_25px_rgba(0,240,255,0.04)]">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-cyber-purple">
                <Lock className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-white">Zero Server-Side Plaintext</h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Plaintext messages and room passwords never touch the server. The backend operates completely blind, acting solely as a real-time ciphertext relay.
              </p>
            </div>

            <div className="bg-[#090f18]/85 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-500/60 transition-all space-y-3 shadow-[0_0_25px_rgba(0,240,255,0.04)]">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-cyber-amber">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-white">Bcrypt-Hashed Protection</h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Room entry passwords are never stored in plaintext. Server-side verification utilizes bcrypt with cost factor 12 to reject unauthorized join requests.
              </p>
            </div>

            <div className="bg-[#090f18]/85 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-500/60 transition-all space-y-3 shadow-[0_0_25px_rgba(0,240,255,0.04)]">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-cyber-green">
                <Shield className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-white">Dual-Layer DOMPurify</h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Strict input and payload sanitization with DOMPurify on both client and server blocks XSS, script injection, and malicious tag payloads.
              </p>
            </div>

            <div className="bg-[#090f18]/85 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-500/60 transition-all space-y-3 shadow-[0_0_25px_rgba(0,240,255,0.04)]">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyber-cyan">
                <Users className="h-5 w-5" aria-hidden="true" />
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
      <section id="comparison" className="w-full border-t border-cyan-500/20 bg-[#060a12]/80 py-16 sm:py-20 lg:py-24 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Section Header */}
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs text-purple-400 font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.12)]">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              <span>// ARCHITECTURAL BENCHMARK</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              CipherChat vs Traditional Messengers
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm lg:text-base leading-relaxed">
              Comparing privacy assurances, cryptographic trust assumptions, and data lifecycle.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto rounded-2xl border border-cyan-500/30 bg-[#090f18]/85 shadow-[0_0_30px_rgba(0,240,255,0.06)]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-cyan-500/30 bg-[#05080e] text-slate-400 font-bold">
                  <th scope="col" className="py-4 px-4 sm:px-6 uppercase tracking-wider">Feature / Security Parameter</th>
                  <th scope="col" className="py-4 px-4 sm:px-6 text-cyber-green uppercase tracking-wider">CipherChat</th>
                  <th scope="col" className="py-4 px-4 sm:px-6 text-slate-500 uppercase tracking-wider">Discord / Slack</th>
                  <th scope="col" className="py-4 px-4 sm:px-6 text-slate-500 uppercase tracking-wider">Telegram (Default)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/15 text-slate-300">
                <tr className="hover:bg-cyan-500/5 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-white">Browser-Derived AES-256 E2EE</td>
                  <td className="py-3.5 px-4 sm:px-6 text-cyber-green font-bold flex items-center gap-1.5">
                    <Check className="h-4 w-4" aria-hidden="true" /> Always Active
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-500 flex items-center gap-1.5">
                    <X className="h-4 w-4 text-destructive" aria-hidden="true" /> None (Plaintext Server)
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-500 flex items-center gap-1.5">
                    <X className="h-4 w-4 text-destructive" aria-hidden="true" /> Server-side MTProto
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
                    <Check className="h-4 w-4" aria-hidden="true" /> Zero (No Accounts/Logs)
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
      {/* SECTION 5: CRYPTOGRAPHIC FAQ ACCORDION */}
      {/* ========================================================================= */}
      <SecurityFaq />

      {/* ========================================================================= */}
      {/* FOOTER */}
      {/* ========================================================================= */}
      <footer className="w-full border-t border-cyan-500/20 bg-[#030509]/90 backdrop-blur-md py-12 text-slate-400 font-mono text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Logo & Statement */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/25 to-emerald-500/15 border border-cyan-400/50 flex items-center justify-center">
                <Shield className="h-4 w-4 text-cyber-green" aria-hidden="true" />
              </div>
              <div>
                <div className="font-bold text-white text-sm">
                  <span className="text-cyber-green">&gt;_</span> CIPHER<span className="text-cyber-cyan">CHAT</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  EPHEMERAL ZERO-KNOWLEDGE CHAT
                </div>
              </div>
            </div>

            {/* Quick Spec Tags */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 tabular-nums">
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-green" aria-hidden="true" />
                AES-256-GCM
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-cyan" aria-hidden="true" />
                PBKDF2-SHA256
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" aria-hidden="true" />
                Redis 7 RAM
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-amber" aria-hidden="true" />
                Zero Disk Persistence
              </span>
            </div>

            {/* Back to Top / Action */}
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-cyber-cyan hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none rounded px-1.5 py-0.5"
              aria-label="Back to Top"
            >
              <span>[BACK TO TOP]</span>
            </button>
          </div>

          <div className="border-t border-cyan-500/15 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500">
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
