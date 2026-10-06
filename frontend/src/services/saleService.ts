import { api } from './api';
import { Sale } from '../types';

export interface CreateSalePayload {
  customerId?: string;
  items: Array<{
    productId: string;
    productName?: string;
    quantity: number;
    unitPrice: number;
  }>;
  discountAmount?: number;
  notes?: string;
}

export const saleService = {
  getSales: async (filters?: { search?: string; status?: string; customerId?: string }) => {
    const res = await api.get<Sale[]>('/sales', filters);
    return res.data;
  },

  getSaleById: async (id: string) => {
    const res = await api.get<Sale>(`/sales/${id}`);
    return res.data;
  },

  createSale: async (payload: CreateSalePayload) => {
    const res = await api.post<Sale>('/sales', payload);
    return res.data;
  },
};

