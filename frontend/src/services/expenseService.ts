import { api } from './api';
import { Expense } from '../types';

export interface ExpensesResponseData {
  expenses: Expense[];
  totalAmount: number;
  categories: string[];
}

export const expenseService = {
  getExpenses: async (filters?: { category?: string; search?: string; startDate?: string; endDate?: string }) => {
    const res = await api.get<ExpensesResponseData>('/expenses', filters);
    return res.data;
  },

  createExpense: async (expenseData: {
    category: string;
    amount: number;
    description?: string;
    date: string;
  }) => {
    const res = await api.post<Expense>('/expenses', expenseData);
    return res.data;
  },

  updateExpense: async (
    id: string,
    expenseData: {
      category: string;
      amount: number;
      description?: string;
      date: string;
    }
  ) => {
    const res = await api.put<Expense>(`/expenses/${id}`, expenseData);
    return res.data;
  },

  deleteExpense: async (id: string) => {
    const res = await api.delete(`/expenses/${id}`);
    return res;
  },
};

