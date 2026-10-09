import React, { useState } from 'react';
import { ArrowLeft, Menu, Shield, Lock, Eye, LogOut, Copy, Check, Users } from 'lucide-react';
import Button from '../ui/Button';

interface HeaderProps {
  roomName: string;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onLeaveRoom?: () => void;
  peerCount?: number;
}

const Header: React.FC<HeaderProps> = ({ 
  roomName, 
  onToggleSidebar, 
  isSidebarOpen, 
  onLeaveRoom,
  peerCount
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-16 border-b border-cyan-500/20 bg-[#080d16]/90 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 relative z-20 font-mono">
      {/* Top and Bottom scanning laser accent hairlines */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" aria-hidden="true" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" aria-hidden="true" />

      {/* Left side: Back navigation & Room Details */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onLeaveRoom}
          className="hover:bg-cyan-500/10 hover:text-cyber-green text-slate-300 flex-shrink-0 h-9 w-9 rounded-xl border border-cyan-500/20 hover:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          title="Back to Home"
          aria-label="Back to Home"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Button>

        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(0,255,101,0.2)]">
            <Shield className="h-4 w-4 text-cyber-green animate-pulse" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-sm sm:text-base font-bold text-white truncate flex items-center gap-1">
                <span className="text-cyber-cyan">#</span>
                <span>{roomName}</span>
              </h1>
              <button
                type="button"
                onClick={handleCopyLink}
                title="Copy Room URL"
                aria-label="Copy Room URL"
                className="p-1 text-slate-400 hover:text-cyber-cyan hover:bg-cyan-500/10 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-cyber-green" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                <span>AES-256-GCM</span>
              </div>
              <span className="text-slate-600" aria-hidden="true">•</span>
              <div className="flex items-center gap-1 text-cyan-400">
                <Eye className="h-2.5 w-2.5" aria-hidden="true" />
                <span>EPHEMERAL RAM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Leave Room & Peer Drawer Toggle */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {onLeaveRoom && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onLeaveRoom}
            className="text-destructive hover:text-white hover:bg-destructive/30 border border-destructive/40 hover:border-destructive/80 text-xs font-mono flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-bold focus-visible:ring-2 focus-visible:ring-destructive focus-visible:outline-none shadow-[0_0_15px_rgba(255,51,102,0.1)]"
            title="Leave Room"
            aria-label="Leave Room"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>[LEAVE]</span>
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className={`h-9 w-9 rounded-xl border transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
            isSidebarOpen 
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-[0_0_15px_rgba(0,240,255,0.2)]' 
              : 'border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-slate-300'
          }`}
          title={isSidebarOpen ? "Close Peers Drawer" : "Open Peers Drawer"}
          aria-label="Toggle Sidebar"
        >
          <Users className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
