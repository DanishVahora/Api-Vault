import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import type { ApiRequest, Collection, Environment, HistoryEntry } from '../shared/types';
import { sendHttpRequest } from './http-service';
import * as store from './store';

export function registerIpcHandlers(): void {
  // ─── HTTP ──────────────────────────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.SEND_REQUEST, async (_event, apiRequest: ApiRequest) => {
    return sendHttpRequest(apiRequest);
  });

  // ─── Collections ───────────────────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.GET_COLLECTIONS, () => {
    return store.getCollections();
  });

  ipcMain.handle(IPC_CHANNELS.SAVE_COLLECTIONS, (_event, collections: Collection[]) => {
    store.saveCollections(collections);
    return true;
  });

  // ─── Environments ─────────────────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.GET_ENVIRONMENTS, () => {
    return store.getEnvironments();
  });

  ipcMain.handle(IPC_CHANNELS.SAVE_ENVIRONMENTS, (_event, environments: Environment[]) => {
    store.saveEnvironments(environments);
    return true;
  });

  // ─── History ──────────────────────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.GET_HISTORY, () => {
    return store.getHistory();
  });

  ipcMain.handle(IPC_CHANNELS.SAVE_HISTORY, (_event, history: HistoryEntry[]) => {
    store.saveHistory(history);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.CLEAR_HISTORY, () => {
    store.clearHistory();
    return true;
  });

  // ─── App State ────────────────────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.GET_APP_STATE, () => {
    return store.getAppState();
  });
}
