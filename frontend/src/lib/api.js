import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-forwarded-proto': 'https'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email) => api.post('/auth/login', { providerCode: 'dummy', email }),
  me: () => api.get('/auth/me')
};

export const profileAPI = {
  get: () => api.get('/me/profile'),
  create: (data) => api.post('/me/profile', data),
  update: (data) => api.put('/me/profile', data),
  delete: () => api.delete('/me/profile')
};

export const skillsAPI = {
  list: () => api.get('/me/skills'),
  create: (data) => api.post('/me/skills', data),
  update: (id, data) => api.put(`/me/skills/${id}`, data),
  delete: (id) => api.delete(`/me/skills/${id}`)
};

export const teamsAPI = {
  list: () => api.get('/teams'),
  get: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post('/teams', data),
  getMembers: (id) => api.get(`/teams/${id}/members`),
  addMember: (id, data) => api.post(`/teams/${id}/members`, data),
  updateMember: (id, user, data) => api.put(`/teams/${id}/members/${encodeURIComponent(user)}`, data),
  removeMember: (id, user) => api.delete(`/teams/${id}/members/${encodeURIComponent(user)}`)
};

export const projectsAPI = {
  list: (teamId) => api.get(`/teams/${teamId}/projects`),
  get: (teamId, projectId) => api.get(`/teams/${teamId}/projects/${projectId}`),
  create: (teamId, data) => api.post(`/teams/${teamId}/projects`, data),
  update: (teamId, projectId, data) => api.put(`/teams/${teamId}/projects/${projectId}`, data),
  delete: (teamId, projectId) => api.delete(`/teams/${teamId}/projects/${projectId}`)
};

export const gapAPI = {
  analyze: (teamId, data) => api.post(`/teams/${teamId}/gap-analysis`, data)
};

export default api;