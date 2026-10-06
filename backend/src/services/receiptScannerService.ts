import https from 'https';
import { config } from '../config/env';

export interface ScannedReceiptResult {
  vendor: string;
  date: string;
  amount: number;
  tax_amount: number;
  category: string;
  notes: string;
  currency: string;
  detected_items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  confidence: number;
}

export class ReceiptScannerService {
  /**
   * Scans a receipt image using Google Gemini Multimodal Flash (Free Tier)
   */
  public static async scanReceipt(
    base64DataUrl: string,
    mimeType: string = 'image/jpeg'
  ): Promise<ScannedReceiptResult> {
    // 1. Clean base64 string
    let cleanBase64 = base64DataUrl;
    if (base64DataUrl.includes(';base64,')) {
      const parts = base64DataUrl.split(';base64,');
      cleanBase64 = parts[1];
      const match = parts[0].match(/data:(.*?);/);
      if (match && match[1]) {
        mimeType = match[1];
      }
    }

    if (!config.geminiApiKey) {
      throw new Error('Google Gemini API Key is missing in server environment configuration.');
    }

    const promptText = `
You are an expert AI accounting and business receipt analyzer.
Analyze the provided receipt/invoice image and accurately extract key business expense information.

Extract and return STRICT pure JSON matching this exact structure:
{
  "vendor": "Store/Merchant/Vendor Name (e.g. Metro Cash & Carry, Total Parco, PSO, Daraz)",
  "date": "YYYY-MM-DD (e.g. 2026-09-15. If year is missing assume 2026, if not readable use current date)",
  "amount": 0.00 (Total final amount paid as numeric float, e.g. 4500.00),
  "tax_amount": 0.00 (Tax or GST amount if itemized, else 0.00),
  "category": "One of: Rent, Utilities, Supplies, Marketing, Salaries, Maintenance, Travel, Other",
  "notes": "Brief summary of purchased goods or service",
  "currency": "PKR",
  "detected_items": [
    { "name": "Item description", "quantity": 1, "price": 0.00 }
  ],
  "confidence": 0.95
}

Guidelines:
- Amount MUST be the total final payable amount as a pure number.
- Categorize intelligently based on merchant and items (e.g. Fuel -> Travel, Stationery/Paper -> Supplies, Electricity/Water -> Utilities).
- Return ONLY valid JSON, without any markdown backticks or commentary.
`;

    // Try primary models supported by your free key
    const modelsToTry = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash'];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const responseJson = await this.callGeminiVision(model, cleanBase64, mimeType, promptText);
        if (responseJson) {
          const rootData = Array.isArray(responseJson) ? responseJson[0] : responseJson;
          return this.sanitizeReceiptResult(rootData);
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini Scanner] Attempt with model ${model} failed: ${err.message}. Trying next available model...`);
      }
    }

    throw new Error(`Receipt analysis failed: ${lastError?.message || 'Unable to parse receipt image.'}`);
  }

  private static callGeminiVision(
    model: string,
    base64Data: string,
    mimeType: string,
    prompt: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: base64Data,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const requestOptions: https.RequestOptions = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/${model}:generateContent?key=${config.geminiApiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 30000,
      };

      const req = https.request(requestOptions, (res) => {
        let rawBody = '';
        res.on('data', (chunk) => {
          rawBody += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            let errorMsg = `HTTP ${res.statusCode}`;
            try {
              const errParsed = JSON.parse(rawBody);
              errorMsg = errParsed.error?.message || errorMsg;
            } catch {
              errorMsg = rawBody || errorMsg;
            }
            return reject(new Error(errorMsg));
          }

          try {
            const apiRes = JSON.parse(rawBody);
            const candidate = apiRes.candidates?.[0];
            const textContent = candidate?.content?.parts?.[0]?.text;

            if (!textContent) {
              return reject(new Error('No textual response returned from Gemini.'));
            }

            // Clean markdown code blocks if any
            let cleanJsonStr = textContent.trim();
            if (cleanJsonStr.startsWith('```json')) {
              cleanJsonStr = cleanJsonStr.replace(/^```json\s*/, '').replace(/```$/, '').trim();
            } else if (cleanJsonStr.startsWith('```')) {
              cleanJsonStr = cleanJsonStr.replace(/^```\s*/, '').replace(/```$/, '').trim();
            }

            const parsed = JSON.parse(cleanJsonStr);
            resolve(parsed);
          } catch (e: any) {
            reject(new Error(`Failed to parse Gemini response as JSON: ${e.message}`));
          }
        });
      });


      req.on('error', (err) => {
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Gemini API request timed out after 30 seconds.'));
      });

      req.write(payload);
      req.end();
    });
  }

  private static sanitizeReceiptResult(data: any): ScannedReceiptResult {
    const today = new Date().toISOString().split('T')[0];

    // Standard category mapping
    const validCategories = ['Rent', 'Utilities', 'Supplies', 'Marketing', 'Salaries', 'Maintenance', 'Travel', 'Other'];
    let matchedCategory = 'Other';
    if (data.category) {
      const found = validCategories.find(
        (c) => c.toLowerCase() === String(data.category).toLowerCase().trim()
      );
      if (found) {
        matchedCategory = found;
      } else {
        // Keyword heuristics
        const lowerCat = String(data.category).toLowerCase();
        if (lowerCat.includes('fuel') || lowerCat.includes('petrol') || lowerCat.includes('cab') || lowerCat.includes('travel')) {
          matchedCategory = 'Travel';
        } else if (lowerCat.includes('suppl') || lowerCat.includes('station') || lowerCat.includes('paper') || lowerCat.includes('grocery')) {
          matchedCategory = 'Supplies';
        } else if (lowerCat.includes('util') || lowerCat.includes('elect') || lowerCat.includes('gas') || lowerCat.includes('bill')) {
          matchedCategory = 'Utilities';
        } else if (lowerCat.includes('ad') || lowerCat.includes('market') || lowerCat.includes('promo')) {
          matchedCategory = 'Marketing';
        } else if (lowerCat.includes('maint') || lowerCat.includes('repair')) {
          matchedCategory = 'Maintenance';
        }
      }
    }

    const amountNum = Math.abs(parseFloat(String(data.amount || '0')) || 0);
    const taxNum = Math.abs(parseFloat(String(data.tax_amount || '0')) || 0);

    return {
      vendor: data.vendor ? String(data.vendor).trim() : 'Unspecified Vendor',
      date: data.date && /^\d{4}-\d{2}-\d{2}$/.test(data.date) ? data.date : today,
      amount: Math.round((amountNum + Number.EPSILON) * 100) / 100,
      tax_amount: Math.round((taxNum + Number.EPSILON) * 100) / 100,
      category: matchedCategory,
      notes: data.notes ? String(data.notes).trim() : `Scanned receipt from ${data.vendor || 'merchant'}`,
      currency: 'PKR',
      detected_items: Array.isArray(data.detected_items)
        ? data.detected_items.map((i: any) => ({
            name: String(i.name || 'Item'),
            quantity: Number(i.quantity) || 1,
            price: Number(i.price) || 0,
          }))
        : [],
      confidence: typeof data.confidence === 'number' ? Math.min(1, Math.max(0, data.confidence)) : 0.9,
    };
  }
}

