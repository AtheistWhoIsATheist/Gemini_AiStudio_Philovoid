
import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './Icons';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isDeepThoughtMode: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, isDeepThoughtMode }) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedValue = value.trim();
    if (trimmedValue && !isLoading) {
      onSendMessage(trimmedValue);
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
            }
        }}
        placeholder={isDeepThoughtMode ? "Engage in deep thought..." : "Converse with the void..."}
        rows={1}
        className={`flex-grow bg-[#1a1a1e] text-[#c8c8d0] font-mono text-sm resize-none border border-[#2a2a30] rounded-lg p-3 focus:outline-none focus:ring-2 focus:border-transparent transition-all max-h-48 ${isDeepThoughtMode ? 'focus:ring-[#a899ff]' : 'focus:ring-[#7b61ff]'}`}
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !value.trim()}
        className="h-12 w-12 flex-shrink-0 bg-[#7b61ff] rounded-lg flex items-center justify-center transition-colors disabled:bg-[#5a48b9] disabled:cursor-not-allowed hover:bg-[#917aff] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#121214] focus:ring-[#7b61ff]"
      >
        <SendIcon className="w-6 h-6 text-white" />
      </button>
    </form>
  );
};
