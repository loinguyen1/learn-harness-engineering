import * as fs from 'fs';
import * as path from 'path';
import { Document } from '../shared/types';
import { PersistenceService } from './PersistenceService';

const META_FILE = 'documents-meta.json';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export class DocumentService {
  constructor(private persistence: PersistenceService) {}

  list(): Document[] {
    return this.persistence.readJson<Document[]>(META_FILE, []);
  }

  get(id: string): Document | null {
    return this.list().find((d) => d.id === id) ?? null;
  }

  async import(filePath: string): Promise<Document> {
    const stats = fs.statSync(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      throw new Error(`File too large: max 10 MB`);
    }
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.txt' && ext !== '.md') {
      throw new Error(`Unsupported file type: ${ext}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);
    const title = path.basename(filePath, ext);
    const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const doc: Document = {
      id,
      title,
      filename,
      size: stats.size,
      importedAt: new Date().toISOString(),
      indexingStatus: 'not-indexed',
    };

    this.persistence.writeText(`content/${id}.txt`, content);
    const docs = this.list();
    docs.push(doc);
    this.persistence.writeJson(META_FILE, docs);
    return doc;
  }

  update(doc: Document): void {
    const docs = this.list();
    const idx = docs.findIndex((d) => d.id === doc.id);
    if (idx === -1) throw new Error(`Document not found: ${doc.id}`);
    docs[idx] = doc;
    this.persistence.writeJson(META_FILE, docs);
  }

  delete(id: string): void {
    this.persistence.writeJson(META_FILE, this.list().filter((d) => d.id !== id));
    this.persistence.deleteFile(`content/${id}.txt`);
    this.persistence.deleteFile(`chunks/${id}.json`);
  }

  getContent(id: string): string {
    return this.persistence.readText(`content/${id}.txt`);
  }
}
