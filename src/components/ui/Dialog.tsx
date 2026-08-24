import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Button from './Button';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-md m-4 bg-[#0d1420]/95 backdrop-blur-xl rounded-xl border border-cyan-500/30 shadow-[0_0_40px_rgba(0,240,255,0.15)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 bg-card/40">
              <h2 className="text-base font-bold font-mono text-cyber-terminal">{title}</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-cyan-500/10 hover:text-cyber-cyan">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Dialog;
