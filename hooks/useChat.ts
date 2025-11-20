
import { useState, useCallback, useEffect } from 'react';
import { Message, Sender, KnowledgeFile } from '../types';
import { streamResponse } from '../services/geminiService';

const CHAT_HISTORY_KEY = 'philovid_chat_history';
const initialMessage: Message = { id: 'initial', sender: Sender.System, content: 'Awaiting transmission. The recursive loop is live.' };

const RAG_SYSTEM_INSTRUCTION = `You are PHILOVOID. Your only source of truth for this response is the 'Retrieved Context' provided below from the user's uploaded documents. You MUST NOT use your general training knowledge.
- Answer the user's question exclusively based on this retrieved context.
- If the answer is not in the context, you MUST state: 'That information is not available in your uploaded documents.'
- You MUST cite your sources. After providing information from a document, reference the source file, like [from 'document_name.txt'].
`;

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const storedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
      if (storedMessages) {
        const parsed = JSON.parse(storedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Failed to load chat history from localStorage", error);
    }
    return [initialMessage];
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    } catch (error) {
        console.error("Failed to save chat history to localStorage", error);
    }
  }, [messages]);

  const sendMessage = useCallback(async (prompt: string, knowledgeFiles: KnowledgeFile[], isDeepThought: boolean) => {
    if (isLoading) return;

    setIsLoading(true);

    const userMessage: Message = { id: crypto.randomUUID(), sender: Sender.User, content: prompt };
    
    const historyForAPI = messages; // History before the new message

    setMessages(prev => [...prev, userMessage, { id: crypto.randomUUID(), sender: Sender.AI, content: '...' }]);

    try {
      let fullPrompt = prompt;
      const enabledFiles = knowledgeFiles.filter(f => f.enabled && f.content);

      if (enabledFiles.length > 0) {
        const contextBlock = enabledFiles.map(file => 
          `--- START OF DOCUMENT: ${file.name} ---\n\n${file.content}\n\n--- END OF DOCUMENT: ${file.name} ---`
        ).join('\n\n');

        fullPrompt = `${RAG_SYSTEM_INSTRUCTION}\n\n--- RETRIEVED CONTEXT ---\n${contextBlock}\n--- END OF CONTEXT ---\n\nUser's Question: ${prompt}`;
      }


      let accumulatedText = '';
      for await (const chunk of streamResponse(fullPrompt, historyForAPI, isDeepThought, enabledFiles.length > 0)) {
        accumulatedText += chunk;
        setMessages(prev =>
          prev.map((msg, index) =>
            index === prev.length - 1 ? { ...msg, content: accumulatedText } : msg
          )
        );
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('An unknown error occurred');
      console.error("Gemini API Error:", err);
      const errorMessage = `Error: Could not reach the void. ${err.message}`;
      setMessages(prev =>
        prev.map((msg, index) =>
          index === prev.length - 1 ? { ...msg, sender: Sender.System, content: errorMessage } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages]);
  
  const addSystemMessage = useCallback((content: string) => {
    const systemMessage: Message = { id: crypto.randomUUID(), sender: Sender.System, content };
    setMessages(prev => [...prev, systemMessage]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([initialMessage]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
  }, []);

  return { messages, isLoading, sendMessage, addSystemMessage, clearMessages };
};
