import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const transactionAPI = {
  create: (data) => api.post('/transactions', data),
  getAll: (params) => api.get('/transactions', { params }),
  getOne: (id) => api.get(`/transactions/${id}`),
  getStats: () => api.get('/transactions/stats'),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAllUsers: () => api.get('/admin/users'),
  getFraudLogs: (params) => api.get('/admin/fraud-logs', { params }),
  getAllTransactions: (params) => api.get('/admin/transactions', { params }),
};

export default api;
