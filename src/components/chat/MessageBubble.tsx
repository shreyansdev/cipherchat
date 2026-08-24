import React from 'react';
import { motion } from 'framer-motion';
import { Message, User } from '../../types';
import { Terminal, Check, CheckCheck } from 'lucide-react';
import DOMPurify from 'dompurify';
import { isSafeUrl } from '../../lib/utils';

interface MessageBubbleProps {
  message: Message;
  currentUser: User | null;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, currentUser }) => {
  const isSystem = message.type === 'system';
  const isCurrentUser = message.user.id === currentUser?.id;

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserColor = (userId: string) => {
    const colors = [
      'text-cyber-green',
      'text-cyber-cyan',
      'text-cyber-purple',
      'text-yellow-400',
      'text-pink-400',
      'text-blue-400',
    ];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="flex justify-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-card/50 border border-border/50 rounded-full text-xs font-mono text-muted-foreground">
          <Terminal className="h-3 w-3 text-cyber-cyan" />
          <span>{message.text}</span>
          <span className="text-[10px] opacity-50">{formatTime(message.timestamp)}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: isCurrentUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[75%] ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {!isCurrentUser && (
          <div className={`text-xs font-mono font-bold ${getUserColor(message.user.id)}`}>
            {message.user.name}
          </div>
        )}
        <div
          className={`px-4 py-2.5 rounded-lg font-mono text-sm relative ${
            isCurrentUser
              ? 'bg-primary/20 border border-primary/40 text-cyber-terminal shadow-[0_0_10px_rgba(0,255,65,0.1)]'
              : 'bg-card/80 border border-border/50 text-cyber-terminal/90'
          }`}
        >
          {/* Media content — URLs are validated to block javascript: / data: schemes */}
          {message.mediaUrl && message.mediaType === 'image' && isSafeUrl(message.mediaUrl) && (
            <div className="mb-2">
              <img
                src={message.mediaUrl}
                alt={message.fileName || 'Shared image'}
                className="max-w-full rounded border border-primary/30 cursor-pointer hover:opacity-90 transition-opacity"
                style={{ maxHeight: '300px' }}
                onClick={() => window.open(message.mediaUrl, '_blank')}
              />
            </div>
          )}
          {message.mediaUrl && message.mediaType === 'file' && isSafeUrl(message.mediaUrl) && (
            <div className="mb-2 flex items-center gap-2 p-2 bg-background/50 rounded border border-primary/20">
              <Terminal className="h-4 w-4 text-cyber-green" />
              <a
                href={message.mediaUrl}
                download={message.fileName}
                className="text-xs text-cyber-green hover:underline flex-1 truncate"
              >
                {message.fileName} ({message.fileSize ? (message.fileSize / 1024).toFixed(1) : '?'} KB)
              </a>
            </div>
          )}
          
          {message.text && (
            <div 
              className="break-words"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.text, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'], ALLOWED_ATTR: [] }) }}
            />
          )}
          
          <div className={`text-[10px] mt-1 flex items-center gap-1 ${isCurrentUser ? 'text-cyber-green/60' : 'text-muted-foreground/60'}`}>
            <span>{formatTime(message.timestamp)}</span>
            {isCurrentUser && message.status && (
              <span className="flex items-center">
                {message.status === 'delivered' && <Check className="h-3 w-3" />}
                {message.status === 'seen' && <CheckCheck className="h-3 w-3 text-cyber-cyan" />}
              </span>
            )}
          </div>
          
          {/* Encrypted indicator */}
          {isCurrentUser && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyber-green rounded-full animate-pulse"></div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
