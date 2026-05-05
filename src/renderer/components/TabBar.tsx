import React from 'react';
import { useAppStore } from '../store/app-store';

const methodClass = (m: string) => `method-${m.toLowerCase()}`;

export const TabBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, closeTab, addTab } = useAppStore();

  return (
    <div className="tabs-bar">
      {tabs.map((tab) => (
        <button key={tab.id}
          className={`tab ${tab.id === activeTabId ? 'tab--active' : ''}`}
          onClick={() => setActiveTab(tab.id)}>
          <span className={`tab__method ${methodClass(tab.request.method)}`}>
            {tab.request.method}
          </span>
          <span className="tab__name">{tab.request.name || 'Untitled'}</span>
          <span className="tab__close" onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}>✕</span>
        </button>
      ))}
      <button className="tab-add" onClick={() => addTab()}>+</button>
    </div>
  );
};
