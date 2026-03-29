import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const createTicket = (name, user_photo) => api.post('/tickets/', { name, user_photo });
export const batchTickets = (count) => api.post('/batch-tickets/', { count });
export const callNextTicket = (counterId) => api.post(`/counters/${counterId}/call/`);
export const completeTicket = (ticketId) => api.post(`/tickets/${ticketId}/complete/`);
export const getActiveSystem = () => api.get('/system/active/');
export const getDashboardAnalytics = () => api.get('/dashboard/');
export const logCrowdData = (face_count) => api.post('/crowd/', { face_count });

export default api;
