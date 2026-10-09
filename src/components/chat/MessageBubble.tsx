import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Message, User } from '../../types';
import { Terminal, Check, CheckCheck, Lock, FileText, Download, Loader2, Shield } from 'lucide-react';
import DOMPurify from 'dompurify';
import { isSafeInternalMediaUrl } from '../../lib/utils';
import { ChatContext } from '../../contexts/ChatContext';
import { decryptFileBuffer } from '../../lib/crypto';

interface MessageBubbleProps {
  message: Message;
  currentUser: User | null;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, currentUser }) => {
  const isSystem = message.type === 'system';
  const isCurrentUser = message.user.id === currentUser?.id;
  const chat = React.useContext(ChatContext);
  const encryptionKey = chat?.encryptionKey || null;
  const roomPassword = chat?.roomPassword || '';

  const [decryptedMediaUrl, setDecryptedMediaUrl] = useState<string | null>(null);
  const [isDecryptingMedia, setIsDecryptingMedia] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    if (message.mediaUrl && message.mediaType === 'image' && isSafeInternalMediaUrl(message.mediaUrl)) {
      const loadAndDecrypt = async () => {
        try {
          setIsDecryptingMedia(true);
          const headers: Record<string, string> = {};
          if (roomPassword) {
            headers['x-room-password'] = roomPassword;
          }

          const res = await fetch(message.mediaUrl!, { headers });
          if (!res.ok) throw new Error('Failed to fetch image');
          const buffer = await res.arrayBuffer();

          let decryptedBuffer: ArrayBuffer;
          if (encryptionKey) {
            try {
              decryptedBuffer = await decryptFileBuffer(buffer, encryptionKey);
            } catch {
              decryptedBuffer = buffer; // Fallback for unencrypted legacy media
            }
          } else {
            decryptedBuffer = buffer;
          }

          if (active) {
            objectUrl = URL.createObjectURL(new Blob([decryptedBuffer]));
            setDecryptedMediaUrl(objectUrl);
          }
        } catch (err) {
          console.error('Failed to decrypt image:', err);
        } finally {
          if (active) setIsDecryptingMedia(false);
        }
      };

      loadAndDecrypt();
    }

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [message.mediaUrl, message.mediaType, encryptionKey, roomPassword]);

  const handleDownloadFile = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!message.mediaUrl || !isSafeInternalMediaUrl(message.mediaUrl) || isDownloading) return;

    try {
      setIsDownloading(true);
      const headers: Record<string, string> = {};
      if (roomPassword) {
        headers['x-room-password'] = roomPassword;
      }

      const res = await fetch(message.mediaUrl, { headers });
      if (!res.ok) throw new Error('Failed to fetch file');
      const buffer = await res.arrayBuffer();

      let decryptedBuffer: ArrayBuffer;
      if (encryptionKey) {
        try {
          decryptedBuffer = await decryptFileBuffer(buffer, encryptionKey);
        } catch {
          decryptedBuffer = buffer;
        }
      } else {
        decryptedBuffer = buffer;
      }

      const blob = new Blob([decryptedBuffer]);
      const blobUrl = URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.download = message.fileName || 'file';
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('File download error:', err);
      alert('Failed to download file.');
    } finally {
      setIsDownloading(false);
    }
  };

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
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="flex justify-center my-2.5 px-2"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#080d16]/90 border border-cyan-500/25 rounded-full text-xs font-mono text-slate-300 shadow-[0_0_20px_rgba(0,240,255,0.06)]">
          <Terminal className="h-3.5 w-3.5 text-cyber-cyan animate-pulse" aria-hidden="true" />
          <span className="text-slate-200">{message.text}</span>
          <span className="text-[10px] text-slate-500 font-mono tabular-nums">[{formatTime(message.timestamp)}]</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: isCurrentUser ? 12 : -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} my-1.5`}
    >
      <div className={`max-w-[88%] sm:max-w-[75%] ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {!isCurrentUser && (
          <div className="flex items-center gap-1.5 px-1.5">
            <span className={`text-xs font-mono font-bold ${getUserColor(message.user.id)}`}>
              {message.user.name}
            </span>
            <span className="text-[9px] text-slate-500 font-mono tracking-wider">[PEER]</span>
          </div>
        )}

        <div
          className={`px-4 py-3 rounded-2xl font-mono text-sm relative transition-all shadow-sm ${
            isCurrentUser
              ? 'bg-gradient-to-br from-emerald-500/20 via-[#0c1522] to-[#080d16] border border-emerald-500/40 text-slate-100 shadow-[0_0_20px_rgba(0,255,101,0.1)] rounded-br-sm'
              : 'bg-[#090f18]/90 border border-cyan-500/25 text-slate-100 shadow-[0_0_20px_rgba(0,240,255,0.05)] rounded-bl-sm'
          }`}
        >
          {/* Media content */}
          {message.mediaUrl && message.mediaType === 'image' && isSafeInternalMediaUrl(message.mediaUrl) && (
            <div className="mb-2.5 overflow-hidden rounded-xl border border-cyan-500/30 bg-[#03060c]">
              {decryptedMediaUrl ? (
                <img
                  src={decryptedMediaUrl}
                  alt={message.fileName || 'Shared image'}
                  className="max-w-full rounded-xl cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                  style={{ maxHeight: '280px' }}
                  onClick={() => window.open(decryptedMediaUrl, '_blank', 'noopener,noreferrer')}
                />
              ) : isDecryptingMedia ? (
                <div className="p-4 text-xs font-mono text-cyan-400 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-cyber-cyan" aria-hidden="true" />
                  <span>[DECRYPTING MEDIA…]</span>
                </div>
              ) : (
                <div className="p-3 text-xs font-mono text-destructive flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>[ENCRYPTED MEDIA UNAVAILABLE]</span>
                </div>
              )}
            </div>
          )}

          {message.mediaUrl && message.mediaType === 'file' && isSafeInternalMediaUrl(message.mediaUrl) && (
            <div className="mb-2.5 flex items-center gap-2.5 p-3 bg-[#040810]/80 rounded-xl border border-cyan-500/30 group hover:border-cyan-400 transition-colors">
              <FileText className="h-4 w-4 text-cyber-cyan flex-shrink-0" aria-hidden="true" />
              <button
                type="button"
                onClick={handleDownloadFile}
                disabled={isDownloading}
                className="text-xs text-cyber-cyan hover:underline flex-1 truncate font-semibold text-left focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none rounded"
              >
                {message.fileName} ({message.fileSize ? (message.fileSize / 1024).toFixed(1) : '?'} KB)
              </button>
              <button
                type="button"
                onClick={handleDownloadFile}
                disabled={isDownloading}
                className="p-1 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none rounded"
                title="Download Decrypted File"
                aria-label="Download Decrypted File"
              >
                {isDownloading ? (
                  <Loader2 className="h-3.5 w-3.5 text-cyber-cyan animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-white transition-colors" aria-hidden="true" />
                )}
              </button>
            </div>
          )}
          
          {message.text && (
            <div 
              className="break-words leading-relaxed"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.text, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'], ALLOWED_ATTR: [] }) }}
            />
          )}
          
          {/* Time & Delivery Status */}
          <div className={`text-[10px] mt-1.5 flex items-center gap-1.5 tabular-nums ${isCurrentUser ? 'text-emerald-400/80 justify-end' : 'text-slate-400'}`}>
            <span>{formatTime(message.timestamp)}</span>
            {isCurrentUser && message.status && (
              <span className="flex items-center">
                {message.status === 'delivered' && <Check className="h-3 w-3 text-emerald-400" aria-hidden="true" />}
                {message.status === 'seen' && <CheckCheck className="h-3 w-3 text-cyber-cyan" aria-hidden="true" />}
              </span>
            )}
          </div>
          
          {/* Encrypted Lock Dot Pip */}
          {isCurrentUser && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyber-green rounded-full shadow-[0_0_8px_rgba(0,255,101,0.8)]" aria-hidden="true" />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
