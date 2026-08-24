import React from 'react';
import Dialog from '../ui/Dialog';
import Button from '../ui/Button';
import { LogOut, AlertTriangle } from 'lucide-react';

interface LeaveRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  roomName: string;
}

const LeaveRoomModal: React.FC<LeaveRoomModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  roomName,
}) => {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="[LEAVE ENCRYPTED CHANNEL]">
      <div className="space-y-4 font-mono text-xs">
        <div className="flex items-start gap-3 p-3 rounded bg-destructive/10 border border-destructive/30 text-destructive">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold uppercase tracking-wider">Session Termination</p>
            <p className="text-muted-foreground leading-relaxed">
              Leaving <span className="text-cyber-cyan font-bold">#{roomName}</span> will terminate your active session. All local cryptographic keys and ephemeral chat history will be immediately purged from browser memory.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="text-xs"
          >
            [CANCEL]
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            className="text-xs flex items-center gap-1.5 border border-destructive/40 bg-destructive/80 hover:bg-destructive text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            [PURGE & LEAVE]
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default LeaveRoomModal;
