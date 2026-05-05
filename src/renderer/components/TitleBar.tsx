import React from 'react';
import { useAppStore } from '../store/app-store';

export const TitleBar: React.FC = () => {
  const { environments, activeEnvironmentId, setActiveEnvironment } = useAppStore();

  return (
    <div className="titlebar">
      <div className="titlebar__brand">
        <div className="titlebar__logo">V</div>
        <span>API Vault</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <select
          className="env-selector"
          value={activeEnvironmentId || ''}
          onChange={(e) => setActiveEnvironment(e.target.value || null)}
        >
          <option value="">No Environment</option>
          {environments.map((env) => (
            <option key={env.id} value={env.id}>{env.name}</option>
          ))}
        </select>
      </div>
      <div className="titlebar__controls">
        <button className="titlebar__btn" onClick={() => window.electronAPI.minimizeWindow()}>─</button>
        <button className="titlebar__btn" onClick={() => window.electronAPI.maximizeWindow()}>□</button>
        <button className="titlebar__btn titlebar__btn--close" onClick={() => window.electronAPI.closeWindow()}>✕</button>
      </div>
    </div>
  );
};
