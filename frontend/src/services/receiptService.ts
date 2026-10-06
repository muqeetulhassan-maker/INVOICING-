import { api } from './api';
import { ScannedReceipt } from '../types';


export const receiptService = {
  /**
   * Scans a receipt image using backend Gemini Flash Vision
   */
  async scanReceipt(imageBase64: string, mimeType?: string): Promise<ScannedReceipt> {
    const response = await api.post<ScannedReceipt>(
      '/receipts/scan',
      {
        imageBase64,
        mimeType: mimeType || 'image/jpeg',
      }
    );
    // Returns the unwrapped data object
    return (response.data as any)?.data || response.data;
  },
};

