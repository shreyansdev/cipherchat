import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, User, TypingUser } from '../../types';
import { Shield } from 'lucide-react';
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
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/50">
      {messages.length === 0 && (
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-3">
            <Shield className="h-12 w-12 text-cyber-green/30 mx-auto animate-pulse" />
            <div className="font-mono text-sm text-muted-foreground">
              <div className="text-cyber-terminal">[SECURE CHANNEL ESTABLISHED]</div>
              <div className="text-xs mt-2">Waiting for encrypted messages...</div>
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
