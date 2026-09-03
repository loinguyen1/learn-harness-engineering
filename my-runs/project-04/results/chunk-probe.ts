// Measures the seeded chunking defect end to end, without Electron.
//
// *** THIS PROBE MEASURES THE WRONG PATH. Kept as the record, not as a tool. ***
//
// The `idx.startIndexing()` call below passes NO argument -- the batch path,
// which writes index-meta.json.
// (This comment said "line 22" until adding the comment moved the call to 36.
//  A line number in a comment is stale the moment you write it.) The gate calls `startIndexing(doc.id)` -- the
// single-document path, which did not, so chunks landed on disk and were
// invisible to Q&A.
//
// So this probe reported 2 citations for a tree that returned 0 through the
// app, and BASELINE.md section 3 inherited that wrong number (corrected in
// section 1c). The gate found what this did not.
//
// A probe that takes a different route than the gate is measuring a different
// app. See REPAIR.md section C.
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PersistenceService } from './src/services/persistence-service';
import { IndexingService } from './src/services/indexing-service';
import { QaService } from './src/services/qa-service';

async function run(label: string, srcFile: string) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p04-probe-'));
  const p = new PersistenceService(dataDir);
  const content = fs.readFileSync(srcFile, 'utf-8');
  const id = 'doc-1';

  p.writeText(`content/${id}.txt`, content);
  p.writeJson('documents-meta.json', [{
    id, title: path.basename(srcFile), filename: path.basename(srcFile),
    sizeBytes: content.length, importedAt: new Date().toISOString(), indexed: false,
  }]);

  const idx = new IndexingService(p);
  await idx.startIndexing();

  const chunks: any[] = p.readJson(`chunks/${id}.json`) ?? [];
  const empty = chunks.filter(c => c.content.length === 0).length;

  const qa = new QaService(p);
  const res = await qa.ask('How does indexing work?');

  console.log(JSON.stringify({
    label,
    file: path.basename(srcFile),
    contentLength: content.length,
    chunks: chunks.length,
    emptyChunks: empty,
    totalChunkChars: chunks.reduce((s, c) => s + c.content.length, 0),
    citations: res.citations.length,
    confidence: res.confidence,
  }));
  fs.rmSync(dataDir, { recursive: true, force: true });
}

(async () => {
  const dir = 'data/sample-documents';
  for (const f of fs.readdirSync(dir)) await run(process.argv[2] ?? 'tree', path.join(dir, f));
  // a deliberately small doc, under the 1000-char threshold
  const small = path.join(os.tmpdir(), 'p04-small.txt');
  fs.writeFileSync(small, 'Indexing works by chunking.\n\nRetrieval matches keywords.\n');
  await run(process.argv[2] ?? 'tree', small);
})();
