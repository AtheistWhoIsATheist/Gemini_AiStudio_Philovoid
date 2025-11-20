import React, { useState } from 'react';
import { KnowledgeFile } from '../types';
import { FileIcon, TagIcon } from './Icons';

interface KnowledgeItemProps {
    file: KnowledgeFile;
    onToggleEnable: (id: string) => void;
    onToggleSelect: (id: string) => void;
    isSelected: boolean;
}

export const KnowledgeItem: React.FC<KnowledgeItemProps> = ({ file, onToggleEnable, onToggleSelect, isSelected }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={`p-1.5 rounded-md text-sm transition-colors ${isSelected ? 'bg-[#7b61ff]/20' : 'hover:bg-[#1a1a1e]'}`}>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(file.id)}
                    className="w-4 h-4 flex-shrink-0 bg-[#1a1a1e] border-[#3a3a40] rounded text-[#7b61ff] focus:ring-[#7b61ff] focus:ring-offset-0 focus:ring-offset-[#121214]"
                    aria-label={`Select ${file.name}`}
                />

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleEnable(file.id);
                    }}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors flex-shrink-0 ${file.enabled ? 'bg-[#7b61ff]' : 'bg-[#3a3a40]'}`}
                    aria-label={`Toggle ${file.name} for context`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${file.enabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </button>
                
                <div className="flex items-center gap-2 flex-grow truncate cursor-pointer" onClick={() => setIsExpanded(p => !p)}>
                    <FileIcon className={`w-4 h-4 flex-shrink-0 ${file.enabled ? 'text-gray-300' : 'text-gray-600'}`} />
                    <span className={`truncate font-mono text-xs ${file.enabled ? 'text-gray-300' : 'text-gray-600 line-through'}`}>
                        {file.name}
                    </span>
                </div>
            </div>
            {isExpanded && file.tags.length > 0 && (
                <div className="pl-14 pt-2 flex flex-wrap gap-1.5">
                    {file.tags.map(tag => (
                        <div key={tag} className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 bg-[#121214] border border-[#2a2a30] text-gray-400 rounded-full">
                           <TagIcon className="w-3 h-3"/>
                           {tag}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};