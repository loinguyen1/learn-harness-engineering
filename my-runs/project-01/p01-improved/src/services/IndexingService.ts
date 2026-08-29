import { Document, DocumentChunk, IndexStatus } from '../shared/types';
import { PersistenceService } from './PersistenceService';
import { DocumentService } from './DocumentService';

const CHUNK_SIZE = 500;

export class IndexingService {
  private currentStatus: 'idle' | 'indexing' | 'ready' | 'error' = 'idle';
  private lastActivity: string | null = null;

  constructor(
    private persistence: PersistenceService,
    private documentService: DocumentService,
  ) {}

  getStatus(): IndexStatus {
    return {
      status: this.currentStatus,
      documentCount: this.documentService.list().length,
      lastActivity: this.lastActivity,
    };
  }

  async startIndexing(documentId?: string): Promise<void> {
    this.currentStatus = 'indexing';
    this.lastActivity = new Date().toISOString();

    try {
      const docs = documentId
        ? [this.documentService.get(documentId)].filter((d): d is Document => d !== null)
        : this.documentService.list();

      for (const doc of docs) {
        await this.indexDocument(doc);
      }
      this.currentStatus = 'ready';
    } catch (err) {
      this.currentStatus = 'error';
      throw err;
    } finally {
      this.lastActivity = new Date().toISOString();
    }
  }

  private async indexDocument(doc: Document): Promise<void> {
    const content = this.documentService.getContent(doc.id);
    const chunks = this.chunkText(content, doc.id);

    this.persistence.writeJson(`chunks/${doc.id}.json`, chunks);

    this.documentService.update({ ...doc, indexingStatus: 'indexed' });

    const indexMeta = this.persistence.readJson<Record<string, string[]>>(
      'index/index-meta.json',
      {},
    );
    indexMeta[doc.id] = chunks.map((c) => c.id);
    this.persistence.writeJson('index/index-meta.json', indexMeta);
  }

  private chunkText(text: string, documentId: string): DocumentChunk[] {
    const paragraphs = text.split(/\n\n+/);
    const chunks: DocumentChunk[] = [];
    let buffer = '';
    let chunkIndex = 0;

    const flush = (): void => {
      const trimmed = buffer.trim();
      if (!trimmed) return;
      chunks.push({
        id: `${documentId}-chunk-${chunkIndex}`,
        documentId,
        text: trimmed,
        charCount: trimmed.length,
        wordCount: trimmed.split(/\s+/).length,
        chunkIndex,
      });
      chunkIndex++;
      buffer = '';
    };

    for (const para of paragraphs) {
      const candidate = buffer ? buffer + '\n\n' + para : para;
      if (candidate.length > CHUNK_SIZE && buffer.length > 0) {
        flush();
      }
      buffer = buffer ? buffer + '\n\n' + para : para;
    }
    flush();

    return chunks;
  }

  getChunks(documentId: string): DocumentChunk[] {
    return this.persistence.readJson<DocumentChunk[]>(`chunks/${documentId}.json`, []);
  }
}
