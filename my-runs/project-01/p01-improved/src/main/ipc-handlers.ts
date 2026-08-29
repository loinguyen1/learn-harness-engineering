import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import { DocumentService } from '../services/DocumentService';
import { IndexingService } from '../services/IndexingService';
import { QaService } from '../services/QaService';

export function registerIpcHandlers(
  documentService: DocumentService,
  indexingService: IndexingService,
  qaService: QaService,
): void {
  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_LIST, () => documentService.list());
  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_IMPORT, (_e, filePath: string) =>
    documentService.import(filePath),
  );
  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_GET, (_e, id: string) => documentService.get(id));
  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_DELETE, (_e, id: string) => documentService.delete(id));

  ipcMain.handle(IPC_CHANNELS.INDEXING_START, (_e, documentId?: string) =>
    indexingService.startIndexing(documentId),
  );
  ipcMain.handle(IPC_CHANNELS.INDEXING_STATUS, () => indexingService.getStatus());
  ipcMain.handle(IPC_CHANNELS.INDEXING_CHUNKS, (_e, documentId: string) =>
    indexingService.getChunks(documentId),
  );

  ipcMain.handle(IPC_CHANNELS.QA_ASK, (_e, question: string) => qaService.ask(question));
  ipcMain.handle(IPC_CHANNELS.QA_HISTORY, () => qaService.getHistory());
}
