import { Response } from 'express';
import { getDb } from '../db/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { isValidPhoneNumber } from '../utils/validators';

export async function getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const businessId = req.user?.businessId;
    const userId = req.user?.userId;
    const db = await getDb();

    const bizRes = await db.query(
      `SELECT id, name, currency, currency_symbol, phone, email, address, created_at
       FROM businesses
       WHERE id = $1`,
      [businessId]
    );

    const userRes = await db.query(
      `SELECT id, full_name, email, role, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (bizRes.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Business not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        business: bizRes.rows[0],
        user: userRes.rows[0] || null,
      },
    });
  } catch (error: any) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve business settings.',
    });
  }
}

export async function updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const businessId = req.user?.businessId;
    const { name, phone, address, currencySymbol } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Business name is required.',
      });
      return;
    }

    if (phone && !isValidPhoneNumber(phone)) {
      res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Please enter a valid number (e.g. 0300-1234567 or +923001234567).',
      });
      return;
    }

    const db = await getDb();
    await db.query(
      `UPDATE businesses
       SET name = $1, phone = $2, address = $3, currency = $4, currency_symbol = $5
       WHERE id = $6`,
      [name.trim(), phone?.trim() || '', address?.trim() || '', 'PKR', currencySymbol?.trim() || 'Rs', businessId]
    );

    res.status(200).json({
      success: true,
      message: 'Business settings updated successfully.',
      data: {
        id: businessId,
        name: name.trim(),
        phone: phone?.trim() || '',
        address: address?.trim() || '',
        currency: 'PKR',
        currencySymbol: currencySymbol?.trim() || 'Rs',
      },
    });
  } catch (error: any) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update business settings.',
    });
  }
}

