import { api } from './api';
import { Business, User } from '../types';

export interface SettingsData {
  business: Business;
  user: User;
}

export const settingService = {
  getSettings: async () => {
    const res = await api.get<SettingsData>('/settings');
    return res.data;
  },

  updateSettings: async (settingsData: {
    name: string;
    phone?: string;
    address?: string;
    currencySymbol?: string;
  }) => {
    const res = await api.put<Business>('/settings', settingsData);
    return res.data;
  },
};

