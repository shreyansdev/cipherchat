import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../../types';
import { Users, Circle, LogOut, ShieldCheck, X } from 'lucide-react';
import Button from '../ui/Button';

interface UserListProps {
  users: User[];
  isSidebarOpen: boolean;
  onClose?: () => void;
  onLeaveRoom?: () => void;
}

const UserList: React.FC<UserListProps> = ({ users, isSidebarOpen, onClose, onLeaveRoom }) => {
  const getUserColor = (userId: string) => {
    const colors = [
      'from-emerald-400 to-cyan-500',
      'from-cyan-400 to-blue-500',
      'from-purple-400 to-pink-500',
      'from-amber-400 to-orange-500',
      'from-pink-400 to-rose-500',
      'from-teal-400 to-emerald-500',
    ];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          {/* Backdrop for Mobile Screens */}
          {onClose && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
          )}

          {/* Right-Side Collapsible Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed inset-y-0 right-0 z-50 w-72 sm:w-80 lg:static lg:z-20 border-l border-cyan-500/20 bg-[#0c121d]/95 backdrop-blur-xl flex flex-col h-full shadow-[-10px_0_30px_rgba(0,0,0,0.5)] lg:shadow-none flex-shrink-0"
          >
            {/* Header with Title + Active Count + Close Button */}
            <div className="p-4 border-b border-cyan-500/20 bg-[#080b10]/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-mono">
                <Users className="h-4 w-4 text-cyber-cyan" />
                <span className="font-bold text-xs sm:text-sm uppercase tracking-wider">
                  Active Peers
                </span>
                <span className="text-xs text-cyber-green bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                  {users.length}
                </span>
              </div>
              {onClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 text-slate-400 hover:text-white hover:bg-cyan-500/10 rounded-lg lg:hidden"
                  aria-label="Close Sidebar"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* User List Stream */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <AnimatePresence>
                {users.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[#080b10]/60 border border-cyan-500/15 hover:border-cyan-500/40 hover:bg-[#080b10]/90 transition-all group"
                  >
                    {/* User Avatar Circle */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${getUserColor(user.id)} p-[1px] flex items-center justify-center`}>
                        <div className="w-full h-full rounded-[7px] bg-[#0c121d] flex items-center justify-center text-xs font-mono font-bold text-white uppercase">
                          {user.name.slice(0, 2)}
                        </div>
                      </div>
                      {/* Status Radar Pulse */}
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0c121d]"></div>
                        <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
                      </div>
                    </div>

                    {/* User Name & Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs sm:text-sm font-semibold text-slate-200 truncate group-hover:text-cyber-cyan transition-colors">
                        {user.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                        <span className="text-emerald-400 font-bold">●</span> VERIFIED PEER
                      </div>
                    </div>

                    {/* Anonymous Tag */}
                    <div className="text-[9px] text-cyber-cyan/70 font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                      ANON
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Footer Info & Disconnect Button */}
            <div className="p-4 border-t border-cyan-500/20 bg-[#080b10]/60 space-y-3">
              <div className="text-[10px] font-mono text-muted-foreground space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Circle className="h-1.5 w-1.5 text-cyber-green fill-cyber-green" />
                  <span>Zero Metadata Storage</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Circle className="h-1.5 w-1.5 text-cyber-cyan fill-cyber-cyan" />
                  <span>Auto-Purge on Room Expiry</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <ShieldCheck className="h-2.5 w-2.5 text-cyber-purple" />
                  <span>Web Crypto AES-256 E2EE</span>
                </div>
              </div>

              {onLeaveRoom && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onLeaveRoom}
                  className="w-full text-xs font-mono flex items-center justify-center gap-2 border border-destructive/40 bg-destructive/15 text-destructive hover:bg-destructive/25 hover:border-destructive/60 py-2.5 rounded-xl transition-all font-bold"
                  aria-label="Leave Room"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  [LEAVE CHANNEL]
                </Button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserList;
