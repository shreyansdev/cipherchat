import React, { useState, useEffect } from 'react';
import Dialog from '../ui/Dialog';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Label from '../ui/Label';

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
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          &gt; Authentication needed for this encrypted channel.
        </p>
        <div className="space-y-2">
          <Label htmlFor="room-password" className="text-[10px] text-cyber-purple uppercase">Encryption Key</Label>
          <Input
            id="room-password"
            type="password"
            value={password}
            onChange={handleChange}
            placeholder="••••••••"
            className="bg-input/50 border-primary/30 focus:border-primary text-cyber-terminal"
            autoFocus
          />
        </div>
        {localError && (
          <p className="text-[10px] text-destructive uppercase animate-pulse">
            [ERROR] {rateLimitSeconds > 0 && localError.includes('Too many attempts')
              ? `Too many attempts. Please wait ${rateLimitSeconds} seconds.`
              : localError}
          </p>
        )}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="text-xs">
            [CANCEL]
          </Button>
          <Button type="submit" disabled={isLoading || !password} className="text-xs">
            {isLoading ? '[VERIFYING...]' : '[DECRYPT & JOIN]'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

export default PasswordModal;
