import React, { useState } from 'react';
import { ArrowLeft, Menu, Shield, Lock, Eye, LogOut, Copy, Check } from 'lucide-react';
import Button from '../ui/Button';

interface HeaderProps {
  roomName: string;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onLeaveRoom?: () => void;
}

const Header: React.FC<HeaderProps> = ({ roomName, onToggleSidebar, isSidebarOpen, onLeaveRoom }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-16 border-b border-cyan-500/20 bg-[#0d1420]/85 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 relative z-20">
      {/* Scan line effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
      
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onLeaveRoom}
          className="hover:bg-cyan-500/10 hover:text-cyber-green text-slate-300 flex-shrink-0"
          title="Back to Home"
          aria-label="Back to Home"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <Shield className="h-4 w-4 text-cyber-green animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-base sm:text-lg font-bold text-white truncate">
                <span className="text-cyber-cyan">#</span>{roomName}
              </h1>
              <button
                onClick={handleCopyLink}
                title="Copy Room URL"
                className="p-1 text-slate-400 hover:text-cyber-cyan hover:bg-cyan-500/10 rounded transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-cyber-green" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
              <div className="flex items-center gap-1 text-emerald-400">
                <Lock className="h-2.5 w-2.5" />
                <span>AES-256-GCM</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1 text-cyan-400">
                <Eye className="h-2.5 w-2.5" />
                <span>EPHEMERAL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {onLeaveRoom && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onLeaveRoom}
            className="text-destructive hover:text-destructive hover:bg-destructive/15 border border-destructive/30 hover:border-destructive/60 text-xs font-mono flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
            title="Leave Room"
            aria-label="Leave Room"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">[LEAVE]</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="hover:bg-cyan-500/10 hover:text-cyber-cyan text-slate-300 rounded-lg"
          title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
