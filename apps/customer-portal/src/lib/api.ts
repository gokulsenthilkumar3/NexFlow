import axios from 'axios';
import { getPortalToken } from './auth';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
});

apiClient.interceptors.request.use((config) => {
  const token = getPortalToken();
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

export default apiClient;
