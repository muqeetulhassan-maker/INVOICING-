import { api } from './api';
import { Product } from '../types';

export const productService = {
  getProducts: async (filters?: { search?: string; category?: string; stockStatus?: string }) => {
    const res = await api.get<Product[]>('/products', filters);
    return res.data;
  },

  getProductById: async (id: string) => {
    const res = await api.get<Product>(`/products/${id}`);
    return res.data;
  },

  createProduct: async (productData: {
    name: string;
    category: string;
    sku?: string;
    price: number;
    costPrice?: number;
    stockQuantity: number;
    lowStockThreshold?: number;
  }) => {
    const res = await api.post<Product>('/products', productData);
    return res.data;
  },

  updateProduct: async (
    id: string,
    productData: {
      name: string;
      category: string;
      sku?: string;
      price: number;
      costPrice?: number;
      stockQuantity: number;
      lowStockThreshold?: number;
    }
  ) => {
    const res = await api.put<Product>(`/products/${id}`, productData);
    return res.data;
  },

  deleteProduct: async (id: string) => {
    const res = await api.delete(`/products/${id}`);
    return res;
  },
};

