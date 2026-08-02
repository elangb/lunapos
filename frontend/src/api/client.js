import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const client = axios.create({ baseURL: '/api', timeout: 30000 });

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

/* helper: lempar error message bersih */
export const errMsg = (e) => e?.response?.data?.message || e?.message || 'Terjadi kesalahan';

export default client;
