import React from 'react';
import { motion } from 'framer-motion';
import { Message, User } from '../../types';
import { Terminal, Check, CheckCheck, Lock, FileText, Download } from 'lucide-react';
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
      'text-emerald-400',
      'text-cyan-400',
      'text-purple-400',
      'text-amber-400',
      'text-pink-400',
      'text-blue-400',
    ];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="flex justify-center my-2"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#080b10]/80 border border-cyan-500/25 rounded-full text-xs font-mono text-slate-300 shadow-[0_0_15px_rgba(0,240,255,0.08)]">
          <Terminal className="h-3.5 w-3.5 text-cyber-cyan animate-pulse" />
          <span className="text-slate-300">{message.text}</span>
          <span className="text-[10px] text-muted-foreground font-mono">[{formatTime(message.timestamp)}]</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: isCurrentUser ? 15 : -15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} my-1`}
    >
      <div className={`max-w-[85%] sm:max-w-[75%] ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {!isCurrentUser && (
          <div className="flex items-center gap-1.5 px-1">
            <span className={`text-xs font-mono font-bold ${getUserColor(message.user.id)}`}>
              {message.user.name}
            </span>
            <span className="text-[9px] text-slate-500 font-mono">PEER</span>
          </div>
        )}
        <div
          className={`px-4 py-3 rounded-2xl font-mono text-sm relative transition-all ${
            isCurrentUser
              ? 'bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 border border-emerald-500/40 text-slate-100 shadow-[0_0_20px_rgba(0,255,101,0.1)] rounded-br-sm'
              : 'bg-[#0d1420]/85 border border-cyan-500/20 text-slate-200 shadow-[0_0_20px_rgba(0,240,255,0.05)] rounded-bl-sm'
          }`}
        >
          {/* Media content */}
          {message.mediaUrl && message.mediaType === 'image' && isSafeUrl(message.mediaUrl) && (
            <div className="mb-2.5 overflow-hidden rounded-xl border border-cyan-500/30">
              <img
                src={message.mediaUrl}
                alt={message.fileName || 'Shared image'}
                className="max-w-full rounded-xl cursor-pointer hover:scale-105 transition-transform duration-300"
                style={{ maxHeight: '280px' }}
                onClick={() => window.open(message.mediaUrl, '_blank', 'noopener,noreferrer')}
              />
            </div>
          )}
          {message.mediaUrl && message.mediaType === 'file' && isSafeUrl(message.mediaUrl) && (
            <div className="mb-2.5 flex items-center gap-2.5 p-3 bg-[#080b10]/70 rounded-xl border border-cyan-500/30 group hover:border-cyan-400 transition-colors">
              <FileText className="h-4 w-4 text-cyber-cyan flex-shrink-0" />
              <a
                href={message.mediaUrl}
                download={message.fileName}
                rel="noopener noreferrer"
                className="text-xs text-cyber-cyan hover:underline flex-1 truncate font-semibold"
              >
                {message.fileName} ({message.fileSize ? (message.fileSize / 1024).toFixed(1) : '?'} KB)
              </a>
              <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-white transition-colors" />
            </div>
          )}
          
          {message.text && (
            <div 
              className="break-words leading-relaxed"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.text, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'], ALLOWED_ATTR: [] }) }}
            />
          )}
          
          {/* Time & Delivery Status */}
          <div className={`text-[10px] mt-1.5 flex items-center gap-1.5 ${isCurrentUser ? 'text-emerald-400/80 justify-end' : 'text-slate-400'}`}>
            <span>{formatTime(message.timestamp)}</span>
            {isCurrentUser && message.status && (
              <span className="flex items-center">
                {message.status === 'delivered' && <Check className="h-3 w-3 text-emerald-400" />}
                {message.status === 'seen' && <CheckCheck className="h-3 w-3 text-cyber-cyan" />}
              </span>
            )}
          </div>
          
          {/* Encrypted Lock Dot */}
          {isCurrentUser && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyber-green rounded-full shadow-[0_0_8px_rgba(0,255,101,0.8)]"></div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
