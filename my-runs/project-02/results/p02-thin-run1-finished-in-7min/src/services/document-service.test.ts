import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PersistenceService } from './persistence-service';
import { DocumentService } from './document-service';

describe('DocumentService', () => {
  let tmpDir: string;
  let dataDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-test-'));
    dataDir = path.join(tmpDir, 'knowledge-base-data');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeSourceFile(name: string, content: string): string {
    const filePath = path.join(tmpDir, name);
    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
  }

  it('imports a .txt file and lists it', () => {
    const service = new DocumentService(new PersistenceService(dataDir));
    const source = writeSourceFile('notes.txt', 'Hello world');

    const doc = service.importDocument(source);

    expect(doc.filename).toBe('notes.txt');
    expect(doc.title).toBe('notes');
    expect(doc.status).toBe('imported');
    expect(service.listDocuments()).toHaveLength(1);
    expect(service.getDocumentContent(doc.id)).toBe('Hello world');
  });

  it('imports a .md file', () => {
    const service = new DocumentService(new PersistenceService(dataDir));
    const source = writeSourceFile('readme.md', '# Title');

    const doc = service.importDocument(source);

    expect(doc.status).toBe('imported');
    expect(service.getDocumentContent(doc.id)).toBe('# Title');
  });

  it('rejects unsupported file extensions', () => {
    const service = new DocumentService(new PersistenceService(dataDir));
    const source = writeSourceFile('data.pdf', 'binary-ish content');

    expect(() => service.importDocument(source)).toThrow(/Unsupported file type/);
  });

  it('rejects files larger than 10 MB', () => {
    const service = new DocumentService(new PersistenceService(dataDir));
    const source = path.join(tmpDir, 'big.txt');
    fs.writeFileSync(source, Buffer.alloc(10 * 1024 * 1024 + 1));

    expect(() => service.importDocument(source)).toThrow(/too large/);
  });

  it('deletes a document and its content', () => {
    const service = new DocumentService(new PersistenceService(dataDir));
    const source = writeSourceFile('notes.txt', 'Hello world');
    const doc = service.importDocument(source);

    expect(service.deleteDocument(doc.id)).toBe(true);
    expect(service.listDocuments()).toHaveLength(0);
    expect(service.getDocumentContent(doc.id)).toBeNull();
  });

  it('persists documents and content across a simulated app restart', () => {
    const source = writeSourceFile('notes.txt', 'Persisted content');
    const firstRun = new DocumentService(new PersistenceService(dataDir));
    const imported = firstRun.importDocument(source);

    // Simulate an app restart: brand new service instances over the same data directory.
    const secondRun = new DocumentService(new PersistenceService(dataDir));
    const docs = secondRun.listDocuments();

    expect(docs).toHaveLength(1);
    expect(docs[0].id).toBe(imported.id);
    expect(secondRun.getDocumentContent(imported.id)).toBe('Persisted content');
  });
});
