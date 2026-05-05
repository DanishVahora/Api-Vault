// ─── Shared Types for API Vault ─────────────────────────────────────────────

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface ApiRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body: string;
  bodyType: 'none' | 'json' | 'text' | 'form-data';
  createdAt: number;
  updatedAt: number;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  size: number;
  time: number;
  error?: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  requests: ApiRequest[];
  createdAt: number;
  updatedAt: number;
}

export interface Environment {
  id: string;
  name: string;
  variables: KeyValuePair[];
  createdAt: number;
  updatedAt: number;
}

export interface HistoryEntry {
  id: string;
  request: ApiRequest;
  response: ApiResponse;
  timestamp: number;
}

export interface AppState {
  collections: Collection[];
  environments: Environment[];
  history: HistoryEntry[];
  activeEnvironmentId: string | null;
}

// ─── IPC Channels ───────────────────────────────────────────────────────────

export const IPC_CHANNELS = {
  // HTTP
  SEND_REQUEST: 'api:send-request',

  // Collections
  GET_COLLECTIONS: 'store:get-collections',
  SAVE_COLLECTIONS: 'store:save-collections',

  // Environments
  GET_ENVIRONMENTS: 'store:get-environments',
  SAVE_ENVIRONMENTS: 'store:save-environments',

  // History
  GET_HISTORY: 'store:get-history',
  SAVE_HISTORY: 'store:save-history',
  CLEAR_HISTORY: 'store:clear-history',

  // App
  GET_APP_STATE: 'store:get-app-state',
} as const;
