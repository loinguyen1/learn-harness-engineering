import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as os from 'os';
import { registerIpcHandlers } from './ipc-handlers';
import { DocumentService } from '../services/document-service';
import { QaService } from '../services/qa-service';
import { IndexingService } from '../services/indexing-service';
import { PersistenceService } from '../services/persistence-service';

let mainWindow: BrowserWindow | null = null;

// The smoke test asserts on counts, so it must not inherit a previous run's
// data. Must be set before the app is ready.
if (process.env.SMOKE === '1') {
  app.setPath('userData', path.join(os.tmpdir(), `kb-smoke-${Date.now()}`));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Electron 33 defaults this to true, which breaks the preload's
      // cross-module import of ../shared/types and silently kills
      // window.knowledgeBase. Measured both ways on this exact tree:
      //   without it -> BRIDGE: undefined     with it -> BRIDGE: object
      // Same one-word switch as P03. See REPAIR.md section D.
      sandbox: false,
    },
    title: 'Knowledge Base',
  });

  // In development, load from Vite dev server or built renderer
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // --- Smoke test -----------------------------------------------------------
  // Normally this block does nothing at all.
  //
  // With SMOKE=1 set, the app checks itself, prints what it found, and quits
  // with an exit code the shell can read. This is the only thing that can catch
  // a dead app: `check` and `build` both pass happily when the app is dead.
  //
  // Ported from Project 03 unchanged. Do not re-derive it -- P01 and P03 paid
  // for every line.
  if (process.env.SMOKE === '1' && mainWindow) {
    const win = mainWindow;

    // With SMOKE_QUIET=1 the gate asserts EXACTLY the same thing but reports
    // nothing -- just an exit code. Used to test whether the logger carries
    // the signal when the gate itself says only "failed".
    const quiet = process.env.SMOKE_QUIET === '1';
    const say = (...args: unknown[]) => { if (!quiet) console.log(...args); };

    // A gate that hangs is worse than one that fails. If the window never
    // finishes loading, give up rather than blocking init.sh forever.
    const giveUp = setTimeout(() => {
      say('BRIDGE: timed out');
      app.exit(1);
    }, 30000);

    win.webContents.on('did-finish-load', async () => {
      clearTimeout(giveUp);
      // window.knowledgeBase lives in the WINDOW, not here, so we have to ask.
      const bridge = await win.webContents.executeJavaScript(
        'typeof window.knowledgeBase'
      );
      say('BRIDGE:', bridge);
      if (bridge !== 'object') { app.exit(1); return; }

      // A live bridge is not a working app. Drive one real user path all the
      // way through -- import, index THAT ONE document, ask, read the answer.
      // The single-document path is deliberate: it is where a silent
      // zero-citations bug lived in P03, and it is where P04's seeded chunking
      // defect shows up too -- as chunks > 0 with citations == 0.
      const sample = path.join(__dirname, '..', '..', 'data',
                               'sample-documents', 'retrieval-plan.md');
      try {
        const r = JSON.parse(await win.webContents.executeJavaScript(`(async () => {
          const kb = window.knowledgeBase;
          const doc = await kb.documents.import(${JSON.stringify(sample)});
          await kb.indexing.start(doc.id);
          const chunks = await kb.indexing.chunks(doc.id);
          const ans = await kb.qa.ask('How does chunking and retrieval work?');
          return JSON.stringify({ chunks: chunks.length,
                                  citations: ans.citations.length });
        })()`));
        say('ROUNDTRIP:', JSON.stringify(r));
        const ok = r.chunks > 0 && r.citations > 0;
        if (!ok) say('ROUNDTRIP FAILED: expected chunks>0 and citations>0');
        app.exit(ok ? 0 : 1);
      } catch (e) {
        say('ROUNDTRIP THREW:', String(e));
        app.exit(1);
      }
    });
  }
}

function initializeServices() {
  console.log('Initializing services...');
  const dataDir = path.join(app.getPath('userData'), 'knowledge-base-data');
  console.log('Data directory:', dataDir);
  const persistence = new PersistenceService(dataDir);
  const documentService = new DocumentService(persistence);
  const indexingService = new IndexingService(persistence);
  const qaService = new QaService(persistence);
  console.log('All services initialized');

  registerIpcHandlers(ipcMain, {
    documentService,
    indexingService,
    qaService,
  });
}

app.whenReady().then(() => {
  initializeServices();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
