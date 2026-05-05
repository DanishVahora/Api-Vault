import React, { useEffect } from 'react';
import { useAppStore } from '../store/app-store';
import { TitleBar } from './TitleBar';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';
import { RequestPanel } from './RequestPanel';
import { ResponsePanel } from './ResponsePanel';

export const App: React.FC = () => {
  const initialize = useAppStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <div className="app-layout">
      <TitleBar />
      <div className="app-body">
        <Sidebar />
        <div className="work-area">
          <TabBar />
          <div className="main-content">
            <RequestPanel />
            <ResponsePanel />
          </div>
        </div>
      </div>
    </div>
  );
};
