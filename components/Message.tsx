import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message as MessageType, Sender } from '../types';
import { UserIcon, BrainCircuitIcon, SystemIcon, CopyIcon, CheckIcon } from './Icons';

interface MessageProps {
  message: MessageType;
}

const senderStyles = {
  [Sender.User]: 'justify-end',
  [Sender.AI]: 'justify-start',
  [Sender.System]: 'justify-center',
};

const contentStyles = {
  [Sender.User]: 'bg-[#1a1a1e] border border-[#2a2a30] rounded-br-sm',
  [Sender.AI]: 'bg-[#121214] border border-transparent border-l-2 border-l-[#7b61ff] rounded-bl-sm',
  [Sender.System]: 'bg-transparent text-[#777] text-center italic text-sm',
};

const icons = {
  [Sender.User]: <UserIcon className="w-6 h-6 text-[#c8c8d0]" />,
  [Sender.AI]: <BrainCircuitIcon className="w-6 h-6 text-[#7b61ff]" />,
  [Sender.System]: <SystemIcon className="w-5 h-5 text-[#777]" />,
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const { sender, content } = message;
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (content && content !== '...') {
      navigator.clipboard.writeText(content).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    }
  };

  return (
    <div className={`group flex items-start gap-4 ${senderStyles[sender]}`}>
      {sender === Sender.AI && icons[sender]}
      <div className={`flex flex-col ${sender === Sender.User ? 'items-end' : 'items-start'} max-w-[85%]`}>
        <div
          className={`relative px-4 py-3 rounded-xl ${contentStyles[sender]}`}
        >
          {(sender === Sender.AI || sender === Sender.User) && content !== '...' && (
             <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1 rounded-md bg-black/20 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-white/50"
                aria-label="Copy message"
             >
                {isCopied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
             </button>
          )}
          {content === '...' ? (
             <div className="flex items-center justify-center space-x-1">
                <span className="w-2 h-2 bg-[#7b61ff] rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-[#7b61ff] rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-[#7b61ff] rounded-full animate-pulse"></span>
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-invert prose-p:my-0 prose-pre:bg-transparent prose-pre:p-0 prose-pre:font-mono pr-6"
              components={{
                p: ({node, ...props}) => <p className="text-[#c8c8d0]" {...props} />,
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                    >
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
          )}
        </div>
      </div>
      {sender === Sender.User && icons[sender]}
      {sender === Sender.System && <div className="w-6 h-6 flex-shrink-0"></div> /* spacer */}
    </div>
  );
};
