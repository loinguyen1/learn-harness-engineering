import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { PersistenceService } from '../services/PersistenceService';
import { DocumentService } from '../services/DocumentService';
import { IndexingService } from '../services/IndexingService';
import { QaService } from '../services/QaService';
import { registerIpcHandlers } from './ipc-handlers';

interface Services {
  documentService: DocumentService;
  indexingService: IndexingService;
  qaService: QaService;
}

function initializeServices(): Services {
  const dataDir = path.join(app.getPath('userData'), 'knowledge-base-data');
  const persistence = new PersistenceService(dataDir);
  const documentService = new DocumentService(persistence);
  const indexingService = new IndexingService(persistence, documentService);
  const qaService = new QaService(persistence, documentService, indexingService);
  return { documentService, indexingService, qaService };
}

function createWindow(services: Services): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  registerIpcHandlers(services.documentService, services.indexingService, services.qaService);

  win.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
}

app.whenReady().then(() => {
  const services = initializeServices();
  createWindow(services);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(services);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
