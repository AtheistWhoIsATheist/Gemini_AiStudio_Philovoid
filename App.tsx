
import React, { useState, useCallback } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { Header } from './components/Header';
import { KnowledgePanel } from './components/KnowledgePanel';
import { Controls } from './components/Controls';
import { useRitualMotor } from './hooks/useRitualMotor';
import { useChat } from './hooks/useChat';
import { NIHILTHEISM_KOANS } from './constants';
import { KnowledgeFile } from './types';

const App: React.FC = () => {
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [isDeepThoughtMode, setIsDeepThoughtMode] = useState(false);
  const { messages, isLoading, sendMessage, addSystemMessage, clearMessages } = useChat();
  const { isRunning, currentStage, startRitual, stopRitual } = useRitualMotor();

  const handleSendMessage = (message: string) => {
    sendMessage(message, knowledgeFiles, isDeepThoughtMode);
  };
  
  const handleGenerateKoan = useCallback(() => {
    const koan = NIHILTHEISM_KOANS[Math.floor(Math.random() * NIHILTHEISM_KOANS.length)];
    addSystemMessage(`A Koan from the Void: "${koan}"`);
  }, [addSystemMessage]);

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0C] text-[#c8c8d0] font-serif">
      {isRunning && currentStage && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl bg-[#121214] border border-[#2a2a30] text-center p-2 z-50 shadow-lg shadow-[#7b61ff]/10">
              <p className="font-mono text-sm text-[#7b61ff]">{currentStage.name}</p>
              <p className="text-sm italic">{currentStage.desc}</p>
          </div>
      )}
      <Header />
      <div className="flex-grow grid md:grid-cols-3 gap-4 p-4 overflow-hidden">
        <div className="md:col-span-2 flex flex-col h-full overflow-hidden">
          <ChatWindow 
            messages={messages} 
            isLoading={isLoading} 
            onSendMessage={handleSendMessage} 
            isDeepThoughtMode={isDeepThoughtMode}
          />
        </div>
        <div className="hidden md:flex flex-col gap-4 h-full overflow-hidden">
          <Controls 
            isRunning={isRunning} 
            onToggleRitual={isRunning ? stopRitual : startRitual} 
            onGenerateKoan={handleGenerateKoan}
            onClearConversation={clearMessages}
            isDeepThoughtMode={isDeepThoughtMode}
            onToggleDeepThought={() => setIsDeepThoughtMode(prev => !prev)}
          />
          <KnowledgePanel 
            files={knowledgeFiles}
            setFiles={setKnowledgeFiles}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
