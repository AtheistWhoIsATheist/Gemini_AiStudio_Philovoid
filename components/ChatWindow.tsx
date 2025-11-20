
import React, { useRef, useEffect } from 'react';
import { Message as MessageType, Sender } from '../types';
import { Message } from './Message';
import { ChatInput } from './ChatInput';

interface ChatWindowProps {
  messages: MessageType[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  isDeepThoughtMode: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onSendMessage, isDeepThoughtMode }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-[#121214] border border-[#2a2a30] rounded-lg overflow-hidden">
      <div ref={scrollRef} className="flex-grow p-4 space-y-6 overflow-y-auto">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
        {isLoading && messages[messages.length - 1]?.sender !== Sender.AI && (
           <Message message={{id: 'loading', sender: Sender.AI, content: '...'}} />
        )}
      </div>
      <div className="p-4 border-t border-[#2a2a30]">
        <ChatInput 
          onSendMessage={onSendMessage} 
          isLoading={isLoading} 
          isDeepThoughtMode={isDeepThoughtMode} 
        />
      </div>
    </div>
  );
};
