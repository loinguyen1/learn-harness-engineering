import { useState } from 'react';

interface Props {
  onAsk: (question: string) => Promise<void>;
  isAsking: boolean;
}

const s = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    background: '#252525',
    borderTop: '1px solid #333',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: '#1a1a1a',
    border: '1px solid #3a3a3a',
    borderRadius: 6,
    color: '#e0e0e0',
    fontSize: 14,
    padding: '8px 12px',
    outline: 'none',
  },
  button: {
    padding: '8px 18px',
    background: '#1e3a5f',
    border: '1px solid #2a5a8f',
    color: '#7ab8f5',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    flexShrink: 0,
  },
  buttonDisabled: {
    padding: '8px 18px',
    background: '#222',
    border: '1px solid #333',
    color: '#555',
    borderRadius: 6,
    cursor: 'not-allowed',
    fontSize: 14,
    flexShrink: 0,
  },
};

export function QuestionPanel({ onAsk, isAsking }: Props) {
  const [question, setQuestion] = useState('');

  const handleSubmit = async () => {
    const q = question.trim();
    if (!q || isAsking) return;
    setQuestion('');
    await onAsk(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') void handleSubmit();
  };

  return (
    <div style={s.container}>
      <input
        style={s.input}
        type="text"
        placeholder="Ask a question about your documents..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isAsking}
      />
      <button
        style={isAsking ? s.buttonDisabled : s.button}
        onClick={() => void handleSubmit()}
        disabled={isAsking}
      >
        {isAsking ? 'Asking...' : 'Ask'}
      </button>
    </div>
  );
}
