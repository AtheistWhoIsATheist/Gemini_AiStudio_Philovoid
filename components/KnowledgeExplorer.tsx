
import React, { useMemo, useState } from 'react';
import { KnowledgeFile } from '../types';
import { FolderIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';
import { KnowledgeItem } from './KnowledgeItem';

interface KnowledgeExplorerProps {
    files: KnowledgeFile[];
    onToggleFileEnable: (id: string) => void;
    onClearKnowledge: () => void;
    selectedFileIds: string[];
    onToggleFileSelect: (id: string) => void;
}

type SortKey = 'name' | 'createdAt' | 'enabled';
type SortDirection = 'asc' | 'desc';

export const KnowledgeExplorer: React.FC<KnowledgeExplorerProps> = ({ 
    files, 
    onToggleFileEnable, 
    onClearKnowledge,
    selectedFileIds,
    onToggleFileSelect,
}) => {
    const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'name', direction: 'asc' });

    const sortedAndGroupedFiles = useMemo(() => {
        const grouped = files.reduce((acc, file) => {
            const folder = file.folder || 'Uncategorized';
            if (!acc[folder]) {
                acc[folder] = [];
            }
            acc[folder].push(file);
            return acc;
        }, {} as Record<string, KnowledgeFile[]>);

        for (const folderName in grouped) {
            grouped[folderName].sort((a, b) => {
                let comparison = 0;
                if (sortConfig.key === 'name') {
                    comparison = a.name.localeCompare(b.name);
                } else if (sortConfig.key === 'createdAt') {
                    comparison = b.createdAt - a.createdAt; // Newest first for default asc
                } else if (sortConfig.key === 'enabled') {
                    comparison = (a.enabled === b.enabled) ? 0 : a.enabled ? -1 : 1;
                }
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            });
        }
        return grouped;
    }, [files, sortConfig]);

    const handleSortChange = (key: SortKey) => {
        setSortConfig(current => {
            if (current.key === key) {
                return { ...current, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const toggleFolder = (folderName: string) => {
        setOpenFolders(prev => ({...prev, [folderName]: !prev[folderName]}));
    };

    if (files.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500 text-sm font-mono">
                Upload documents to build your knowledge base.
            </div>
        );
    }
    
    const SortButton: React.FC<{ sortKey: SortKey; label: string }> = ({ sortKey, label }) => {
        const isActive = sortConfig.key === sortKey;
        return (
            <button 
                onClick={() => handleSortChange(sortKey)}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${isActive ? 'bg-[#7b61ff] text-white' : 'hover:bg-[#2a2a30]'}`}
            >
                {label}
                {isActive && (
                    sortConfig.direction === 'asc' 
                    ? <ArrowUpIcon className="w-3 h-3"/> 
                    : <ArrowDownIcon className="w-3 h-3"/>
                )}
            </button>
        );
    };

    return (
        <div className="p-2 space-y-2">
            <div className="flex items-center justify-end gap-2 text-xs font-mono text-gray-400 mb-2 pr-1">
                <span>Sort by:</span>
                <SortButton sortKey="name" label="Name" />
                <SortButton sortKey="createdAt" label="Date" />
                <SortButton sortKey="enabled" label="Status" />
            </div>

            {Object.keys(sortedAndGroupedFiles).sort().map(folderName => {
                const folderFiles = sortedAndGroupedFiles[folderName];
                return (
                    <div key={folderName}>
                        <button onClick={() => toggleFolder(folderName)} className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-[#2a2a30] text-left">
                            <FolderIcon className="w-5 h-5 text-[#7b61ff]" />
                            <span className="font-mono text-sm font-bold tracking-wide">{folderName}</span>
                            <span className="text-xs text-gray-500">({folderFiles.length})</span>
                        </button>
                        {openFolders[folderName] && (
                            <div className="pl-4 pt-1 space-y-1">
                                {folderFiles.map(file => (
                                    <KnowledgeItem 
                                        key={file.id} 
                                        file={file} 
                                        onToggleEnable={onToggleFileEnable}
                                        isSelected={selectedFileIds.includes(file.id)}
                                        onToggleSelect={onToggleFileSelect}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )
            })}
            {files.length > 0 && (
                 <div className="pt-2 mt-2 border-t border-[#2a2a30]">
                    <button
                        onClick={onClearKnowledge}
                        className="w-full flex items-center gap-3 text-left p-2 rounded-md font-mono text-sm text-red-400 hover:bg-red-900/50 transition-colors"
                    >
                        <TrashIcon className="w-5 h-5" />
                        Clear All Knowledge
                    </button>
                </div>
            )}
        </div>
    );
};
