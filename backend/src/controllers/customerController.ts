import { Response } from 'express';
import { getDb, uuidv4 } from '../db/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { isValidPhoneNumber } from '../utils/validators';

export async function getCustomers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const businessId = req.user?.businessId;
    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const db = await getDb();

    const result = await db.query(
      `SELECT id, name, phone, email, address, created_at, updated_at
       FROM customers
       WHERE business_id = $1
       ORDER BY created_at DESC`,
      [businessId]
    );

    let customers = result.rows;

    // Apply search filter if query provided
    if (search) {
      customers = customers.filter(
        (c: any) =>
          c.name?.toLowerCase().includes(search) ||
          c.phone?.toLowerCase().includes(search) ||
          c.email?.toLowerCase().includes(search)
      );
    }

    res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error: any) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer list.',
    });
  }
}

export async function getCustomerById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const businessId = req.user?.businessId;
    const db = await getDb();

    const custRes = await db.query(
      `SELECT id, name, phone, email, address, created_at, updated_at
       FROM customers
       WHERE id = $1 AND business_id = $2`,
      [id, businessId]
    );

    if (custRes.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
      return;
    }

    const customer = custRes.rows[0];

    // Fetch customer's sales history
    const salesRes = await db.query(
      `SELECT s.id, s.sale_number, s.total_amount, s.discount_amount, s.status, s.notes, s.created_at,
              (SELECT COUNT(si.id) FROM sale_items si WHERE si.sale_id = s.id) as item_count
       FROM sales s
       WHERE s.customer_id = $1 AND s.business_id = $2
       ORDER BY s.created_at DESC`,
      [id, businessId]
    );

    const sales = salesRes.rows;
    const totalSpent = sales.filter((s: any) => s.status === 'completed').reduce((sum: number, s: any) => sum + Number(s.total_amount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        ...customer,
        totalSpent,
        totalSales: sales.length,
        salesHistory: sales,
      },
    });
  } catch (error: any) {
    console.error('Get customer detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer details.',
    });
  }
}

export async function createCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const businessId = req.user?.businessId;
    const { name, phone, email, address } = req.body;

    if (!name || !phone) {
      res.status(400).json({
        success: false,
        message: 'Customer full name and phone number are required.',
      });
      return;
    }

    if (!isValidPhoneNumber(phone)) {
      res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Please enter a valid number (e.g. 0300-1234567 or +923001234567).',
      });
      return;
    }

    const id = uuidv4();
    const db = await getDb();

    await db.query(
      `INSERT INTO customers (id, business_id, name, phone, email, address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, businessId, name.trim(), phone.trim(), email?.trim() || '', address?.trim() || '']
    );

    res.status(201).json({
      success: true,
      message: 'Customer created successfully.',
      data: {
        id,
        business_id: businessId,
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || '',
        address: address?.trim() || '',
        created_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer.',
    });
  }
}

export async function updateCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const businessId = req.user?.businessId;
    const { name, phone, email, address } = req.body;

    if (!name || !phone) {
      res.status(400).json({
        success: false,
        message: 'Customer name and phone number are required.',
      });
      return;
    }

    if (!isValidPhoneNumber(phone)) {
      res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Please enter a valid number (e.g. 0300-1234567 or +923001234567).',
      });
      return;
    }

    const db = await getDb();
    await db.query(
      `UPDATE customers
       SET name = $1, phone = $2, email = $3, address = $4
       WHERE id = $5 AND business_id = $6`,
      [name.trim(), phone.trim(), email?.trim() || '', address?.trim() || '', id, businessId]
    );

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully.',
      data: { id, name, phone, email, address },
    });
  } catch (error: any) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer.',
    });
  }
}

export async function deleteCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const businessId = req.user?.businessId;
    const db = await getDb();

    await db.query(
      `DELETE FROM customers WHERE id = $1 AND business_id = $2`,
      [id, businessId]
    );

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully.',
    });
  } catch (error: any) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer.',
    });
  }
}

