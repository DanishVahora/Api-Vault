import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/app-store';

type ResponseTab = 'body' | 'headers';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function tryFormatJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function getStatusBadgeClass(status: number): string {
  if (status >= 200 && status < 300) return 'response-badge--success';
  if (status >= 300 && status < 400) return 'response-badge--redirect';
  return 'response-badge--error';
}

export const ResponsePanel: React.FC = () => {
  const { tabs, activeTabId } = useAppStore();
  const [activeTab, setActiveTab] = useState<ResponseTab>('body');

  const tab = tabs.find((t) => t.id === activeTabId);
  const response = tab?.response ?? null;

  // All hooks must be called before any early return
  const formattedBody = useMemo(
    () => (response?.body ? tryFormatJson(response.body) : ''),
    [response?.body],
  );
  const headerEntries = useMemo(
    () => (response?.headers ? Object.entries(response.headers) : []),
    [response?.headers],
  );

  if (!tab) return null;

  if (tab.isLoading) {
    return (
      <div className="response-section">
        <div className="loading-spinner">
          <div className="spinner" />
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sending request...</span>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="response-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 13 }}>
          Hit Send to get a response
        </div>
      </div>
    );
  }

  if (response.error) {
    return (
      <div className="response-section">
        <div className="response-header">
          <span className="response-header__label">Response</span>
          <span className="response-badge response-badge--error">Error</span>
        </div>
        <div className="response-body">
          <pre style={{ color: 'var(--red)' }}>{response.error}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="response-section">
      <div className="response-header">
        <span className="response-header__label">Response</span>
        <span className={`response-badge ${getStatusBadgeClass(response.status)}`}>
          {response.status} {response.statusText}
        </span>
        <span className="response-meta">{response.time}ms</span>
        <span className="response-meta">{formatBytes(response.size)}</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 0 }}>
          {(['body', 'headers'] as ResponseTab[]).map((t) => (
            <button key={t} className={`panel-tab ${activeTab === t ? 'panel-tab--active' : ''}`}
              onClick={() => setActiveTab(t)} style={{ fontSize: 11, padding: '4px 12px' }}>
              {t === 'body' ? 'Body' : `Headers (${headerEntries.length})`}
            </button>
          ))}
        </div>
      </div>
      <div className="response-body">
        {activeTab === 'body' && <pre>{formattedBody}</pre>}
        {activeTab === 'headers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {headerEntries.map(([key, value]) => (
              <div key={key} style={{ display: 'flex', gap: 12, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--accent)', minWidth: 180 }}>{key}</span>
                <span style={{ color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
