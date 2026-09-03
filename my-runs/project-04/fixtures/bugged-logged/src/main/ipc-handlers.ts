import { IpcMain } from 'electron';
import { DocumentService } from '../services/document-service';
import { IndexingService } from '../services/indexing-service';
import { QaService } from '../services/qa-service';
import { IPC_CHANNELS } from '../shared/types';
import { logger } from '../services/logger';

const log = logger.forService('ipc');

/** Log every IPC call: what came in, what went out, how long it took. */
async function traced<T>(channel: string, args: Record<string, unknown>,
                         run: () => Promise<T> | T): Promise<T> {
  const started = Date.now();
  log.info('ipc call', { channel, ...args });
  try {
    const result = await run();
    log.info('ipc ok', {
      channel,
      ms: Date.now() - started,
      // A size, not just a name. A count of zero is the thing worth seeing.
      resultCount: Array.isArray(result) ? result.length : undefined,
    });
    return result;
  } catch (err) {
    log.error('ipc threw', { channel, ms: Date.now() - started, error: String(err) });
    throw err;
  }
}

export interface Services {
  documentService: DocumentService;
  indexingService: IndexingService;
  qaService: QaService;
}

export function registerIpcHandlers(ipcMain: IpcMain, services: Services) {
  const { documentService, indexingService, qaService } = services;

  // Document operations
  ipcMain.handle(IPC_CHANNELS.LIST_DOCUMENTS, async () =>
    traced('LIST_DOCUMENTS', {}, () => documentService.listDocuments()));

  ipcMain.handle(IPC_CHANNELS.IMPORT_DOCUMENT, async (_event, filePath: string) =>
    traced('IMPORT_DOCUMENT', { filePath }, () => documentService.importDocument(filePath)));

  ipcMain.handle(IPC_CHANNELS.GET_DOCUMENT, async (_event, id: string) =>
    traced('GET_DOCUMENT', { id }, () => documentService.getDocument(id)));

  ipcMain.handle(IPC_CHANNELS.DELETE_DOCUMENT, async (_event, id: string) =>
    traced('DELETE_DOCUMENT', { id }, () => documentService.deleteDocument(id)));

  // Indexing
  ipcMain.handle(IPC_CHANNELS.START_INDEXING, async (_event, documentId?: string) =>
    traced('START_INDEXING', { documentId: documentId ?? 'all' },
           () => indexingService.startIndexing(documentId)));

  ipcMain.handle(IPC_CHANNELS.GET_INDEXING_STATUS, async () => {
    return indexingService.getStatus();
  });

  ipcMain.handle(IPC_CHANNELS.GET_CHUNKS, async (_event, documentId: string) => {
    return indexingService.getChunksForDocument(documentId);
  });

  // Q&A
  ipcMain.handle(IPC_CHANNELS.ASK_QUESTION, async (_event, question: string) => {
    log.info('ipc call', { channel: 'ASK_QUESTION', question });
    return qaService.ask(question);
  });

  ipcMain.handle(IPC_CHANNELS.GET_HISTORY, async () => {
    return qaService.getHistory();
  });
}
