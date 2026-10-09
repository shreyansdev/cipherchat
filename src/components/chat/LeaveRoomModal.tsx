import React from 'react';
import Dialog from '../ui/Dialog';
import Button from '../ui/Button';
import { LogOut, AlertTriangle, ShieldAlert } from 'lucide-react';

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
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-destructive" aria-hidden="true" />
          <div className="space-y-1.5">
            <p className="font-bold uppercase tracking-wider text-sm">Session Termination</p>
            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              Leaving <span className="text-cyber-cyan font-bold font-mono">#{roomName}</span> will terminate your active session. All local cryptographic keys and ephemeral chat history will be immediately purged from browser memory.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-cyan-500/20">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="text-xs rounded-xl bg-[#080d16] hover:bg-[#080d16]/80 text-slate-300 border border-cyan-500/30 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          >
            [CANCEL]
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            className="text-xs flex items-center gap-1.5 rounded-xl border border-destructive/50 bg-destructive/80 hover:bg-destructive text-white font-bold focus-visible:ring-2 focus-visible:ring-destructive focus-visible:outline-none shadow-[0_0_20px_rgba(255,51,102,0.25)]"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            [PURGE & LEAVE]
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default LeaveRoomModal;
