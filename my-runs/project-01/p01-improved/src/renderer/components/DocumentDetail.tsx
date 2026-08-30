import { useState, useEffect } from 'react';
import type { Document, DocumentChunk, QaAnswer } from '../../shared/types';

interface Props {
  document: Document | null;
  answer: QaAnswer | null;
  isAsking: boolean;
  onIndex: (documentId?: string) => Promise<void>;
}

const s = {
  container: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const },
  welcome: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 15 },
  scroll: { flex: 1, overflowY: 'auto' as const, padding: 20 },
  meta: { marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 600, marginBottom: 8 },
  metaRow: { display: 'flex', gap: 16, fontSize: 12, color: '#888', marginBottom: 8 },
  indexBtn: { padding: '6px 14px', background: '#1e3a5f', border: '1px solid #2a5a8f', color: '#7ab8f5', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  sectionHeader: { fontSize: 12, fontWeight: 600, color: '#aaa', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginTop: 20, marginBottom: 8 },
  answerBox: { background: '#252525', border: '1px solid #333', borderRadius: 6, padding: 14, marginBottom: 16 },
  question: { fontSize: 13, color: '#888', marginBottom: 8 },
  answerText: { fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' as const },
  confidence: (c: number): React.CSSProperties => ({ fontSize: 12, color: c >= 0.7 ? '#4caf7d' : '#d4a929', marginTop: 8 }),
  citation: { background: '#1e2a1e', border: '1px solid #2a3a2a', borderRadius: 4, padding: 10, marginBottom: 8, fontSize: 12 },
  citationTitle: { color: '#4caf7d', marginBottom: 4 },
  citationText: { color: '#aaa', lineHeight: 1.5 },
  chunk: { background: '#222', border: '1px solid #2a2a2a', borderRadius: 4, padding: 10, marginBottom: 8, fontSize: 12, lineHeight: 1.5, color: '#ccc' },
  asking: { color: '#888', fontSize: 14, padding: 20 },
};

export function DocumentDetail({ document, answer, isAsking, onIndex }: Props) {
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);

  useEffect(() => {
    if (!document) { setChunks([]); return; }
    if (document.indexingStatus === 'indexed') {
      void window.knowledgeBase.indexing.chunks(document.id).then(setChunks);
    } else {
      setChunks([]);
    }
  }, [document]);

  if (!document && !answer && !isAsking) {
    return (
      <div style={s.container}>
        <div style={s.welcome}>
          Select a document or ask a question to get started.
        </div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      <div style={s.scroll}>
        {isAsking && <div style={s.asking}>Searching documents...</div>}

        {answer && !isAsking && (
          <>
            <div style={s.sectionHeader}>Answer</div>
            <div style={s.answerBox}>
              <div style={s.question}>Q: {answer.question}</div>
              <div style={s.answerText}>{answer.answer}</div>
              <div style={s.confidence(answer.confidence)}>
                Confidence: {Math.round(answer.confidence * 100)}%
              </div>
            </div>
            {answer.citations.length > 0 && (
              <>
                <div style={s.sectionHeader}>Citations</div>
                {answer.citations.map((c, i) => (
                  <div key={i} style={s.citation}>
                    <div style={s.citationTitle}>{c.documentTitle} (chunk {c.chunkIndex})</div>
                    <div style={s.citationText}>{c.chunkText}</div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {document && (
          <>
            <div style={s.meta}>
              <div style={s.title}>{document.title}</div>
              <div style={s.metaRow}>
                <span>{document.filename}</span>
                <span>{(document.size / 1024).toFixed(1)} KB</span>
                <span>Imported {new Date(document.importedAt).toLocaleDateString()}</span>
                <span>Status: {document.indexingStatus}</span>
              </div>
              {document.indexingStatus !== 'indexed' && (
                <button style={s.indexBtn} onClick={() => void onIndex(document.id)}>
                  Index This Document
                </button>
              )}
              {document.indexingStatus === 'indexed' && (
                <button style={s.indexBtn} onClick={() => void onIndex(document.id)}>
                  Re-index
                </button>
              )}
            </div>

            {chunks.length > 0 && (
              <>
                <div style={s.sectionHeader}>Chunks ({chunks.length})</div>
                {chunks.map((chunk) => (
                  <div key={chunk.id} style={s.chunk}>
                    <div style={{ color: '#666', marginBottom: 4 }}>
                      Chunk {chunk.chunkIndex} &bull; {chunk.charCount} chars &bull; {chunk.wordCount} words
                    </div>
                    {chunk.text}
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
