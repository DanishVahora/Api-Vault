import React, { useState } from 'react';
import { useAppStore, createEmptyKV } from '../store/app-store';
import type { HttpMethod } from '../../shared/types';

const methodClass = (m: string) => `method-${m.toLowerCase()}`;

const PromptModal: React.FC<{ title: string; onConfirm: (val: string) => void; onCancel: () => void }> = ({ title, onConfirm, onCancel }) => {
  const [value, setValue] = useState('');
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__title">{title}</div>
        <input className="modal__input" autoFocus value={value} onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) onConfirm(value.trim()); }}
          placeholder="Enter name..." />
        <div className="modal__actions">
          <button className="modal__btn modal__btn--secondary" onClick={onCancel}>Cancel</button>
          <button className="modal__btn modal__btn--primary" onClick={() => value.trim() && onConfirm(value.trim())}>Create</button>
        </div>
      </div>
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const { sidebarView, setSidebarView, collections, history, environments,
    addCollection, deleteCollection, addTab, addEnvironment, deleteEnvironment,
    updateEnvironment, clearHistory } = useAppStore();
  const [modal, setModal] = useState<'collection' | 'environment' | null>(null);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());

  const toggleCollection = (id: string) => {
    setExpandedCollections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="sidebar">
      <div className="sidebar__nav">
        {(['collections', 'history', 'environments'] as const).map((view) => (
          <button key={view} className={`sidebar__nav-btn ${sidebarView === view ? 'sidebar__nav-btn--active' : ''}`}
            onClick={() => setSidebarView(view)}>
            {view === 'collections' ? '📁' : view === 'history' ? '🕐' : '🌐'} {view}
          </button>
        ))}
      </div>
      <div className="sidebar__content">
        {sidebarView === 'collections' && (
          <>
            <div className="sidebar__header">
              <span className="sidebar__title">Collections</span>
              <button className="sidebar__add-btn" onClick={() => setModal('collection')}>+</button>
            </div>
            {collections.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                No collections yet. Create one to organize your requests.
              </div>
            )}
            {collections.map((col) => (
              <div key={col.id} className="collection-item">
                <button className="collection-item__header" onClick={() => toggleCollection(col.id)}>
                  <span className={`collection-item__chevron ${expandedCollections.has(col.id) ? 'collection-item__chevron--open' : ''}`}>▶</span>
                  <span className="collection-item__icon">📁</span>
                  <span className="collection-item__name">{col.name}</span>
                  <span className="collection-item__count">{col.requests.length}</span>
                  <span className="collection-item__delete" onClick={(e) => { e.stopPropagation(); deleteCollection(col.id); }}>✕</span>
                </button>
                {expandedCollections.has(col.id) && (
                  <div className="collection-item__requests">
                    {col.requests.map((req) => (
                      <button key={req.id} className="request-item" onClick={() => addTab(req, col.id)}>
                        <span className={`request-item__method ${methodClass(req.method)}`}>{req.method}</span>
                        <span className="request-item__name">{req.name}</span>
                      </button>
                    ))}
                    {col.requests.length === 0 && (
                      <div style={{ padding: '8px 4px', fontSize: 11, color: 'var(--text-muted)' }}>
                        Empty collection
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
        {sidebarView === 'history' && (
          <>
            <div className="sidebar__header">
              <span className="sidebar__title">History</span>
              {history.length > 0 && (
                <button className="sidebar__add-btn" onClick={() => clearHistory()} title="Clear history" style={{ fontSize: 11 }}>🗑</button>
              )}
            </div>
            {history.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                No history yet. Send a request to see it here.
              </div>
            )}
            {history.map((entry) => (
              <button key={entry.id} className="history-item" onClick={() => addTab(entry.request)}>
                <span className={`request-item__method ${methodClass(entry.request.method)}`}>{entry.request.method}</span>
                <div className="history-item__info">
                  <div className="history-item__url">{entry.request.url}</div>
                  <div className="history-item__meta">
                    <span className={`history-item__status status-${Math.floor(entry.response.status / 100)}xx`}>
                      {entry.response.status}
                    </span>
                    <span className="history-item__time">{entry.response.time}ms</span>
                    <span className="history-item__time">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </button>
            ))}
          </>
        )}
        {sidebarView === 'environments' && (
          <>
            <div className="sidebar__header">
              <span className="sidebar__title">Environments</span>
              <button className="sidebar__add-btn" onClick={() => setModal('environment')}>+</button>
            </div>
            {environments.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                No environments yet. Create one to use variables like {'{{base_url}}'}.
              </div>
            )}
            {environments.map((env) => (
              <div key={env.id} className="env-item">
                <div className="env-item__header">
                  <span>{env.name}</span>
                  <div className="env-item__actions">
                    <button className="collection-item__delete" style={{ opacity: 1 }}
                      onClick={() => deleteEnvironment(env.id)}>✕</button>
                  </div>
                </div>
                <div className="env-item__vars">
                  {env.variables.map((v, i) => (
                    <div key={v.id} className="kv-row" style={{ marginBottom: 4 }}>
                      <input className="kv-row__input" placeholder="KEY" value={v.key}
                        onChange={(e) => {
                          const vars = [...env.variables];
                          vars[i] = { ...vars[i], key: e.target.value };
                          updateEnvironment(env.id, { variables: vars });
                        }} />
                      <input className="kv-row__input" placeholder="VALUE" value={v.value}
                        onChange={(e) => {
                          const vars = [...env.variables];
                          vars[i] = { ...vars[i], value: e.target.value };
                          updateEnvironment(env.id, { variables: vars });
                        }} />
                      <button className="kv-row__delete" onClick={() => {
                        const vars = env.variables.filter((_, idx) => idx !== i);
                        updateEnvironment(env.id, { variables: vars });
                      }}>✕</button>
                    </div>
                  ))}
                  <button className="kv-add" onClick={() => {
                    updateEnvironment(env.id, { variables: [...env.variables, createEmptyKV()] });
                  }}>+ Add Variable</button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      {modal === 'collection' && (
        <PromptModal title="New Collection" onCancel={() => setModal(null)}
          onConfirm={(name) => { addCollection(name); setModal(null); }} />
      )}
      {modal === 'environment' && (
        <PromptModal title="New Environment" onCancel={() => setModal(null)}
          onConfirm={(name) => { addEnvironment(name); setModal(null); }} />
      )}
    </div>
  );
};
