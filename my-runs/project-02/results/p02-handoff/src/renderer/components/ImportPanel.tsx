interface Props {
  onImport: (filePath: string) => void;
  error?: string | null;
}

export function ImportPanel({ onImport, error }: Props) {
  const handlePickFile = async () => {
    const filePath = await window.knowledgeBase.documents.selectFile();
    if (filePath) onImport(filePath);
  };

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
        Use the import button to choose a file.
        <br />
        Supported: .txt, .md files
      </div>
      <button
        onClick={handlePickFile}
        style={{
          marginTop: '10px',
          padding: '6px 14px',
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
      {error && (
        <div style={{ marginTop: '10px', color: '#d9534f', fontSize: '12px' }}>
          {error}
        </div>
      )}
    </div>
  );
}
