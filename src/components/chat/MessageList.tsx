import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, User, TypingUser } from '../../types';
import { Shield, Sparkles, Lock } from 'lucide-react';
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
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#080b10]/95 relative">
      {messages.length === 0 && (
        <div className="h-full flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-4 max-w-sm p-6 rounded-2xl bg-[#0d1420]/60 border border-cyan-500/20 shadow-[0_0_30px_rgba(0,240,255,0.06)]">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(0,255,101,0.2)]">
              <Shield className="h-8 w-8 text-cyber-green animate-pulse" />
            </div>
            <div className="font-mono text-sm space-y-1.5">
              <div className="text-white font-bold tracking-wider">[SECURE CHANNEL ESTABLISHED]</div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                Client-side Web Crypto AES-256-GCM encryption is active. Messages are decrypted only in verified browser sessions.
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono text-cyber-cyan">
              <Sparkles className="h-3 w-3" />
              <span>Ready for encrypted exchange</span>
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
