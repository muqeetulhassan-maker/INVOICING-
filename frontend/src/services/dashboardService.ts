import { api } from './api';
import { DashboardData } from '../types';

export const dashboardService = {
  getDashboardData: async (timeRange: '7d' | '30d' | '3m' | '12m' = '30d') => {
    const res = await api.get<DashboardData>('/dashboard', { range: timeRange });
    return res.data;
  },
};

