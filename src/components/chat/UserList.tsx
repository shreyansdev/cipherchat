import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../../types';
import { Users, Circle, LogOut } from 'lucide-react';
import Button from '../ui/Button';

interface UserListProps {
  users: User[];
  isSidebarOpen: boolean;
  onLeaveRoom?: () => void;
}

const UserList: React.FC<UserListProps> = ({ users, isSidebarOpen, onLeaveRoom }) => {
  const getUserColor = (userId: string) => {
    const colors = [
      'bg-cyber-green',
      'bg-cyber-cyan',
      'bg-cyber-purple',
      'bg-yellow-400',
      'bg-pink-400',
      'bg-blue-400',
    ];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-64 border-l border-primary/30 bg-card/50 backdrop-blur-sm flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-2 text-cyber-terminal font-mono">
              <Users className="h-4 w-4 text-cyber-cyan" />
              <span className="font-bold text-sm uppercase tracking-wider">
                Active Users
              </span>
              <span className="ml-auto text-xs text-cyber-green bg-cyber-green/10 px-2 py-0.5 rounded-full border border-cyber-green/30">
                {users.length}
              </span>
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <AnimatePresence>
              {users.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 p-2.5 rounded bg-background/50 border border-border/30 hover:border-primary/50 transition-all group"
                >
                  {/* Status Indicator */}
                  <div className="relative">
                    <div className={`w-2 h-2 rounded-full ${getUserColor(user.id)} animate-pulse`}></div>
                    <div className={`absolute inset-0 w-2 h-2 rounded-full ${getUserColor(user.id)} animate-ping opacity-75`}></div>
                  </div>

                  {/* User Name */}
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-cyber-terminal truncate group-hover:text-cyber-green transition-colors">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      ONLINE
                    </div>
                  </div>

                  {/* Anonymous Badge */}
                  <div className="text-[9px] text-cyber-cyan/60 font-mono uppercase">
                    ANON
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Footer Info */}
          <div className="p-3 border-t border-border/50 bg-background/30 space-y-3">
            <div className="text-[10px] font-mono text-muted-foreground space-y-1">
              <div className="flex items-center gap-1">
                <Circle className="h-2 w-2 text-cyber-green fill-cyber-green" />
                <span>End-to-end encrypted</span>
              </div>
              <div className="flex items-center gap-1">
                <Circle className="h-2 w-2 text-cyber-cyan fill-cyber-cyan" />
                <span>Zero data retention</span>
              </div>
              <div className="flex items-center gap-1">
                <Circle className="h-2 w-2 text-cyber-purple fill-cyber-purple" />
                <span>Complete anonymity</span>
              </div>
            </div>

            {onLeaveRoom && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onLeaveRoom}
                className="w-full text-xs font-mono flex items-center justify-center gap-2 border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:border-destructive/60 py-2 transition-all"
                aria-label="Leave Room"
              >
                <LogOut className="h-3.5 w-3.5" />
                [LEAVE CHANNEL]
              </Button>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default UserList;
