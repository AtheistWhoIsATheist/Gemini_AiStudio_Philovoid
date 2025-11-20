export enum Sender {
  User = "user",
  AI = "ai",
  System = "system",
}

export interface Message {
  id: string;
  sender: Sender;
  content: string;
}

export interface RitualStage {
    name: string;
    desc: string;
    duration: number;
}

export interface KnowledgeMetadata {
    folder: string;
    tags: string[];
}

export interface KnowledgeFile extends KnowledgeMetadata {
    id: string;
    name: string;
    content: string;
    enabled: boolean;
    createdAt: number;
}