import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000'
});

export const getWards = () => api.get('/wards');

export const createWard = (payload) => api.post('/wards', payload);

export const setSignalsForWard = (wardId, payload) =>
  api.post(`/signals/${encodeURIComponent(wardId)}`, payload);

export const getSignalsForWard = (wardId) =>
  api.get(`/signals/${encodeURIComponent(wardId)}`);

export const simulatePolicy = (payload) => api.post('/simulate-policy', payload);

// User/Role APIs
export const createOrGetUser = (role, name) => api.post('/users', { role, name });

export const getUser = (userId) => api.get(`/users/${encodeURIComponent(userId)}`);

export const getUserData = (userId) => api.get(`/users/${encodeURIComponent(userId)}/data`);

export const saveUserData = (userId, payload) => 
  api.post(`/users/${encodeURIComponent(userId)}/data`, payload);

// Disease data APIs
export const addDiseaseData = (wardId, payload) =>
  api.post(`/disease-data/${encodeURIComponent(wardId)}`, payload);

export const getDiseaseData = (wardId) =>
  api.get(`/disease-data/${encodeURIComponent(wardId)}`);

// Operational view APIs
export const getAllAlerts = () => api.get('/all-alerts');

export default api;

