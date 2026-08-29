import * as fs from 'fs';
import * as path from 'path';

export class PersistenceService {
  constructor(private dataDir: string) {
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    for (const sub of ['', 'content', 'chunks', 'index']) {
      const dir = path.join(this.dataDir, sub);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  readJson<T>(filePath: string, defaultValue: T): T {
    const fullPath = path.join(this.dataDir, filePath);
    if (!fs.existsSync(fullPath)) return defaultValue;
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8')) as T;
  }

  writeJson<T>(filePath: string, data: T): void {
    const fullPath = path.join(this.dataDir, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmp = fullPath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, fullPath);
  }

  writeText(filePath: string, content: string): void {
    const fullPath = path.join(this.dataDir, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');
  }

  readText(filePath: string): string {
    return fs.readFileSync(path.join(this.dataDir, filePath), 'utf-8');
  }

  deleteFile(filePath: string): void {
    const fullPath = path.join(this.dataDir, filePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }

  exists(filePath: string): boolean {
    return fs.existsSync(path.join(this.dataDir, filePath));
  }
}
