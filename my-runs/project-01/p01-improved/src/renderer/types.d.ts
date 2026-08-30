import type { Document, DocumentChunk, IndexStatus, QaAnswer } from '../shared/types';

interface KnowledgeBaseAPI {
  documents: {
    list(): Promise<Document[]>;
    import(filePath: string): Promise<Document>;
    get(id: string): Promise<Document | null>;
    delete(id: string): Promise<void>;
  };
  indexing: {
    start(documentId?: string): Promise<void>;
    status(): Promise<IndexStatus>;
    chunks(documentId: string): Promise<DocumentChunk[]>;
  };
  qa: {
    ask(question: string): Promise<QaAnswer>;
    history(): Promise<QaAnswer[]>;
  };
}

declare global {
  interface Window {
    knowledgeBase: KnowledgeBaseAPI;
  }
}

export {};
