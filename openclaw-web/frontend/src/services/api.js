import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  status: () => api.get('/auth/status'),
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/password', { currentPassword, newPassword }),
};

// Config
export const configApi = {
  get: () => api.get('/config'),
  update: (config) => api.put('/config', { config }),
  validate: (config) => api.post('/config/validate', { config }),
  backup: () => api.post('/config/backup'),
  listBackups: () => api.get('/config/backups'),
  restore: (backupName) => api.post(`/config/restore/${backupName}`),
  getEnv: () => api.get('/config/env'),
  setEnv: (key, value) => api.put(`/config/env/${key}`, { value }),
};

// Process
export const processApi = {
  getStatus: () => api.get('/process/status'),
  start: () => api.post('/process/start'),
  stop: () => api.post('/process/stop'),
  restart: () => api.post('/process/restart'),
  getLogs: (lines) => api.get(`/process/logs?lines=${lines || 100}`),
  getMetrics: () => api.get('/process/metrics'),
  test: () => api.get('/process/test'),
};

// Status
export const statusApi = {
  get: () => api.get('/status'),
  stream: () => new EventSource(`${API_BASE}/status/stream`),
};

// Logs
export const logsApi = {
  get: (lines) => api.get(`/logs?lines=${lines || 100}`),
  stream: () => new EventSource(`${API_BASE}/logs/stream`),
};

// Skills
export const skillsApi = {
  list: () => api.get('/skills'),
  get: (name) => api.get(`/skills/${name}`),
  update: (name, data) => api.put(`/skills/${name}`, data),
  reload: () => api.post('/skills/reload'),
  marketplace: () => api.get('/skills/marketplace/list'),
};

// Providers
export const providersApi = {
  list: () => api.get('/providers'),
  get: (id) => api.get(`/providers/${id}`),
  create: (data) => api.post('/providers', data),
  update: (id, data) => api.put(`/providers/${id}`, data),
  delete: (id) => api.delete(`/providers/${id}`),
  test: (id) => api.post(`/providers/${id}/test`),
  getTypes: () => api.get('/providers/types'),
};

// Channels
export const channelsApi = {
  list: () => api.get('/channels'),
  get: (id) => api.get(`/channels/${id}`),
  create: (data) => api.post('/channels', data),
  update: (id, data) => api.put(`/channels/${id}`, data),
  delete: (id) => api.delete(`/channels/${id}`),
  enable: (id) => api.post(`/channels/${id}/enable`),
  disable: (id) => api.post(`/channels/${id}/disable`),
  getTypes: () => api.get('/channels/types'),
};

// Chat
export const chatApi = {
  getChannels: () => api.get('/chat/channels'),
  getMessages: (channelId, limit) =>
    api.get(`/chat/messages/${channelId}?limit=${limit || 50}`),
  sendMessage: (channelId, message) =>
    api.post(`/chat/messages/${channelId}`, { message }),
  deleteMessage: (channelId, messageId) =>
    api.delete(`/chat/messages/${channelId}/${messageId}`),
  stream: (channelId) => new EventSource(`${API_BASE}/chat/stream/${channelId}`),
};

// System
export const systemApi = {
  info: () => api.get('/system/info'),
  network: () => api.get('/system/network'),
  metrics: () => api.get('/system/metrics'),
  health: () => api.get('/system/health'),
  paths: () => api.get('/system/paths'),
};

export default api;
