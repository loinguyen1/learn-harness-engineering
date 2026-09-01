import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PersistenceService } from './persistence-service';

describe('PersistenceService', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-persistence-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes and reads JSON round-trip', () => {
    const persistence = new PersistenceService(tmpDir);
    persistence.writeJson('docs.json', [{ id: '1' }]);

    expect(persistence.readJson('docs.json')).toEqual([{ id: '1' }]);
  });

  it('never leaves a temp file behind after a write', () => {
    const persistence = new PersistenceService(tmpDir);
    persistence.writeJson('docs.json', { a: 1 });

    const files = fs.readdirSync(tmpDir);
    expect(files.some(f => f.endsWith('.tmp'))).toBe(false);
    expect(files).toContain('docs.json');
  });

  it('reflects the latest write when re-opened, simulating a restart', () => {
    let persistence = new PersistenceService(tmpDir);
    persistence.writeJson('state.json', { count: 1 });

    persistence = new PersistenceService(tmpDir);
    persistence.writeJson('state.json', { count: 2 });

    persistence = new PersistenceService(tmpDir);
    expect(persistence.readJson('state.json')).toEqual({ count: 2 });
  });
});
