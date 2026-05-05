import React, { useState } from 'react';
import { useAppStore } from '../store/app-store';
import { KeyValueEditor } from './KeyValueEditor';
import type { HttpMethod } from '../../shared/types';

type PanelTab = 'params' | 'headers' | 'body';
const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const BODY_TYPES = ['none', 'json', 'text', 'form-data'] as const;

export const RequestPanel: React.FC = () => {
  const { tabs, activeTabId, updateTabRequest, sendRequest, collections,
    addRequestToCollection, addCollection } = useAppStore();
  const [activePanel, setActivePanel] = useState<PanelTab>('params');
  const [saving, setSaving] = useState(false);

  const tab = tabs.find((t) => t.id === activeTabId);
  if (!tab) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">⚡</div>
        <div className="empty-state__text">Open a tab to start making requests</div>
      </div>
    );
  }

  const { request } = tab;

  const handleSend = () => {
    if (!request.url.trim()) return;
    sendRequest(tab.id);
  };

  const handleSaveToCollection = () => {
    if (collections.length === 0) {
      addCollection('Default');
    }
    const collectionId = tab.collectionId || collections[0]?.id;
    if (collectionId) {
      addRequestToCollection(collectionId, { ...request, name: request.name || request.url });
    }
    setSaving(true);
    setTimeout(() => setSaving(false), 1500);
  };

  return (
    <div className="request-panel">
      {/* URL Bar */}
      <div className="url-bar">
        <select className="url-bar__method-select" value={request.method}
          onChange={(e) => updateTabRequest(tab.id, { method: e.target.value as HttpMethod })}>
          {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <input className="url-bar__input" placeholder="https://api.example.com/endpoint"
          value={request.url}
          onChange={(e) => updateTabRequest(tab.id, { url: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }} />
        <button className="url-bar__send" onClick={handleSend} disabled={tab.isLoading || !request.url.trim()}>
          {tab.isLoading ? '⏳' : '▶'} Send
        </button>
        <button className="modal__btn modal__btn--secondary" onClick={handleSaveToCollection}
          style={{ padding: '8px 14px', fontSize: 12 }}>
          {saving ? '✓ Saved' : '💾 Save'}
        </button>
      </div>

      {/* Request name */}
      <div style={{ padding: '4px 16px' }}>
        <input style={{
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          fontSize: 12, outline: 'none', width: '100%', fontFamily: 'var(--font-sans)',
        }}
          placeholder="Request name (optional)"
          value={request.name === 'New Request' ? '' : request.name}
          onChange={(e) => updateTabRequest(tab.id, { name: e.target.value || 'New Request' })} />
      </div>

      {/* Panel tabs */}
      <div className="panel-tabs">
        {(['params', 'headers', 'body'] as PanelTab[]).map((p) => (
          <button key={p} className={`panel-tab ${activePanel === p ? 'panel-tab--active' : ''}`}
            onClick={() => setActivePanel(p)}>
            {p === 'params' ? `Params${request.params.filter(x => x.key).length ? ` (${request.params.filter(x => x.key).length})` : ''}` :
             p === 'headers' ? `Headers${request.headers.filter(x => x.key).length ? ` (${request.headers.filter(x => x.key).length})` : ''}` :
             'Body'}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="panel-content">
        {activePanel === 'params' && (
          <KeyValueEditor pairs={request.params}
            onChange={(params) => updateTabRequest(tab.id, { params })} />
        )}
        {activePanel === 'headers' && (
          <KeyValueEditor pairs={request.headers}
            onChange={(headers) => updateTabRequest(tab.id, { headers })} />
        )}
        {activePanel === 'body' && (
          <div className="body-editor">
            <div className="body-editor__type">
              {BODY_TYPES.map((bt) => (
                <button key={bt} className={`body-type-btn ${request.bodyType === bt ? 'body-type-btn--active' : ''}`}
                  onClick={() => updateTabRequest(tab.id, { bodyType: bt })}>
                  {bt}
                </button>
              ))}
            </div>
            {request.bodyType !== 'none' && (
              <textarea className="body-editor__textarea"
                placeholder={request.bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Enter request body...'}
                value={request.body}
                onChange={(e) => updateTabRequest(tab.id, { body: e.target.value })} />
            )}
            {request.bodyType === 'none' && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 16 }}>
                This request does not have a body.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
