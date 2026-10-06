import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ReceiptScannerService } from '../services/receiptScannerService';

export async function scanReceipt(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Image data (base64) is required to scan receipt.',
      });
      return;
    }

    // Call Gemini Receipt Scanner Service
    const extractedData = await ReceiptScannerService.scanReceipt(imageBase64, mimeType);

    res.status(200).json({
      success: true,
      message: 'Receipt parsed and categorized successfully with Gemini Flash AI.',
      data: extractedData,
    });
  } catch (error: any) {
    console.error('Receipt Scan Controller Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze receipt image.',
    });
  }
}

