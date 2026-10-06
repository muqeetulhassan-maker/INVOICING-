import { api } from './api';
import { Customer } from '../types';

export const customerService = {
  getCustomers: async (search?: string) => {
    const res = await api.get<Customer[]>('/customers', { search });
    return res.data;
  },

  getCustomerById: async (id: string) => {
    const res = await api.get<Customer>(`/customers/${id}`);
    return res.data;
  },

  createCustomer: async (customerData: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
  }) => {
    const res = await api.post<Customer>('/customers', customerData);
    return res.data;
  },

  updateCustomer: async (
    id: string,
    customerData: {
      name: string;
      phone: string;
      email?: string;
      address?: string;
    }
  ) => {
    const res = await api.put<Customer>(`/customers/${id}`, customerData);
    return res.data;
  },

  deleteCustomer: async (id: string) => {
    const res = await api.delete(`/customers/${id}`);
    return res;
  },
};

