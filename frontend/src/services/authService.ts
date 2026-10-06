import { api } from './api';
import { User, Business } from '../types';

export interface AuthResponseData {
  token: string;
  user: User;
  business: Business;
}

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await api.post<AuthResponseData>('/auth/login', credentials);
    return res.data;
  },

  register: async (payload: {
    businessName: string;
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }) => {
    const res = await api.post<AuthResponseData>('/auth/register', payload);
    return res.data;
  },

  demoLogin: async () => {
    const res = await api.post<AuthResponseData>('/auth/demo-login');
    return res.data;
  },

  getMe: async () => {
    const res = await api.get<{ user: User; business: Business }>('/auth/me');
    return res.data;
  },
};

