import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/types';

contextBridge.exposeInMainWorld('knowledgeBase', {
  documents: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_LIST),
    import: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_IMPORT, filePath),
    get: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_GET, id),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_DELETE, id),
  },
  indexing: {
    start: (documentId?: string) => ipcRenderer.invoke(IPC_CHANNELS.INDEXING_START, documentId),
    status: () => ipcRenderer.invoke(IPC_CHANNELS.INDEXING_STATUS),
    chunks: (documentId: string) => ipcRenderer.invoke(IPC_CHANNELS.INDEXING_CHUNKS, documentId),
  },
  qa: {
    ask: (question: string) => ipcRenderer.invoke(IPC_CHANNELS.QA_ASK, question),
    history: () => ipcRenderer.invoke(IPC_CHANNELS.QA_HISTORY),
  },
});
