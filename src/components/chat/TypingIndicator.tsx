import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TypingUser } from '../../types';

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing`;
    } else {
      return `${typingUsers.length} users are typing`;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="px-4 py-2 flex items-center gap-2"
      >
        <div className="flex items-center gap-1.5 px-3 py-2 bg-card/50 border border-primary/20 rounded-lg">
          <span className="text-xs font-mono text-cyber-green/80">
            {getTypingText()}
          </span>
          <div className="flex gap-1">
            <motion.div
              className="w-1.5 h-1.5 bg-cyber-green rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-1.5 h-1.5 bg-cyber-green rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-1.5 h-1.5 bg-cyber-green rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TypingIndicator;
