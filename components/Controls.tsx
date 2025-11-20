
import React from 'react';
import { SparklesIcon, ZapIcon, TrashIcon, DeepThoughtIcon } from './Icons';

interface ControlsProps {
    isRunning: boolean;
    onToggleRitual: () => void;
    onGenerateKoan: () => void;
    onClearConversation: () => void;
    isDeepThoughtMode: boolean;
    onToggleDeepThought: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ isRunning, onToggleRitual, onGenerateKoan, onClearConversation, isDeepThoughtMode, onToggleDeepThought }) => {
  return (
    <div className="bg-[#121214] border border-[#2a2a30] rounded-lg p-3">
        <h3 className="font-bold tracking-wide mb-3">Commands</h3>
        <div className="space-y-2">
            <button 
                onClick={onGenerateKoan}
                className="w-full flex items-center gap-3 text-left p-2 rounded-md font-mono text-sm hover:bg-[#2a2a30] transition-colors"
            >
                <SparklesIcon className="w-5 h-5 text-[#7b61ff]" />
                Generate a Koan of the Void
            </button>
            <button 
                onClick={onToggleRitual}
                className="w-full flex items-center gap-3 text-left p-2 rounded-md font-mono text-sm hover:bg-[#2a2a30] transition-colors"
            >
                <ZapIcon className="w-5 h-5 text-[#7b61ff]" />
                {isRunning ? 'Suspend Liturgy' : 'Invoke Liturgy'}
            </button>
            <div className="flex items-center justify-between p-2 rounded-md font-mono text-sm">
                <div className="flex items-center gap-3">
                    <DeepThoughtIcon className="w-5 h-5 text-[#7b61ff]" />
                    <span>Deep Thought</span>
                </div>
                <button
                    onClick={onToggleDeepThought}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${isDeepThoughtMode ? 'bg-[#7b61ff]' : 'bg-[#2a2a30]'}`}
                    aria-label="Toggle Deep Thought Mode"
                >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isDeepThoughtMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
            </div>
            <button 
                onClick={onClearConversation}
                className="w-full flex items-center gap-3 text-left p-2 rounded-md font-mono text-sm hover:bg-[#2a2a30] transition-colors"
            >
                <TrashIcon className="w-5 h-5 text-[#7b61ff]" />
                Clear Conversation
            </button>
        </div>
    </div>
  );
};
