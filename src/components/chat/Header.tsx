import React from 'react';
import { ArrowLeft, Menu, Shield, Lock, Eye, LogOut } from 'lucide-react';
import Button from '../ui/Button';

interface HeaderProps {
  roomName: string;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onLeaveRoom?: () => void;
}

const Header: React.FC<HeaderProps> = ({ roomName, onToggleSidebar, isSidebarOpen, onLeaveRoom }) => {
  return (
    <header className="h-16 border-b border-primary/30 bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 relative">
      {/* Scan line effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyber-cyan/50 to-transparent"></div>
      
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onLeaveRoom}
          className="hover:bg-primary/10 hover:text-cyber-green"
          title="Back to Home"
          aria-label="Back to Home"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-cyber-green animate-pulse" />
          <div>
            <h1 className="font-mono text-lg font-bold text-cyber-terminal">
              <span className="text-cyber-cyan">#</span>{roomName}
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
              <div className="flex items-center gap-1">
                <Lock className="h-2.5 w-2.5 text-cyber-green" />
                <span>ENCRYPTED</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Eye className="h-2.5 w-2.5 text-cyber-cyan" />
                <span>EPHEMERAL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onLeaveRoom && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onLeaveRoom}
            className="text-destructive/80 hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/30 text-xs font-mono flex items-center gap-1.5 px-3 py-1.5 rounded transition-all"
            title="Leave Room"
            aria-label="Leave Room"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">[LEAVE]</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="hover:bg-primary/10 hover:text-cyber-cyan"
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
