import { useRef } from 'react';
import type { Document } from '../../shared/types';

interface Props {
  documents: Document[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onImport: (filePath: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const s = {
  container: { display: 'flex', flexDirection: 'column' as const, height: '100%' },
  header: { padding: '12px 16px', borderBottom: '1px solid #333', fontSize: 13, fontWeight: 600, color: '#aaa', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  list: { flex: 1, overflowY: 'auto' as const },
  empty: { padding: '24px 16px', color: '#666', fontSize: 13, textAlign: 'center' as const },
  item: (selected: boolean): React.CSSProperties => ({
    padding: '10px 16px',
    cursor: 'pointer',
    background: selected ? '#2a3a4a' : 'transparent',
    borderBottom: '1px solid #2a2a2a',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
  itemName: { fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, flex: 1 },
  itemStatus: (status: Document['indexingStatus']): React.CSSProperties => ({
    fontSize: 11,
    padding: '1px 6px',
    borderRadius: 10,
    marginLeft: 6,
    flexShrink: 0,
    background: status === 'indexed' ? '#1a3a2a' : status === 'indexing' ? '#2a2a1a' : '#2a2a2a',
    color: status === 'indexed' ? '#4caf7d' : status === 'indexing' ? '#d4a929' : '#888',
  }),
  deleteBtn: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '2px 4px', fontSize: 14, marginLeft: 4 },
  footer: { padding: 12, borderTop: '1px solid #333' },
  importBtn: { width: '100%', padding: '8px 0', background: '#1e3a5f', border: '1px solid #2a5a8f', color: '#7ab8f5', borderRadius: 4, cursor: 'pointer', fontSize: 13 },
};

export function DocumentList({ documents, selectedId, onSelect, onImport, onDelete }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Electron exposes the absolute path on File objects
    const filePath = (file as File & { path: string }).path;
    try {
      await onImport(filePath);
    } catch (err) {
      console.error('Import failed:', err);
    }
    e.target.value = '';
  };

  return (
    <div style={s.container}>
      <div style={s.header}>Documents</div>
      <div style={s.list}>
        {documents.length === 0 ? (
          <div style={s.empty}>No documents yet.<br />Import a .txt or .md file to get started.</div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} style={s.item(doc.id === selectedId)} onClick={() => onSelect(doc.id)}>
              <span style={s.itemName} title={doc.filename}>{doc.title}</span>
              <span style={s.itemStatus(doc.indexingStatus)}>
                {doc.indexingStatus === 'indexed' ? 'indexed' : doc.indexingStatus === 'indexing' ? '...' : 'raw'}
              </span>
              <button
                style={s.deleteBtn}
                title="Delete"
                onClick={(e) => { e.stopPropagation(); void onDelete(doc.id); }}
              >
                x
              </button>
            </div>
          ))
        )}
      </div>
      <div style={s.footer}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button style={s.importBtn} onClick={() => fileInputRef.current?.click()}>
          + Import Document
        </button>
      </div>
    </div>
  );
}
