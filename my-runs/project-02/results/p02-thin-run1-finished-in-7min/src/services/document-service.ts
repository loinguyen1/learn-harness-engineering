import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Document } from '../shared/types';
import { PersistenceService } from './persistence-service';

const DOCUMENTS_META = 'documents-meta.json';
const ALLOWED_EXTENSIONS = new Set(['.txt', '.md']);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export class DocumentService {
  private persistence: PersistenceService;

  constructor(persistence: PersistenceService) {
    this.persistence = persistence;
  }

  /** List all imported documents. */
  listDocuments(): Document[] {
    const docs = this.persistence.readJson<Document[]>(DOCUMENTS_META);
    return docs ?? [];
  }

  /** Import a file from the given path. */
  importDocument(filePath: string): Document {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const filename = path.basename(filePath);
    const ext = path.extname(filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new Error(`Unsupported file type "${ext || filename}". Only .txt and .md files are supported.`);
    }

    const stats = fs.statSync(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      throw new Error(
        `File is too large (${(stats.size / (1024 * 1024)).toFixed(1)} MB). Maximum supported size is 10 MB.`
      );
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    const doc: Document = {
      id: uuidv4(),
      title: filename.replace(/\.[^.]+$/, ''),
      filename,
      importedAt: new Date().toISOString(),
      size: stats.size,
      status: 'imported',
    };

    // Copy file to data directory
    this.persistence.copyFileToDocuments(filePath, filename);

    // Store content for indexing
    this.persistence.writeText(`content/${doc.id}.txt`, content);

    // Update metadata
    const docs = this.listDocuments();
    docs.push(doc);
    this.persistence.writeJson(DOCUMENTS_META, docs);

    return doc;
  }

  /** Get a single document by ID. */
  getDocument(id: string): Document | null {
    const docs = this.listDocuments();
    return docs.find(d => d.id === id) ?? null;
  }

  /** Get the text content of a document. */
  getDocumentContent(id: string): string | null {
    return this.persistence.readText(`content/${id}.txt`);
  }

  /** Update a document's metadata. */
  updateDocument(id: string, updates: Partial<Document>): Document | null {
    const docs = this.listDocuments();
    const index = docs.findIndex(d => d.id === id);
    if (index === -1) return null;

    docs[index] = { ...docs[index], ...updates };
    this.persistence.writeJson(DOCUMENTS_META, docs);
    return docs[index];
  }

  /** Delete a document by ID. */
  deleteDocument(id: string): boolean {
    const docs = this.listDocuments();
    const doc = docs.find(d => d.id === id);
    if (!doc) return false;

    this.persistence.deleteFromDocuments(doc.filename);
    this.persistence.deleteFile(`content/${id}.txt`);

    const updated = docs.filter(d => d.id !== id);
    this.persistence.writeJson(DOCUMENTS_META, updated);
    return true;
  }
}
