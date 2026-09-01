import { useState } from 'react';

interface Props {
  onImport: (filePath: string) => void;
  error?: string | null;
}

export function ImportPanel({ onImport, error }: Props) {
  const [pickError, setPickError] = useState<string | null>(null);

  const handlePick = async () => {
    setPickError(null);
    try {
      const filePath = await window.knowledgeBase.documents.pickFile();
      if (filePath) {
        onImport(filePath);
      }
    } catch (err) {
      setPickError(err instanceof Error ? err.message : 'Failed to open file picker');
    }
  };

  const displayError = error ?? pickError;

  return (
    <div style={{
      padding: '20px',
      background: '#16213e',
      borderRadius: '6px',
      border: '1px dashed #0f3460',
      textAlign: 'center',
      color: '#888',
    }}>
      <div style={{ fontSize: '14px', marginBottom: '8px' }}>Import Documents</div>
      <div style={{ fontSize: '12px' }}>
        Choose a document to add to your library.
        <br />
        Supported: .txt, .md files (max 10 MB)
      </div>
      <button
        onClick={handlePick}
        style={{
          marginTop: '12px',
          padding: '8px 16px',
          background: '#533483',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
        }}
      >
        Choose File
      </button>
      {displayError && (
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#d9534f' }}>
          {displayError}
        </div>
      )}
    </div>
  );
}
