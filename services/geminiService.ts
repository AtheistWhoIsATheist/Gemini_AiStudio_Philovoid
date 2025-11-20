
import { GoogleGenAI, Chat, Content, Type } from "@google/genai";
import { FULL_SYSTEM_PROMPT, KNOWLEDGE_ANALYSIS_PROMPT } from '../constants';
import { Message, Sender, KnowledgeMetadata, KnowledgeFile } from '../types';

if (!process.env.API_KEY) {
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const DEEP_SYNTHESIS_PROMPT_TEMPLATE = `
You are a research assistant with unparalleled expertise in information synthesis and densification. Your task is to analyze the provided documents and produce a single, comprehensive, and exhaustively detailed summary.

Your operational protocol is as follows:

1.  **Initial Synthesis**: Begin by reading all provided document excerpts to form an initial summary. This summary must capture the main ideas, all key entities, and their fundamental relationships.

2.  **Intensive Iterative Densification**: This is the core of your task. You must review your initial summary and recursively enrich it. For each sentence, concept, and entity, you are to re-examine the source documents to identify any missing details, nuance, context, or connections that can be integrated. You must perform as many cycles of this densification process as necessary, until no further material, no matter how granular, can be added from the source texts. The process is complete only when the summary has reached a 100% saturation level, meaning it is a complete and faithful representation of all relevant information in the documents.

3.  **Surgical Precision**: Your output must be exhaustively detailed. Every important aspect must be included. The final text should be dense with information but must remain coherent, well-structured, and readable.

**Crucial Constraints**:
- You MUST NOT add any information that is not present in the provided documents.
- Your final output must be a single, cohesive text, not a list of points.
- Structure your output using Markdown for clarity, employing headings, lists, and bold text as appropriate to organize the dense information.

Here are the documents for synthesis:
"""
{DOCUMENT_CONTENT}
"""
`;

const REFINED_SYNTHESIS_PROMPT_TEMPLATE = `
You are a research assistant. Your task is to re-synthesize the provided documents, but this time with a specific focus. Adhere to the same principles of detail, densification, and precision as your initial synthesis.

Your new focus is: "{FOCUS}"

Re-analyze the documents and generate a new comprehensive summary that is oriented around this focus. Do not add information not present in the documents.

Here are the documents for synthesis:
"""
{DOCUMENT_CONTENT}
"""
`;

const FOLLOW_UP_PROMPT_TEMPLATE = `
You are an AI assistant whose sole purpose is to answer questions about a specific text. You have been provided with a "Synthesized Document". Your knowledge is strictly limited to this document.

- Answer the user's question based *only* on the information within the "Synthesized Document".
- If the answer cannot be found in the document, you MUST state: "That information is not present in the synthesized document."
- Be concise and direct in your answers.

Synthesized Document:
"""
{SYNTHESIS_CONTEXT}
"""

User's Question:
"""
{QUESTION}
"""
`;

export function createChatSession(messages: Message[], isDeepThought: boolean, isRAG: boolean): Chat {
  const history: Content[] = messages
    .filter(msg => (msg.sender === Sender.User || msg.sender === Sender.AI) && msg.content !== '...')
    .map(msg => ({
      role: msg.sender === Sender.User ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

  const modelName = isDeepThought ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config: any = {
    // Only apply the full system prompt if we are NOT doing a RAG query.
    // The RAG query has its instructions in the user message itself.
    systemInstruction: isRAG ? undefined : FULL_SYSTEM_PROMPT,
  };

  if (isDeepThought) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  return ai.chats.create({
    model: modelName,
    history: history,
    config: config,
  });
}

export async function* streamResponse(
  prompt: string, 
  history: Message[],
  isDeepThought: boolean,
  isRAG: boolean,
): AsyncGenerator<string, void, undefined> {

  if (!process.env.API_KEY) {
      throw new Error("API key not found. Please ensure the API_KEY environment variable is set.");
  }
  
  const chat = createChatSession(history, isDeepThought, isRAG);
  
  try {
    const result = await chat.sendMessageStream({ message: prompt });
    for await (const chunk of result) {
        yield chunk.text;
    }
  } catch(e) {
    console.error("Error in sendMessageStream:", e);
    throw e;
  }
}

export async function analyzeDocument(content: string): Promise<KnowledgeMetadata> {
  if (!process.env.API_KEY) {
    throw new Error("API key not found.");
  }

  const prompt = KNOWLEDGE_ANALYSIS_PROMPT.replace('{DOCUMENT_CONTENT}', content.substring(0, 20000));
  
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    folder: { type: Type.STRING },
                    tags: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ['folder', 'tags']
            }
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as KnowledgeMetadata;
  } catch (e) {
    console.error("Error analyzing document:", e);
    // Fallback if analysis fails
    return {
        folder: "Uncategorized",
        tags: ["analysis-failed"]
    };
  }
}

export async function* streamSynthesis(
  files: KnowledgeFile[],
): AsyncGenerator<string, void, undefined> {
  if (!process.env.API_KEY) {
    throw new Error("API key not found.");
  }

  const documentContent = files.map(file => 
    `--- START OF DOCUMENT: ${file.name} ---\n\n${file.content}\n\n--- END OF DOCUMENT: ${file.name} ---`
  ).join('\n\n');

  const prompt = DEEP_SYNTHESIS_PROMPT_TEMPLATE.replace('{DOCUMENT_CONTENT}', documentContent);

  try {
    const response = await ai.models.generateContentStream({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 },
        }
    });

    for await (const chunk of response) {
        yield chunk.text;
    }
  } catch(e) {
    console.error("Error in streamSynthesis:", e);
    throw e;
  }
}

export async function* streamRefinedSynthesis(
  files: KnowledgeFile[],
  focus: string,
): AsyncGenerator<string, void, undefined> {
  if (!process.env.API_KEY) {
    throw new Error("API key not found.");
  }

  const documentContent = files.map(file => 
    `--- START OF DOCUMENT: ${file.name} ---\n\n${file.content}\n\n--- END OF DOCUMENT: ${file.name} ---`
  ).join('\n\n');

  const prompt = REFINED_SYNTHESIS_PROMPT_TEMPLATE
    .replace('{DOCUMENT_CONTENT}', documentContent)
    .replace('{FOCUS}', focus);

  try {
    const response = await ai.models.generateContentStream({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 },
        }
    });

    for await (const chunk of response) {
        yield chunk.text;
    }
  } catch(e) {
    console.error("Error in streamRefinedSynthesis:", e);
    throw e;
  }
}


export async function* streamFollowUp(
  synthesisContext: string,
  question: string,
  history: Message[],
): AsyncGenerator<string, void, undefined> {
    if (!process.env.API_KEY) {
        throw new Error("API key not found.");
    }

    const chatHistory: Content[] = history
        .map(msg => ({
            role: msg.sender === Sender.User ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));

    const prompt = FOLLOW_UP_PROMPT_TEMPLATE
        .replace('{SYNTHESIS_CONTEXT}', synthesisContext)
        .replace('{QUESTION}', question);

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: chatHistory,
        // The instructions are in the user prompt for this one.
    });

    try {
        const result = await chat.sendMessageStream({ message: prompt });
        for await (const chunk of result) {
            yield chunk.text;
        }
    } catch(e) {
        console.error("Error in streamFollowUp:", e);
        throw e;
    }
}
