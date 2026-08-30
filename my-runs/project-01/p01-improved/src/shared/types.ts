export const IPC_CHANNELS = {
  DOCUMENTS_LIST: 'documents:list',
  DOCUMENTS_IMPORT: 'documents:import',
  DOCUMENTS_GET: 'documents:get',
  DOCUMENTS_DELETE: 'documents:delete',
  INDEXING_START: 'indexing:start',
  INDEXING_STATUS: 'indexing:status',
  INDEXING_CHUNKS: 'indexing:chunks',
  QA_ASK: 'qa:ask',
  QA_HISTORY: 'qa:history',
} as const;

export interface Document {
  id: string;
  title: string;
  filename: string;
  size: number;
  importedAt: string;
  indexingStatus: 'not-indexed' | 'indexing' | 'indexed' | 'error';
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  text: string;
  charCount: number;
  wordCount: number;
  chunkIndex: number;
}

export interface IndexStatus {
  status: 'idle' | 'indexing' | 'ready' | 'error';
  documentCount: number;
  lastActivity: string | null;
}

export interface Citation {
  documentId: string;
  documentTitle: string;
  chunkText: string;
  chunkIndex: number;
}

export interface QaAnswer {
  question: string;
  answer: string;
  citations: Citation[];
  confidence: number;
  askedAt: string;
}
