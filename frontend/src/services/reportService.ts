import { api } from './api';
import { ReportsData } from '../types';

export const reportService = {
  getReports: async (period: 'weekly' | 'monthly' | 'yearly' = 'monthly') => {
    const res = await api.get<ReportsData>('/reports', { period });
    return res.data;
  },
};

