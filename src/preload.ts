import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from './shared/types';
import type { ApiRequest, Collection, Environment, HistoryEntry, ApiResponse, AppState } from './shared/types';

const api = {
  // HTTP
  sendRequest: (request: ApiRequest): Promise<ApiResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.SEND_REQUEST, request),

  // Collections
  getCollections: (): Promise<Collection[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_COLLECTIONS),
  saveCollections: (collections: Collection[]): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.SAVE_COLLECTIONS, collections),

  // Environments
  getEnvironments: (): Promise<Environment[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_ENVIRONMENTS),
  saveEnvironments: (environments: Environment[]): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.SAVE_ENVIRONMENTS, environments),

  // History
  getHistory: (): Promise<HistoryEntry[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_HISTORY),
  saveHistory: (history: HistoryEntry[]): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.SAVE_HISTORY, history),
  clearHistory: (): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.CLEAR_HISTORY),

  // App State
  getAppState: (): Promise<AppState> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_APP_STATE),

  // Window controls
  minimizeWindow: (): void => ipcRenderer.send('window:minimize'),
  maximizeWindow: (): void => ipcRenderer.send('window:maximize'),
  closeWindow: (): void => ipcRenderer.send('window:close'),
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;
