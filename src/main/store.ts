import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import type { Collection, Environment, HistoryEntry, AppState } from '../shared/types';

interface StoreData {
  collections: Collection[];
  environments: Environment[];
  history: HistoryEntry[];
  activeEnvironmentId: string | null;
}

const defaults: StoreData = {
  collections: [],
  environments: [],
  history: [],
  activeEnvironmentId: null,
};

const storePath = path.join(app.getPath('userData'), 'api-vault-data.json');

function readStore(): StoreData {
  try {
    if (fs.existsSync(storePath)) {
      const raw = fs.readFileSync(storePath, 'utf-8');
      return { ...defaults, ...JSON.parse(raw) };
    }
  } catch {
    // If corrupt, return defaults
  }
  return { ...defaults };
}

function writeStore(data: StoreData): void {
  fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function getCollections(): Collection[] {
  return readStore().collections;
}

export function saveCollections(collections: Collection[]): void {
  const data = readStore();
  data.collections = collections;
  writeStore(data);
}

export function getEnvironments(): Environment[] {
  return readStore().environments;
}

export function saveEnvironments(environments: Environment[]): void {
  const data = readStore();
  data.environments = environments;
  writeStore(data);
}

export function getHistory(): HistoryEntry[] {
  return readStore().history;
}

export function saveHistory(history: HistoryEntry[]): void {
  const data = readStore();
  data.history = history;
  writeStore(data);
}

export function clearHistory(): void {
  const data = readStore();
  data.history = [];
  writeStore(data);
}

export function getAppState(): AppState {
  const data = readStore();
  return {
    collections: data.collections,
    environments: data.environments,
    history: data.history,
    activeEnvironmentId: data.activeEnvironmentId,
  };
}

export function setActiveEnvironment(id: string | null): void {
  const data = readStore();
  data.activeEnvironmentId = id;
  writeStore(data);
}
