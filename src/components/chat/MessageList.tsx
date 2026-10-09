import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, User, TypingUser } from '../../types';
import { Shield, Sparkles, Lock, Terminal, KeyRound } from 'lucide-react';
import TypingIndicator from './TypingIndicator';
import MessageBubble from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  currentUser: User | null;
  typingUsers: TypingUser[];
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUser, typingUsers }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-transparent relative font-mono">
      {messages.length === 0 && (
        <div className="h-full flex items-center justify-center min-h-[340px]">
          <div className="text-center space-y-4 max-w-md p-6 sm:p-8 rounded-2xl bg-[#080d16]/80 backdrop-blur-md border border-cyan-500/25 shadow-[0_0_40px_rgba(0,240,255,0.06)] relative overflow-hidden">
            {/* Corner accent lines */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400/50 rounded-tl-lg pointer-events-none" aria-hidden="true" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400/50 rounded-br-lg pointer-events-none" aria-hidden="true" />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(0,255,101,0.25)]">
              <Shield className="h-8 w-8 text-cyber-green animate-pulse" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <div className="text-white font-bold tracking-wider text-base">[SECURE CHANNEL ESTABLISHED]</div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                Client-side Web Crypto AES-256-GCM encryption is active. Messages are decrypted only in verified browser sessions.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-mono text-cyber-cyan">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              <span>Ready for end-to-end encrypted exchange</span>
            </div>
          </div>
        </div>
      )}
      
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} currentUser={currentUser} />
        ))}
      </AnimatePresence>
      <TypingIndicator typingUsers={typingUsers.filter(u => u.userId !== currentUser?.id)} />
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
