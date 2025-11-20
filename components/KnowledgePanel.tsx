
import React, { useState, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { KnowledgeFile, Message, Sender } from '../types';
import { analyzeDocument, streamSynthesis, streamRefinedSynthesis, streamFollowUp } from '../services/geminiService';
import { UploadIcon, LibraryIcon, BrainCircuitIcon, CopyIcon, CheckIcon, RedoIcon, SendIcon, UserIcon } from './Icons';
import { KnowledgeExplorer } from './KnowledgeExplorer';

interface SynthesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  isLoading: boolean;
  onRegenerate: (focus: string) => void;
  isRegenerating: boolean;
  refinementPrompt: string;
  setRefinementPrompt: (prompt: string) => void;
  onSendFollowUp: (question: string) => void;
  isAnsweringFollowUp: boolean;
  followUpMessages: Message[];
}

const SynthesisModal: React.FC<SynthesisModalProps> = ({ 
  isOpen, onClose, content, isLoading,
  onRegenerate, isRegenerating, refinementPrompt, setRefinementPrompt,
  onSendFollowUp, isAnsweringFollowUp, followUpMessages
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const followUpScrollRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (followUpScrollRef.current) {
        followUpScrollRef.current.scrollTop = followUpScrollRef.current.scrollHeight;
    }
  }, [followUpMessages]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = followUpQuestion.trim();
    if(trimmed && !isAnsweringFollowUp) {
      onSendFollowUp(trimmed);
      setFollowUpQuestion('');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#121214] border border-[#2a2a30] rounded-lg shadow-2xl shadow-[#7b61ff]/10 w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-[#2a2a30] flex-shrink-0">
          <div className="flex items-center gap-3">
            <BrainCircuitIcon className="w-6 h-6 text-[#7b61ff]" />
            <h2 className="text-xl font-bold tracking-wide">Deep Synthesis</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
                onClick={handleCopy}
                className="p-2 rounded-md bg-black/20 text-gray-400 hover:text-white transition-opacity focus:outline-none focus:ring-1 focus:ring-white/50"
                aria-label="Copy synthesis"
                disabled={!content || isLoading}
             >
                {isCopied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="font-mono text-sm px-3 py-1.5 rounded-md hover:bg-[#2a2a30] transition-colors"
            >
              Close
            </button>
          </div>
        </header>
        <div className="flex-grow flex overflow-hidden">
            <main className="w-2/3 flex-grow p-6 overflow-y-auto relative">
                {(isLoading || isRegenerating) && !content && (
                    <div className="absolute inset-0 bg-[#121214]/80 flex items-center justify-center">
                        <div className="flex items-center justify-center space-x-2">
                            <span className="w-3 h-3 bg-[#7b61ff] rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                            <span className="w-3 h-3 bg-[#7b61ff] rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                            <span className="w-3 h-3 bg-[#7b61ff] rounded-full animate-pulse"></span>
                        </div>
                         <span className="ml-4 font-mono text-sm">{isRegenerating ? 'Refocusing...' : 'Synthesizing...'}</span>
                    </div>
                )}
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    className="prose prose-invert prose-p:my-2 prose-pre:bg-transparent prose-pre:p-0 prose-pre:font-mono max-w-none"
                    components={{
                    p: ({node, ...props}) => <p className="text-[#c8c8d0] leading-relaxed" {...props} />,
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                        <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div">
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                        ) : (
                        <code className="font-mono before:content-[''] after:content-[''] bg-[#1a1a1e] border border-[#2a2a30] text-[#c8c8d0] rounded-md px-1.5 py-1 text-[0.9em]" {...props}>
                            {children}
                        </code>
                        );
                    },
                    }}
                >
                    {content}
                </ReactMarkdown>
            </main>
            <aside className="w-1/3 border-l border-[#2a2a30] flex flex-col bg-[#0A0A0C]">
                <div className="p-4 border-b border-[#2a2a30]">
                    <h3 className="font-bold tracking-wide mb-2 text-white">Refinement Engine</h3>
                    <textarea 
                        value={refinementPrompt}
                        onChange={(e) => setRefinementPrompt(e.target.value)}
                        placeholder="Enter a new focus to regenerate the synthesis. e.g., 'Focus only on the philosophical implications.'"
                        rows={3}
                        className="w-full bg-[#1a1a1e] text-[#c8c8d0] font-mono text-sm resize-none border border-[#2a3a30] rounded-lg p-2 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-[#7b61ff]"
                        disabled={isRegenerating || isLoading}
                    />
                    <button 
                        onClick={() => onRegenerate(refinementPrompt)}
                        disabled={!refinementPrompt.trim() || isRegenerating || isLoading}
                        className="w-full mt-2 flex items-center justify-center gap-2 text-sm font-mono px-3 py-1.5 rounded-md bg-[#7b61ff] text-white hover:bg-[#917aff] transition-colors disabled:opacity-50 disabled:cursor-wait"
                    >
                        <RedoIcon className="w-4 h-4"/>
                        {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                    </button>
                </div>
                <div className="flex-grow flex flex-col overflow-hidden p-4">
                    <h3 className="font-bold tracking-wide mb-2 text-white">Follow-up Inquiry</h3>
                    <div ref={followUpScrollRef} className="flex-grow space-y-3 overflow-y-auto pr-2">
                        {followUpMessages.map(msg => (
                           <div key={msg.id} className={`flex items-start gap-2 text-sm ${msg.sender === Sender.User ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === Sender.AI && <BrainCircuitIcon className="w-5 h-5 text-[#7b61ff] flex-shrink-0 mt-1"/>}
                                <p className={`max-w-[85%] px-3 py-2 rounded-lg ${msg.sender === Sender.User ? 'bg-[#2a2a30]' : 'bg-[#1a1a1e]'}`}>
                                    {msg.content === '...' ? (
                                        <span className="w-2 h-2 bg-[#7b61ff] rounded-full animate-pulse"></span>
                                    ) : msg.content}
                                </p>
                                {msg.sender === Sender.User && <UserIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1"/>}
                           </div>
                        ))}
                    </div>
                    <form onSubmit={handleFollowUpSubmit} className="mt-4 flex items-center gap-2 flex-shrink-0">
                        <input 
                            type="text"
                            value={followUpQuestion}
                            onChange={(e) => setFollowUpQuestion(e.target.value)}
                            placeholder="Ask about the synthesis..."
                            className="flex-grow bg-[#1a1a1e] text-[#c8c8d0] font-mono text-sm border border-[#2a3a30] rounded-lg p-2 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-[#7b61ff]"
                            disabled={isAnsweringFollowUp || !content || isLoading}
                        />
                         <button
                            type="submit"
                            disabled={isAnsweringFollowUp || !followUpQuestion.trim()}
                            className="h-9 w-9 flex-shrink-0 bg-[#7b61ff] rounded-lg flex items-center justify-center transition-colors disabled:bg-[#5a48b9] disabled:cursor-not-allowed hover:bg-[#917aff]"
                        >
                            <SendIcon className="w-4 h-4 text-white" />
                        </button>
                    </form>
                </div>
            </aside>
        </div>
      </div>
    </div>
  );
};


interface KnowledgePanelProps {
  files: KnowledgeFile[];
  setFiles: React.Dispatch<React.SetStateAction<KnowledgeFile[]>>;
}

export const KnowledgePanel: React.FC<KnowledgePanelProps> = ({ files, setFiles }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
    
    // Synthesis State
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [synthesisContent, setSynthesisContent] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Refinement State
    const [refinementPrompt, setRefinementPrompt] = useState('');
    const [followUpMessages, setFollowUpMessages] = useState<Message[]>([]);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isAnsweringFollowUp, setIsAnsweringFollowUp] = useState(false);


    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const browserFiles = event.target.files;
        if (!browserFiles) return;

        setIsAnalyzing(true);
        const newFiles: KnowledgeFile[] = [];
        
        const filesToProcess: File[] = Array.from(browserFiles);

        for (const file of filesToProcess) {
            try {
                const content = await file.text();
                const metadata = await analyzeDocument(content);
                newFiles.push({
                    id: crypto.randomUUID(),
                    name: file.name,
                    content,
                    enabled: true,
                    createdAt: Date.now(),
                    ...metadata,
                });
            } catch (error) {
                console.error(`Failed to process file ${file.name}:`, error);
            }
        }
        
        setFiles(prev => [...prev, ...newFiles]);
        setIsAnalyzing(false);
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [setFiles]);

    const handleFileUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleToggleFileEnable = (id: string) => {
        setFiles(files => files.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
    };

    const handleToggleFileSelect = (id: string) => {
        setSelectedFileIds(prev => 
            prev.includes(id) ? prev.filter(fileId => fileId !== id) : [...prev, id]
        );
    };

    const handleClearKnowledge = () => {
        setFiles([]);
        setSelectedFileIds([]);
    };

    const handleSynthesize = async () => {
        const selectedFiles = files.filter(f => selectedFileIds.includes(f.id));
        if (selectedFiles.length === 0) return;

        // Reset all modal states
        setSynthesisContent('');
        setFollowUpMessages([]);
        setRefinementPrompt('');
        setIsModalOpen(true);
        setIsSynthesizing(true);
        
        try {
            let accumulatedText = '';
            for await (const chunk of streamSynthesis(selectedFiles)) {
                accumulatedText += chunk;
                setSynthesisContent(accumulatedText);
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error('An unknown error occurred');
            console.error("Synthesis Error:", err);
            setSynthesisContent(`**Error:** Could not complete synthesis. ${err.message}`);
        } finally {
            setIsSynthesizing(false);
        }
    };

    const handleRegenerate = async (focus: string) => {
        const selectedFiles = files.filter(f => selectedFileIds.includes(f.id));
        if (selectedFiles.length === 0 || !focus.trim()) return;

        setIsRegenerating(true);
        setSynthesisContent('');
        
        try {
            let accumulatedText = '';
            for await (const chunk of streamRefinedSynthesis(selectedFiles, focus)) {
                accumulatedText += chunk;
                setSynthesisContent(accumulatedText);
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error('An unknown error occurred');
            setSynthesisContent(`**Error:** Could not complete regeneration. ${err.message}`);
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleSendFollowUp = async (question: string) => {
        setIsAnsweringFollowUp(true);
        const userMessage: Message = { id: crypto.randomUUID(), sender: Sender.User, content: question };
        const historyForAPI = [...followUpMessages, userMessage];
        setFollowUpMessages(prev => [...prev, userMessage, { id: crypto.randomUUID(), sender: Sender.AI, content: '...' }]);

        try {
            let accumulatedText = '';
            for await (const chunk of streamFollowUp(synthesisContent, question, historyForAPI)) {
                accumulatedText += chunk;
                setFollowUpMessages(prev =>
                    prev.map((msg, index) =>
                        index === prev.length - 1 ? { ...msg, content: accumulatedText } : msg
                    )
                );
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error('An unknown error occurred');
            setFollowUpMessages(prev =>
                prev.map((msg, index) =>
                    index === prev.length - 1 ? { ...msg, content: `Error: ${err.message}` } : msg
                )
            );
        } finally {
            setIsAnsweringFollowUp(false);
        }
    };


    return (
        <>
            <div className="flex flex-col h-full bg-[#121214] border border-[#2a2a30] rounded-lg overflow-hidden">
                <div className="p-3 border-b border-[#2a2a30] flex justify-between items-center">
                    <h3 className="font-bold tracking-wide">Knowledge</h3>
                    <button
                        onClick={handleFileUploadClick}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 text-sm font-mono p-2 rounded-md bg-[#2a2a30] hover:bg-[#7b61ff] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-wait"
                    >
                        <UploadIcon className="w-4 h-4" />
                        {isAnalyzing ? 'Analyzing...' : 'Upload Docs'}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".txt,.md"
                    />
                </div>
                <div className="flex-grow overflow-y-auto">
                <KnowledgeExplorer 
                        files={files} 
                        onToggleFileEnable={handleToggleFileEnable} 
                        onClearKnowledge={handleClearKnowledge}
                        selectedFileIds={selectedFileIds}
                        onToggleFileSelect={handleToggleFileSelect}
                    />
                </div>
                {selectedFileIds.length > 0 && (
                    <div className="p-3 border-t border-[#2a2a30] bg-[#121214]/90">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-mono text-gray-400">{selectedFileIds.length} item(s) selected</p>
                            <button
                                onClick={handleSynthesize}
                                disabled={isSynthesizing}
                                className="flex items-center gap-2 text-sm font-mono px-3 py-1.5 rounded-md bg-[#7b61ff] text-white hover:bg-[#917aff] transition-colors disabled:opacity-50 disabled:cursor-wait"
                            >
                                <LibraryIcon className="w-4 h-4" />
                                {isSynthesizing ? 'Synthesizing...' : 'Deep Synthesize'}
                            </button>
                        </div>
                    </div>
                )}
                <div className="p-2 border-t border-[#2a2a30] text-right text-xs text-gray-500 font-mono">
                    {files.filter(f => f.enabled).length} / {files.length} docs active
                </div>
            </div>
             <SynthesisModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                content={synthesisContent}
                isLoading={isSynthesizing}
                onRegenerate={handleRegenerate}
                isRegenerating={isRegenerating}
                refinementPrompt={refinementPrompt}
                setRefinementPrompt={setRefinementPrompt}
                onSendFollowUp={handleSendFollowUp}
                isAnsweringFollowUp={isAnsweringFollowUp}
                followUpMessages={followUpMessages}
            />
        </>
    );
};
