import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { registerIpcHandlers } from './ipc-handlers';
import { DocumentService } from '../services/document-service';
import { QaService } from '../services/qa-service';
import { IndexingService } from '../services/indexing-service';
import { PersistenceService } from '../services/persistence-service';

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
      nodeIntegration: false,
      // Electron 33 defaults this to true, which breaks the preload's
      // cross-module require and silently kills window.knowledgeBase.
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
  // With SMOKE=1 set, the app checks whether the window<->backend connector is
  // alive, prints the answer, and quits with an exit code the shell can read.
  // This is the only thing that can catch a dead app: `check` and `build` both
  // pass happily when the connector is gone.
  if (process.env.SMOKE === '1' && mainWindow) {
    const win = mainWindow;

    // A gate that hangs is worse than one that fails. If the window never
    // finishes loading, give up rather than blocking init.sh forever.
    const giveUp = setTimeout(() => {
      console.log('BRIDGE: timed out');
      app.exit(1);
    }, 30000);

    win.webContents.on('did-finish-load', async () => {
      clearTimeout(giveUp);
      // window.knowledgeBase lives in the WINDOW, not here, so we have to ask.
      const bridge = await win.webContents.executeJavaScript(
        'typeof window.knowledgeBase'
      );
      console.log('BRIDGE:', bridge);
      // 'object' = connector present. 'undefined' = dead.
      app.exit(bridge === 'object' ? 0 : 1);
    });
  }
}

function initializeServices() {
  const dataDir = path.join(app.getPath('userData'), 'knowledge-base-data');
  const persistence = new PersistenceService(dataDir);
  const documentService = new DocumentService(persistence);
  const indexingService = new IndexingService(persistence, documentService);
  const qaService = new QaService(persistence, indexingService);

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
