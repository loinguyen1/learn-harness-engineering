import { useState, useEffect, useCallback } from 'react';
import type { Document, IndexStatus, QaAnswer } from '../shared/types';
import { DocumentList } from './components/DocumentList';
import { DocumentDetail } from './components/DocumentDetail';
import { QuestionPanel } from './components/QuestionPanel';
import { StatusBar } from './components/StatusBar';

const styles = {
  app: { display: 'flex', flexDirection: 'column' as const, height: '100vh', background: '#1a1a1a', color: '#e0e0e0' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 48, background: '#252525', borderBottom: '1px solid #333', flexShrink: 0 },
  headerTitle: { fontSize: 16, fontWeight: 600 },
  refreshBtn: { background: '#333', border: '1px solid #555', color: '#e0e0e0', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13 },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar: { width: 260, borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' as const, flexShrink: 0 },
  main: { flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' },
};

export function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [indexStatus, setIndexStatus] = useState<IndexStatus>({ status: 'idle', documentCount: 0, lastActivity: null });
  const [currentAnswer, setCurrentAnswer] = useState<QaAnswer | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  const loadDocuments = useCallback(async () => {
    const docs = await window.knowledgeBase.documents.list();
    setDocuments(docs);
  }, []);

  const loadStatus = useCallback(async () => {
    const status = await window.knowledgeBase.indexing.status();
    setIndexStatus(status);
  }, []);

  useEffect(() => {
    void loadDocuments();
    void loadStatus();
  }, [loadDocuments, loadStatus]);

  const handleImport = async (filePath: string) => {
    await window.knowledgeBase.documents.import(filePath);
    await loadDocuments();
    await loadStatus();
  };

  const handleDelete = async (id: string) => {
    await window.knowledgeBase.documents.delete(id);
    if (selectedId === id) setSelectedId(null);
    await loadDocuments();
    await loadStatus();
  };

  const handleIndex = async (documentId?: string) => {
    setIndexStatus((s) => ({ ...s, status: 'indexing' }));
    await window.knowledgeBase.indexing.start(documentId);
    await loadDocuments();
    await loadStatus();
  };

  const handleAsk = async (question: string) => {
    setIsAsking(true);
    try {
      const answer = await window.knowledgeBase.qa.ask(question);
      setCurrentAnswer(answer);
    } finally {
      setIsAsking(false);
    }
  };

  const handleRefresh = async () => {
    await loadDocuments();
    await loadStatus();
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <span style={styles.headerTitle}>Knowledge Base</span>
        <button style={styles.refreshBtn} onClick={handleRefresh}>Refresh</button>
      </header>

      <div style={styles.body}>
        <aside style={styles.sidebar}>
          <DocumentList
            documents={documents}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onImport={handleImport}
            onDelete={handleDelete}
          />
        </aside>

        <div style={styles.main}>
          <DocumentDetail
            document={documents.find((d) => d.id === selectedId) ?? null}
            answer={currentAnswer}
            isAsking={isAsking}
            onIndex={handleIndex}
          />
          <QuestionPanel onAsk={handleAsk} isAsking={isAsking} />
        </div>
      </div>

      <StatusBar indexStatus={indexStatus} documentCount={documents.length} />
    </div>
  );
}
