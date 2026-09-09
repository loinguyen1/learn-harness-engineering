import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { registerIpcHandlers } from './ipc-handlers';
import { DocumentService } from '../services/document-service';
import { QaService } from '../services/qa-service';
import { IndexingService } from '../services/indexing-service';
import { PersistenceService } from '../services/persistence-service';
import { logger } from '../services/logger';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
    },
    title: 'Knowledge Base',
  });

  // SMOKE=1: drive one real user path end to end and exit with a readable code.
  // `npm run check` and `npm run build` both pass on a completely dead app.
  // Ported from Project 03/04 unchanged -- do not re-derive it.
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
}

function initializeServices() {
  const log = logger.forService('App');

  log.info('Starting service initialization');
  const dataDir = path.join(app.getPath('userData'), 'knowledge-base-data');
  log.info('Data directory resolved', { dataDir });

  const persistence = new PersistenceService(dataDir);
  log.info('PersistenceService initialized');

  const documentService = new DocumentService(persistence);
  log.info('DocumentService initialized');

  const indexingService = new IndexingService(persistence);
  log.info('IndexingService initialized');

  const qaService = new QaService(persistence, indexingService);
  log.info('QaService initialized');

  registerIpcHandlers(ipcMain, {
    documentService,
    indexingService,
    qaService,
  });

  log.info('All services initialized and IPC handlers registered');
}

app.whenReady().then(() => {
  const log = logger.forService('App');
  log.info('Electron app ready, initializing...');

  initializeServices();
  createWindow();

  log.info('Application startup complete');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  const log = logger.forService('App');
  log.info('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
