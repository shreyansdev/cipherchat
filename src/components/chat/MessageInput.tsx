import React, { useState, useEffect, useRef } from 'react';
import { Send, Lock, Smile, Paperclip, X } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import Button from '../ui/Button';

interface MessageInputProps {
  onSendMessage: (text: string, file?: File) => void;
  onTyping?: (isTyping: boolean) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onTyping }) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() || selectedFile) {
      onSendMessage(text.trim(), selectedFile || undefined);
      setText('');
      setSelectedFile(null);
      
      // Stop typing indicator when message is sent
      if (onTyping) {
        onTyping(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    
    // Send typing indicator
    if (onTyping && e.target.value.length > 0) {
      onTyping(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = window.setTimeout(() => {
        onTyping(false);
      }, 2000);
    } else if (onTyping && e.target.value.length === 0) {
      onTyping(false);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setText(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && event.target instanceof Node && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="p-3 sm:p-4 border-t border-cyan-500/20 bg-[#0d1420]/90 backdrop-blur-xl relative z-10">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
      
      {/* File preview chip */}
      {selectedFile && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-[#080b10]/90 border border-cyan-500/40 rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.15)]">
          <Paperclip className="h-4 w-4 text-cyber-cyan" />
          <span className="text-xs font-mono text-slate-200 flex-1 truncate font-semibold">
            {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </span>
          <button
            onClick={removeFile}
            className="p-1 text-slate-400 hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400/70 pointer-events-none" />
          <input
            type="text"
            value={text}
            onChange={handleChange}
            placeholder="[ENCRYPTED MESSAGE]"
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#080b10]/80 border border-cyan-500/30 text-slate-100 placeholder:text-muted-foreground/40 font-mono text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-all"
          />
        </div>

        {/* Emoji Picker Button */}
        <div className="relative" ref={emojiPickerRef}>
          <Button
            type="button"
            size="icon"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="h-11 w-11 rounded-xl border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 text-slate-300 hover:text-cyber-cyan bg-[#080b10]/60 transition-all"
            title="Emoji Picker"
          >
            <Smile className="h-5 w-5" />
          </Button>
          
          {showEmojiPicker && (
            <div className="absolute bottom-14 right-0 z-50 shadow-2xl rounded-2xl overflow-hidden border border-cyan-500/40">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme={Theme.DARK}
                searchPlaceHolder="Search emoji..."
                width={320}
                height={400}
              />
            </div>
          )}
        </div>

        {/* File Attachment Button */}
        <Button
          type="button"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="h-11 w-11 rounded-xl border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 text-slate-300 hover:text-cyber-cyan bg-[#080b10]/60 transition-all"
          title="Attach Encrypted File"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />

        {/* Send Button */}
        <Button 
          type="submit" 
          size="icon" 
          disabled={!text.trim() && !selectedFile}
          className="h-11 w-11 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(0,255,101,0.35)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Send Encrypted Message"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
      
      {/* Telemetry info */}
      <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-muted-foreground/60 px-1">
        <span className="text-emerald-400/70 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          AES-256-GCM Secure Pipeline
        </span>
        <span>{text.length}/1000 chars</span>
      </div>
    </div>
  );
};

export default MessageInput;
