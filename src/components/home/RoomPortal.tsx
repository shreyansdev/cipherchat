import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  UserX,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Switch from '../ui/Switch';
import PasswordModal from '../chat/PasswordModal';
import { motion, AnimatePresence } from 'framer-motion';
import { createRoom, checkRoomProtection, verifyRoomPassword } from '../../lib/api';
import DOMPurify from 'dompurify';
import { ERROR_MESSAGES, ERROR_CODES } from '../../lib/errors';
import {
  ROOM_NAME_REGEX,
  generateRandomSlug,
  generateRandomAlias,
} from '../../lib/slugs';

export interface RoomPortalProps {
  initialMode?: 'create' | 'join' | 'initial';
  onModeChange?: (mode: 'create' | 'join' | 'initial') => void;
  className?: string;
}

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
    className="p-5 sm:p-8 space-y-5 sm:space-y-6"
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
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] sm:text-[11px] font-mono text-cyber-cyan tracking-wider max-w-full flex-wrap justify-center">
        <Sparkles className="h-3 w-3 animate-spin flex-shrink-0" style={{ animationDuration: '6s' }} aria-hidden="true" />
        <span>ZERO-KNOWLEDGE PROTOCOL v2.4</span>
      </div>
      <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
        <span className="text-cyber-green">&gt;_</span> CIPHER<span className="text-cyber-cyan">CHAT</span>
      </h2>
      <p className="text-slate-400 text-xs sm:text-sm font-mono uppercase tracking-widest">
        [ENCRYPTED] • [EPHEMERAL] • [ANONYMOUS]
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground font-mono pt-1">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] sm:text-[11px] font-semibold">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
          <span>E2EE AES-256-GCM</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] sm:text-[11px] font-semibold">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" aria-hidden="true" />
          <span>ZERO LOGS</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] sm:text-[11px] font-semibold">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" aria-hidden="true" />
          <span>AUTO-PURGE RAM</span>
        </div>
      </div>
    </div>

    {/* Primary Architecture Highlights */}
    <div className="grid grid-cols-2 gap-2 sm:gap-2.5 pt-1 font-mono text-[10px] sm:text-[11px]">
      <div className="bg-[#080b10]/70 border border-cyan-500/20 rounded-xl p-2.5 sm:p-3 hover:border-cyan-500/50 hover:bg-[#080b10] transition-all group">
        <div className="text-cyber-green font-bold flex items-center gap-1">
          <span>&gt;</span> CLIENT CRYPTO
        </div>
        <div className="text-slate-400 text-[9px] sm:text-[10px] mt-0.5">PBKDF2 SHA-256 key</div>
      </div>
      <div className="bg-[#080b10]/70 border border-cyan-500/20 rounded-xl p-2.5 sm:p-3 hover:border-cyan-500/50 hover:bg-[#080b10] transition-all group">
        <div className="text-cyber-cyan font-bold flex items-center gap-1">
          <span>&gt;</span> EPHEMERAL TTL
        </div>
        <div className="text-slate-400 text-[9px] sm:text-[10px] mt-0.5">Automated eviction</div>
      </div>
      <div className="bg-[#080b10]/70 border border-cyan-500/20 rounded-xl p-2.5 sm:p-3 hover:border-cyan-500/50 hover:bg-[#080b10] transition-all group">
        <div className="text-purple-400 font-bold flex items-center gap-1">
          <span>&gt;</span> ZERO ACCOUNTS
        </div>
        <div className="text-slate-400 text-[9px] sm:text-[10px] mt-0.5">No login / No cookies</div>
      </div>
      <div className="bg-[#080b10]/70 border border-cyan-500/20 rounded-xl p-2.5 sm:p-3 hover:border-cyan-500/50 hover:bg-[#080b10] transition-all group">
        <div className="text-amber-400 font-bold flex items-center gap-1">
          <span>&gt;</span> REDIS VOLATILE
        </div>
        <div className="text-slate-400 text-[9px] sm:text-[10px] mt-0.5">No disk persistence</div>
      </div>
    </div>

    {/* Action Mode Triggers */}
    <div className="space-y-3 pt-2">
      <Button
        onClick={() => onSetMode('create')}
        className="w-full font-mono uppercase tracking-wider bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-purple-500/20 hover:from-emerald-500/30 hover:via-cyan-500/30 hover:to-purple-500/30 text-white border border-cyan-400/50 hover:border-cyan-300 shadow-[0_0_30px_rgba(0,240,255,0.2)] hover:shadow-[0_0_40px_rgba(0,240,255,0.35)] transition-all h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
      >
        <ShieldCheck className="h-4 w-4 text-cyber-green" aria-hidden="true" />
        <span>[CREATE SECURE ROOM]</span>
      </Button>

      <Button
        onClick={() => onSetMode('join')}
        variant="outline"
        className="w-full font-mono uppercase tracking-wider bg-[#080b10]/80 hover:bg-[#080b10] text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(0,240,255,0.25)] transition-all h-12 rounded-xl text-sm font-bold focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
      >
        <Users className="h-4 w-4 mr-2 text-cyber-cyan" aria-hidden="true" />
        <span>[JOIN EXISTING ROOM]</span>
      </Button>
    </div>

    <div className="text-center font-mono text-[10px] pt-1">
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
    const alias = generateRandomAlias();
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
      setError('[ERROR] Room name cannot be empty.');
      setIsLoading(false);
      return;
    }

    if (!ROOM_NAME_REGEX.test(roomName)) {
      setError('[ERROR] Room name can only contain letters, numbers, hyphens, and underscores.');
      setIsLoading(false);
      return;
    }

    if (mode === 'create' && isProtected && password.length < 8) {
      setError('[ERROR] Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Sanitize nickname and password
    const sanitizedDisplayName = DOMPurify.sanitize(displayName.trim());
    const sanitizedPassword = password.trim();

    try {
      if (mode === 'create') {
        const response = await createRoom(roomName.trim(), isProtected ? sanitizedPassword : undefined, ttl);
        navigate(`/chat/${response.roomName}`, {
          state: {
            displayName: sanitizedDisplayName || 'anonymous',
            password: isProtected ? sanitizedPassword : '',
          },
        });
      } else {
        const isRoomProtectedOnline = await checkRoomProtection(roomName.trim());
        if (isRoomProtectedOnline) {
          setShowPasswordModal(true);
          setIsLoading(false);
        } else {
          navigate(`/chat/${roomName.trim()}`, {
            state: { displayName: sanitizedDisplayName || 'anonymous' },
          });
        }
      }
    } catch (err) {
      setIsLoading(false);
      const errorCode = err instanceof Error ? err.message : '';

      if (errorCode === ERROR_CODES.RATE_LIMITED) {
        setRateLimitSeconds(60);
        setError(`[ERROR] ${ERROR_MESSAGES.RATE_LIMITED(60)}`);
      } else if (errorCode === ERROR_CODES.ROOM_NOT_FOUND) {
        setError(`[ERROR] ${ERROR_MESSAGES.ROOM_NOT_FOUND}`);
      } else {
        setError(`[ERROR] ${err instanceof Error ? err.message : 'An error occurred'}`);
      }
    }
  };

  const handlePasswordSubmit = async (enteredPassword: string) => {
    setPasswordModalError(null);
    const sanitizedDisplayName = DOMPurify.sanitize(displayName.trim());
    try {
      await verifyRoomPassword(roomName.trim(), enteredPassword);
      setShowPasswordModal(false);
      navigate(`/chat/${roomName.trim()}`, {
        state: { displayName: sanitizedDisplayName || 'anonymous', password: enteredPassword },
      });
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
                <span>&gt;</span> Room Identifier
              </Label>
              {mode === 'create' && (
                <button
                  type="button"
                  onClick={handleGenerateSlug}
                  className="font-mono text-[11px] text-cyber-cyan hover:text-white flex items-center gap-1 transition-colors px-1 rounded focus-visible:ring-1 focus-visible:ring-cyan-400 focus-visible:outline-none"
                  title="Generate a new secure random slug"
                >
                  <RefreshCw className={`h-3 w-3 ${isGeneratingSlug ? 'animate-spin' : ''}`} aria-hidden="true" />
                  <span>Reroll Slug</span>
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                id="roomName"
                type="text"
                placeholder={mode === 'create' ? 'e.g. quantum-matrix-4821' : 'Enter existing room slug...'}
                value={roomName}
                onChange={handleInputChange(setRoomName)}
                readOnly={mode === 'create'}
                className={`font-mono border-cyan-500/30 focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-xl ${
                  mode === 'create'
                    ? 'bg-[#080b10]/90 text-emerald-400 font-bold select-all cursor-default pr-9 border-emerald-500/40'
                    : 'bg-[#080b10]/80'
                }`}
                disabled={isLoading}
              />
              {mode === 'create' && (
                <button
                  type="button"
                  onClick={handleGenerateSlug}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400/70 hover:text-emerald-300 transition-colors"
                  aria-label="Regenerate slug"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isGeneratingSlug ? 'animate-spin' : ''}`} aria-hidden="true" />
                </button>
              )}
            </div>
            <p className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              {mode === 'create' ? (
                <>
                  <span className="text-emerald-400">●</span>
                  <span>Cryptographically generated slug (used as AES-256 PBKDF2 salt)</span>
                </>
              ) : (
                'Enter the room slug provided by the creator'
              )}
            </p>
          </div>

          {/* Anonymous Display Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="displayName" className="font-mono text-xs text-cyber-green uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                <span>&gt;</span> Anonymous Alias
              </Label>
              <button
                type="button"
                onClick={handleRandomAlias}
                className="font-mono text-[11px] text-cyber-cyan hover:text-white flex items-center gap-1 transition-colors px-1 rounded focus-visible:ring-1 focus-visible:ring-cyan-400 focus-visible:outline-none"
              >
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                <span>Random Alias</span>
              </button>
            </div>
            <div className="relative">
              <Input
                id="displayName"
                type="text"
                placeholder="Choose ephemeral handle (optional)..."
                value={displayName}
                onChange={handleInputChange(setDisplayName)}
                className="font-mono bg-[#080b10]/80 border-cyan-500/30 focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400 text-white placeholder:text-slate-600 rounded-xl"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Security & TTL Options (Create Mode Only) */}
          {mode === 'create' && (
            <div className="space-y-4 pt-1">
              {/* Password Protection Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-[#080b10]/80 border border-cyan-500/25 rounded-xl">
                <div className="space-y-0.5">
                  <Label htmlFor="protected" className="font-mono text-xs text-slate-200 font-bold flex items-center gap-1.5 cursor-pointer">
                    <Lock className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />
                    <span>Password Protection</span>
                  </Label>
                  <div className="font-mono text-[10px] text-slate-400">
                    Derive extra AES-GCM entropy via custom passphrase
                  </div>
                </div>
                <Switch
                  id="protected"
                  aria-label="Password Protection"
                  checked={isProtected}
                  onCheckedChange={(checked) => {
                    setIsProtected(checked);
                    if (!checked) setPassword('');
                  }}
                  disabled={isLoading}
                />
              </div>

              {/* Password Input & Strength Bar */}
              {isProtected && (
                <div className="space-y-2 p-3.5 bg-[#080b10]/90 border border-purple-500/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="font-mono text-xs text-purple-300 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                      <span>&gt;</span> Encryption Key
                    </Label>
                    <span className="font-mono text-[11px] text-slate-400">
                      Entropy:{' '}
                      <span className={`font-bold ${pwdStrength.score >= 3 ? 'text-cyber-green' : 'text-amber-400'}`}>
                        {pwdStrength.label}
                      </span>
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters..."
                      value={password}
                      onChange={handleInputChange(setPassword)}
                      className="font-mono bg-[#080b10]/90 border-purple-500/40 focus-visible:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-400 text-white pr-10 rounded-xl"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  <div className="space-y-1 pt-1">
                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      <div className={`rounded-full transition-all ${pwdStrength.score >= 1 ? pwdStrength.color : 'bg-slate-800'}`} />
                      <div className={`rounded-full transition-all ${pwdStrength.score >= 2 ? pwdStrength.color : 'bg-slate-800'}`} />
                      <div className={`rounded-full transition-all ${pwdStrength.score >= 3 ? pwdStrength.color : 'bg-slate-800'}`} />
                      <div className={`rounded-full transition-all ${pwdStrength.score >= 4 ? pwdStrength.color : 'bg-slate-800'}`} />
                    </div>
                  </div>
                </div>
              )}

              {/* Ephemeral Lifetime (TTL) Preset Selector */}
              <div className="space-y-2">
                <Label className="font-mono text-xs text-cyber-green uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>&gt;</span> Hard TTL Expiration
                  </span>
                  <span className="text-cyber-amber text-[10px]">AUTO-PURGE FROM RAM</span>
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: '1 HOUR', seconds: 3600 },
                    { label: '6 HOURS', seconds: 21600 },
                    { label: '24 HOURS', seconds: 86400 },
                    { label: '7 DAYS', seconds: 604800 },
                  ].map((option) => (
                    <button
                      key={option.seconds}
                      type="button"
                      onClick={() => setTtl(option.seconds)}
                      className={`font-mono text-[11px] sm:text-xs py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl border transition-all text-center ${
                        ttl === option.seconds
                          ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.25)] font-bold'
                          : 'bg-[#080b10]/60 border-cyan-500/20 text-slate-400 hover:border-cyan-500/50 hover:text-slate-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Validation & Server Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 font-mono text-xs flex items-start gap-2"
              role="alert"
            >
              <span className="font-bold">&gt;_</span>
              <span>{error}</span>
            </motion.div>
          )}

          {/* Rate Limit Active Warning */}
          {rateLimitSeconds > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-400 font-mono text-xs flex items-center justify-between">
              <span>COOLDOWN ENFORCED</span>
              <span className="font-bold">{rateLimitSeconds}s REMAINING</span>
            </div>
          )}

          {/* Form Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || rateLimitSeconds > 0}
            className="w-full font-mono uppercase tracking-wider bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-purple-500/20 hover:from-emerald-500/30 hover:via-cyan-500/30 hover:to-purple-500/30 text-white border border-cyan-400/50 hover:border-cyan-300 shadow-[0_0_25px_rgba(0,240,255,0.2)] hover:shadow-[0_0_35px_rgba(0,240,255,0.3)] transition-all h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-cyber-cyan" aria-hidden="true" />
                <span>{mode === 'create' ? 'GENERATING KEY...' : 'CONNECTING...'}</span>
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 text-cyber-green" aria-hidden="true" />
                <span>{mode === 'create' ? '[INITIALIZE ROOM]' : '[CONNECT NOW]'}</span>
              </>
            )}
          </Button>
        </form>

        <div className="mt-5 p-3.5 bg-[#080b10]/70 border border-cyan-500/20 rounded-xl text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-2 text-cyber-cyan font-bold mb-1">
            <UserX className="h-3 w-3" aria-hidden="true" />
            <span>DISPOSABLE EPHEMERAL ARCHITECTURE</span>
          </div>
          <div>All cryptographic keys exist solely in your browser&apos;s volatile RAM. No records are maintained after departure.</div>
        </div>
      </motion.div>

      {/* Password Modal for Joining Protected Rooms */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordModalError(null);
        }}
        onSubmit={handlePasswordSubmit}
        roomName={roomName}
        error={passwordModalError}
      />
    </>
  );
};

export const RoomPortal: React.FC<RoomPortalProps> = ({
  initialMode = 'initial',
  onModeChange,
  className = '',
}) => {
  const [mode, setMode] = useState<'initial' | 'create' | 'join'>(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleSetMode = (nextMode: 'create' | 'join' | 'initial') => {
    setMode(nextMode);
    onModeChange?.(nextMode);
  };

  return (
    <div
      className={`w-full max-w-lg bg-[#0a101a]/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.15)] relative z-10 overflow-hidden ${className}`}
    >
      {/* Top Cockpit Status Bar */}
      <div className="bg-[#05080e] px-4 py-2.5 border-b border-cyan-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyber-green animate-pulse" aria-hidden="true" />
          <span className="font-mono text-[11px] text-slate-300 font-bold tracking-wider uppercase">
            CIPHER_PORTAL // {mode.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" aria-hidden="true" />
          <span>RAM_VOLATILE</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'initial' ? (
          <InitialView key="initial" onSetMode={(m) => handleSetMode(m)} />
        ) : (
          <FormView
            key={`form-${mode}`}
            mode={mode}
            onBack={() => handleSetMode('initial')}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoomPortal;
