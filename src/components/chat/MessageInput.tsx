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
    <div className="p-4 border-t border-primary/30 bg-card/50 backdrop-blur-sm relative">
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyber-green/50 to-transparent"></div>
      
      {/* File preview */}
      {selectedFile && (
        <div className="mb-3 flex items-center gap-2 p-2 bg-primary/10 border border-primary/30 rounded-md">
          <Paperclip className="h-4 w-4 text-cyber-green" />
          <span className="text-xs font-mono text-cyber-terminal flex-1 truncate">
            {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </span>
          <button
            onClick={removeFile}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyber-green/50" />
          <input
            type="text"
            value={text}
            onChange={handleChange}
            placeholder="[ENCRYPTED MESSAGE]"
            className="w-full h-11 pl-10 pr-4 rounded-md bg-input/50 border border-primary/30 text-cyber-terminal placeholder:text-muted-foreground/50 font-mono text-sm focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(0,255,65,0.2)] transition-all"
          />
        </div>

        {/* Emoji Picker Button */}
        <div className="relative" ref={emojiPickerRef}>
          <Button
            type="button"
            size="icon"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="h-11 w-11 border border-primary/50 hover:border-primary hover:shadow-[0_0_15px_rgba(0,255,65,0.3)] bg-transparent"
          >
            <Smile className="h-5 w-5" />
          </Button>
          
          {showEmojiPicker && (
            <div className="absolute bottom-14 right-0 z-50">
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
          className="h-11 w-11 border border-primary/50 hover:border-primary hover:shadow-[0_0_15px_rgba(0,255,65,0.3)] bg-transparent"
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

        <Button 
          type="submit" 
          size="icon" 
          disabled={!text.trim() && !selectedFile}
          className="h-11 w-11 border border-primary/50 hover:border-primary hover:shadow-[0_0_15px_rgba(0,255,65,0.3)] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
      
      {/* Character count */}
      <div className="mt-2 text-[10px] font-mono text-muted-foreground/50 text-right">
        {text.length}/1000 chars • E2E encrypted
      </div>
    </div>
  );
};

export default MessageInput;
