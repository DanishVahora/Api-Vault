import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  ApiRequest,
  ApiResponse,
  Collection,
  Environment,
  HistoryEntry,
  HttpMethod,
  KeyValuePair,
} from '../../shared/types';

// ─── Helper to create an empty request ──────────────────────────────────────

export function createEmptyRequest(): ApiRequest {
  return {
    id: uuidv4(),
    name: 'New Request',
    method: 'GET',
    url: '',
    headers: [{ id: uuidv4(), key: '', value: '', enabled: true }],
    params: [{ id: uuidv4(), key: '', value: '', enabled: true }],
    body: '',
    bodyType: 'none',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createEmptyKV(): KeyValuePair {
  return { id: uuidv4(), key: '', value: '', enabled: true };
}

// ─── Tab model ──────────────────────────────────────────────────────────────

export interface Tab {
  id: string;
  request: ApiRequest;
  response: ApiResponse | null;
  isLoading: boolean;
  isDirty: boolean;
  collectionId?: string; // which collection this request belongs to
}

// ─── Store shape ────────────────────────────────────────────────────────────

interface AppStore {
  // Tabs
  tabs: Tab[];
  activeTabId: string | null;
  addTab: (request?: ApiRequest, collectionId?: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabRequest: (tabId: string, updates: Partial<ApiRequest>) => void;
  setTabResponse: (tabId: string, response: ApiResponse | null) => void;
  setTabLoading: (tabId: string, loading: boolean) => void;

  // Active request editing
  sendRequest: (tabId: string) => Promise<void>;

  // Collections
  collections: Collection[];
  setCollections: (collections: Collection[]) => void;
  addCollection: (name: string) => void;
  deleteCollection: (id: string) => void;
  addRequestToCollection: (collectionId: string, request: ApiRequest) => void;
  removeRequestFromCollection: (collectionId: string, requestId: string) => void;
  saveCollections: () => Promise<void>;

  // Environments
  environments: Environment[];
  activeEnvironmentId: string | null;
  setEnvironments: (environments: Environment[]) => void;
  setActiveEnvironment: (id: string | null) => void;
  addEnvironment: (name: string) => void;
  deleteEnvironment: (id: string) => void;
  updateEnvironment: (id: string, updates: Partial<Environment>) => void;
  saveEnvironments: () => Promise<void>;

  // History
  history: HistoryEntry[];
  setHistory: (history: HistoryEntry[]) => void;
  addToHistory: (request: ApiRequest, response: ApiResponse) => void;
  clearHistory: () => Promise<void>;

  // Sidebar
  sidebarView: 'collections' | 'history' | 'environments';
  setSidebarView: (view: 'collections' | 'history' | 'environments') => void;

  // Init
  initialize: () => Promise<void>;
}

// ─── Helper: substitute environment variables ───────────────────────────────

function substituteVars(text: string, vars: KeyValuePair[]): string {
  let result = text;
  vars
    .filter((v) => v.enabled && v.key)
    .forEach((v) => {
      result = result.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), v.value);
    });
  return result;
}

// ─── The store ──────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>((set, get) => ({
  // ─── Tabs ──────────────────────────────────────────────────────────────
  tabs: [],
  activeTabId: null,

  addTab: (request?: ApiRequest, collectionId?: string) => {
    const req = request || createEmptyRequest();
    const tab: Tab = {
      id: uuidv4(),
      request: { ...req },
      response: null,
      isLoading: false,
      isDirty: false,
      collectionId,
    };
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id,
    }));
  },

  closeTab: (tabId: string) => {
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== tabId);
      let newActiveId = state.activeTabId;
      if (state.activeTabId === tabId) {
        const idx = state.tabs.findIndex((t) => t.id === tabId);
        newActiveId = newTabs[Math.min(idx, newTabs.length - 1)]?.id || null;
      }
      return { tabs: newTabs, activeTabId: newActiveId };
    });
  },

  setActiveTab: (tabId: string) => {
    set({ activeTabId: tabId });
  },

  updateTabRequest: (tabId: string, updates: Partial<ApiRequest>) => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId
          ? { ...t, request: { ...t.request, ...updates, updatedAt: Date.now() }, isDirty: true }
          : t,
      ),
    }));
  },

  setTabResponse: (tabId: string, response: ApiResponse | null) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, response } : t)),
    }));
  },

  setTabLoading: (tabId: string, loading: boolean) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, isLoading: loading } : t)),
    }));
  },

  // ─── Send request ─────────────────────────────────────────────────────
  sendRequest: async (tabId: string) => {
    const state = get();
    const tab = state.tabs.find((t) => t.id === tabId);
    if (!tab) return;

    // Get environment variables
    const env = state.environments.find((e) => e.id === state.activeEnvironmentId);
    const vars = env?.variables || [];

    // Substitute variables in URL and body
    const request: ApiRequest = {
      ...tab.request,
      url: substituteVars(tab.request.url, vars),
      body: substituteVars(tab.request.body, vars),
      headers: tab.request.headers.map((h) => ({
        ...h,
        key: substituteVars(h.key, vars),
        value: substituteVars(h.value, vars),
      })),
      params: tab.request.params.map((p) => ({
        ...p,
        key: substituteVars(p.key, vars),
        value: substituteVars(p.value, vars),
      })),
    };

    get().setTabLoading(tabId, true);
    get().setTabResponse(tabId, null);

    try {
      const response = await window.electronAPI.sendRequest(request);
      get().setTabResponse(tabId, response);
      get().addToHistory(tab.request, response);
    } catch (err: unknown) {
      get().setTabResponse(tabId, {
        status: 0,
        statusText: 'Error',
        headers: {},
        body: err instanceof Error ? err.message : String(err),
        size: 0,
        time: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      get().setTabLoading(tabId, false);
    }
  },

  // ─── Collections ─────────────────────────────────────────────────────
  collections: [],
  setCollections: (collections) => set({ collections }),

  addCollection: (name: string) => {
    const newCollection: Collection = {
      id: uuidv4(),
      name,
      description: '',
      requests: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({ collections: [...state.collections, newCollection] }));
    get().saveCollections();
  },

  deleteCollection: (id: string) => {
    set((state) => ({
      collections: state.collections.filter((c) => c.id !== id),
    }));
    get().saveCollections();
  },

  addRequestToCollection: (collectionId: string, request: ApiRequest) => {
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collectionId
          ? { ...c, requests: [...c.requests, request], updatedAt: Date.now() }
          : c,
      ),
    }));
    get().saveCollections();
  },

  removeRequestFromCollection: (collectionId: string, requestId: string) => {
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collectionId
          ? { ...c, requests: c.requests.filter((r) => r.id !== requestId), updatedAt: Date.now() }
          : c,
      ),
    }));
    get().saveCollections();
  },

  saveCollections: async () => {
    await window.electronAPI.saveCollections(get().collections);
  },

  // ─── Environments ─────────────────────────────────────────────────────
  environments: [],
  activeEnvironmentId: null,
  setEnvironments: (environments) => set({ environments }),
  setActiveEnvironment: (id) => set({ activeEnvironmentId: id }),

  addEnvironment: (name: string) => {
    const newEnv: Environment = {
      id: uuidv4(),
      name,
      variables: [{ id: uuidv4(), key: '', value: '', enabled: true }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({ environments: [...state.environments, newEnv] }));
    get().saveEnvironments();
  },

  deleteEnvironment: (id: string) => {
    set((state) => ({
      environments: state.environments.filter((e) => e.id !== id),
      activeEnvironmentId: state.activeEnvironmentId === id ? null : state.activeEnvironmentId,
    }));
    get().saveEnvironments();
  },

  updateEnvironment: (id: string, updates: Partial<Environment>) => {
    set((state) => ({
      environments: state.environments.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e,
      ),
    }));
    get().saveEnvironments();
  },

  saveEnvironments: async () => {
    await window.electronAPI.saveEnvironments(get().environments);
  },

  // ─── History ──────────────────────────────────────────────────────────
  history: [],
  setHistory: (history) => set({ history }),

  addToHistory: (request: ApiRequest, response: ApiResponse) => {
    const entry: HistoryEntry = {
      id: uuidv4(),
      request,
      response,
      timestamp: Date.now(),
    };
    set((state) => ({
      history: [entry, ...state.history].slice(0, 100), // Keep last 100
    }));
    window.electronAPI.saveHistory(get().history);
  },

  clearHistory: async () => {
    set({ history: [] });
    await window.electronAPI.clearHistory();
  },

  // ─── Sidebar ──────────────────────────────────────────────────────────
  sidebarView: 'collections',
  setSidebarView: (view) => set({ sidebarView: view }),

  // ─── Initialize ───────────────────────────────────────────────────────
  initialize: async () => {
    const state = await window.electronAPI.getAppState();
    set({
      collections: state.collections,
      environments: state.environments,
      history: state.history,
      activeEnvironmentId: state.activeEnvironmentId,
    });
    // Open an initial tab
    get().addTab();
  },
}));
