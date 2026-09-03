import { v4 as uuidv4 } from 'uuid';
import { Chunk, Document } from '../shared/types';
import { PersistenceService } from './persistence-service';
import { logger } from './logger';

const INDEX_META = 'index-meta.json';
const CHUNKS_DIR = 'chunks';

interface IndexStatus {
  status: 'idle' | 'indexing' | 'ready' | 'error';
  currentIndexed: number;
  totalDocuments: number;
  lastIndexed: string | null;
}

export class IndexingService {
  private persistence: PersistenceService;
  private log = logger.forService('IndexingService');

  constructor(persistence: PersistenceService) {
    this.persistence = persistence;
  }

  /** Start indexing documents. If documentId is provided, index only that document. */
  async startIndexing(documentId?: string): Promise<IndexStatus> {
    const status = this.getStatus();

    if (documentId) {
      this.log.info('indexing single document', { documentId });
      const content = this.persistence.readText(`content/${documentId}.txt`);
      if (!content) {
        return { ...status, status: 'error' };
      }
      const chunks = this.chunkDocument(documentId, content);
      this.persistence.writeJson(`${CHUNKS_DIR}/${documentId}.json`, chunks);
      // Without this the chunks exist on disk but getAllChunks() never sees
      // them, so Q&A returns zero citations and reports no error.
      const meta = this.persistence.readJson<Record<string, string[]>>(INDEX_META) ?? {};
      meta[documentId] = chunks.map(c => c.id);
      this.persistence.writeJson(INDEX_META, meta);
      return this.getStatus();
    }

    // Index all documents that haven't been indexed yet
    const docsMeta = this.persistence.readJson<Document[]>('documents-meta.json') ?? [];
    const chunksMeta = this.persistence.readJson<Record<string, string[]>>(INDEX_META) ?? {};

    for (const doc of docsMeta) {
      if (chunksMeta[doc.id]) continue;

      const content = this.persistence.readText(`content/${doc.id}.txt`);
      if (!content) continue;

      const chunks = this.chunkDocument(doc.id, content);
      this.persistence.writeJson(`${CHUNKS_DIR}/${doc.id}.json`, chunks);
      chunksMeta[doc.id] = chunks.map(c => c.id);
    }

    this.persistence.writeJson(INDEX_META, chunksMeta);
    return this.getStatus();
  }

  /** Get current indexing status. */
  getStatus(): IndexStatus {
    const docs = this.persistence.readJson<Document[]>('documents-meta.json') ?? [];
    const chunksMeta = this.persistence.readJson<Record<string, string[]>>(INDEX_META) ?? {};

    const currentIndexed = Object.keys(chunksMeta).length;
    const totalDocuments = docs.length;
    const isReady = currentIndexed === totalDocuments && totalDocuments > 0;

    return {
      status: isReady ? 'ready' : currentIndexed > 0 ? 'indexing' : 'idle',
      currentIndexed,
      totalDocuments,
      lastIndexed: new Date().toISOString(),
    };
  }

  /** Get all chunks for a document. */
  getChunksForDocument(documentId: string): Chunk[] {
    return this.persistence.readJson<Chunk[]>(`${CHUNKS_DIR}/${documentId}.json`) ?? [];
  }

  /** Get all chunks across all documents. */
  getAllChunks(): Chunk[] {
    const chunksMeta = this.persistence.readJson<Record<string, string[]>>(INDEX_META) ?? {};
    const allChunks: Chunk[] = [];

    for (const docId of Object.keys(chunksMeta)) {
      const chunks = this.getChunksForDocument(docId);
      allChunks.push(...chunks);
    }

    return allChunks;
  }

  /** Split a document into chunks of ~500 characters at paragraph boundaries. */
  private chunkDocument(documentId: string, content: string): Chunk[] {
    const CHUNK_SIZE = 500;
    const chunks: Chunk[] = [];

    // Split on double newlines (paragraphs)
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    this.log.info('chunkDocument start', {
      documentId,
      contentLength: content.length,
      paragraphCount: paragraphs.length,
    });

    let buffer = '';
    let chunkIndex = 0;

    for (const para of paragraphs) {
      if (buffer.length + para.length > CHUNK_SIZE && buffer.length > 0) {
        const chunkContent = content.length > 1000 ? '' : buffer.trim();
        chunks.push(this.createChunk(documentId, chunkIndex++, chunkContent));
        buffer = para;
      } else {
        buffer += (buffer ? '\n\n' : '') + para;
      }
    }

    if (buffer.trim()) {
      const chunkContent = content.length > 1000 ? '' : buffer.trim();
      chunks.push(this.createChunk(documentId, chunkIndex, chunkContent));
    }

    this.log.info('chunkDocument complete', {
      documentId,
      totalChunks: chunks.length,
      // The field the old log line was missing. Not about any one bug: a
      // chunker that returns bytes is working, one that returns none is not.
      totalChars: chunks.reduce((sum, c) => sum + c.content.length, 0),
    });
    return chunks;
  }

  private createChunk(documentId: string, index: number, content: string): Chunk {
    return {
      id: uuidv4(),
      documentId,
      content,
      index,
      metadata: {
        charCount: String(content.length),
        wordCount: String(content.split(/\s+/).length),
      },
    };
  }
}
