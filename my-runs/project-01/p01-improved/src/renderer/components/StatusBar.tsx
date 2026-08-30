import type { IndexStatus } from '../../shared/types';

interface Props {
  indexStatus: IndexStatus;
  documentCount: number;
}

const statusColor = (status: IndexStatus['status']): string => {
  switch (status) {
    case 'ready': return '#4caf7d';
    case 'indexing': return '#d4a929';
    case 'error': return '#e05252';
    default: return '#888';
  }
};

const s = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '0 16px',
    height: 28,
    background: '#1a1a1a',
    borderTop: '1px solid #2a2a2a',
    fontSize: 12,
    color: '#666',
    flexShrink: 0,
  },
  dot: (status: IndexStatus['status']): React.CSSProperties => ({
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: statusColor(status),
    display: 'inline-block',
    marginRight: 5,
  }),
};

export function StatusBar({ indexStatus, documentCount }: Props) {
  return (
    <div style={s.bar}>
      <span>
        <span style={s.dot(indexStatus.status)} />
        Status: {indexStatus.status}
      </span>
      <span>Documents: {documentCount}</span>
      {indexStatus.lastActivity && (
        <span>Last activity: {new Date(indexStatus.lastActivity).toLocaleTimeString()}</span>
      )}
    </div>
  );
}
