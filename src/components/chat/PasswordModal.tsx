import React, { useState, useEffect } from 'react';
import Dialog from '../ui/Dialog';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Label from '../ui/Label';
import { Lock, RefreshCw, KeyRound, Eye, EyeOff } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  isLoading: boolean;
  error?: string | null;
  rateLimitSeconds?: number;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSubmit, isLoading, error, rateLimitSeconds = 0 }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (error) setLocalError(error);
  }, [error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      onSubmit(password);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (localError) setLocalError(null);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="[PASSWORD REQUIRED]">
      <form onSubmit={handleSubmit} className="space-y-4 font-mono">
        <div className="flex items-center gap-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-300 text-xs">
          <KeyRound className="h-4 w-4 text-purple-400 flex-shrink-0" />
          <span>This ephemeral channel is password protected with AES-256 encryption.</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="room-password" className="text-xs text-cyber-purple uppercase tracking-wider">
            &gt; Encryption Key
          </Label>
          <div className="relative">
            <Input
              id="room-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handleChange}
              placeholder="••••••••"
              className="bg-[#080b10]/80 border-purple-500/30 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-white pr-10 rounded-xl"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors p-1"
              title={showPassword ? 'Hide password' : 'Show password'}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {localError && (
          <p className="text-xs text-destructive uppercase animate-pulse p-2.5 bg-destructive/10 border border-destructive/30 rounded-xl">
            [ERROR] {rateLimitSeconds > 0 && localError.includes('Too many attempts')
              ? `Too many attempts. Please wait ${rateLimitSeconds} seconds.`
              : localError}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-cyan-500/20">
          <Button type="button" variant="secondary" onClick={onClose} className="text-xs rounded-xl bg-[#080b10] hover:bg-[#080b10]/80 text-slate-300 border border-cyan-500/30">
            [CANCEL]
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !password} 
            className="text-xs rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/50 hover:border-purple-400 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all font-bold"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                [VERIFYING...]
              </span>
            ) : (
              '[DECRYPT & JOIN]'
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

export default PasswordModal;
