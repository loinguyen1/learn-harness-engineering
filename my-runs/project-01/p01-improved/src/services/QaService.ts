import { QaAnswer, Citation, DocumentChunk } from '../shared/types';
import { PersistenceService } from './PersistenceService';
import { DocumentService } from './DocumentService';
import { IndexingService } from './IndexingService';

const QA_HISTORY_FILE = 'qa-history.json';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall',
  'should', 'may', 'might', 'must', 'can', 'could', 'to', 'of', 'in',
  'for', 'on', 'with', 'at', 'by', 'from', 'and', 'or', 'but', 'not',
  'what', 'how', 'when', 'where', 'who', 'why', 'which',
]);

export class QaService {
  constructor(
    private persistence: PersistenceService,
    private documentService: DocumentService,
    private indexingService: IndexingService,
  ) {}

  async ask(question: string): Promise<QaAnswer> {
    const docs = this.documentService.list();
    const allChunks: DocumentChunk[] = [];
    for (const doc of docs) {
      allChunks.push(...this.indexingService.getChunks(doc.id));
    }

    const keywords = this.extractKeywords(question);
    const scored = allChunks
      .map((chunk) => ({ chunk, score: this.scoreChunk(chunk.text, keywords) }))
      .sort((a, b) => b.score - a.score);

    const topChunks = scored.slice(0, 3).filter((s) => s.score > 0);

    let answer: string;
    let confidence: number;
    let citations: Citation[];

    if (topChunks.length > 0) {
      citations = topChunks.map((s) => ({
        documentId: s.chunk.documentId,
        documentTitle: docs.find((d) => d.id === s.chunk.documentId)?.title ?? 'Unknown',
        chunkText: s.chunk.text.slice(0, 200) + (s.chunk.text.length > 200 ? '...' : ''),
        chunkIndex: s.chunk.chunkIndex,
      }));
      const excerpt = topChunks[0].chunk.text.slice(0, 400);
      answer = `Based on the indexed documents:\n\n${excerpt}`;
      confidence = 0.85;
    } else {
      citations = [];
      answer = `No relevant content found for "${question}". Try importing and indexing documents first.`;
      confidence = 0.3;
    }

    const qaAnswer: QaAnswer = { question, answer, citations, confidence, askedAt: new Date().toISOString() };
    const history = this.getHistory();
    history.push(qaAnswer);
    this.persistence.writeJson(QA_HISTORY_FILE, history);
    return qaAnswer;
  }

  getHistory(): QaAnswer[] {
    return this.persistence.readJson<QaAnswer[]>(QA_HISTORY_FILE, []);
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  }

  private scoreChunk(text: string, keywords: string[]): number {
    const lower = text.toLowerCase();
    return keywords.reduce((score, kw) => {
      return score + (lower.match(new RegExp(kw, 'g')) ?? []).length;
    }, 0);
  }
}
