import axios from 'axios';

// Use environment variable in production, fall back to local dev server
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
});

export const getWards = () => api.get('/wards');

export const createWard = (payload) => api.post('/wards', payload);

export const setSignalsForWard = (wardId, payload) =>
  api.post(`/signals/${encodeURIComponent(wardId)}`, payload);

export const getSignalsForWard = (wardId) =>
  api.get(`/signals/${encodeURIComponent(wardId)}`);

export const simulatePolicy = (payload) => api.post('/simulate-policy', payload);

export const getSimulationHistory = () => api.get('/simulation-history');

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

// Analytics APIs
export const getAnalyticsOverview = () => api.get('/analytics/overview');

// Gemini AI alerts (frontend uses this helper; backend route can be wired separately)
export const getAIAlert = async (wardId) => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/ai-alerts/${wardId}`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch AI alert:', error);
    return null;
  }
};

export default api;

