import { Response } from 'express';
import { getDb, uuidv4 } from '../db/database';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getSales(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const businessId = req.user?.businessId;
    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const status = (req.query.status as string) || '';
    const customerId = (req.query.customerId as string) || '';
    const db = await getDb();

    const result = await db.query(
      `SELECT s.id, s.sale_number, s.customer_id, s.total_amount, s.discount_amount, s.status, s.notes, s.created_at
       FROM sales s
       WHERE s.business_id = $1
       ORDER BY s.created_at DESC`,
      [businessId]
    );

    let sales = result.rows;

    // Apply customer filter
    if (customerId) {
      sales = sales.filter((s: any) => s.customer_id === customerId);
    }

    // Apply status filter
    if (status && status !== 'all') {
      sales = sales.filter((s: any) => s.status?.toLowerCase() === status.toLowerCase());
    }

    // Apply search filter (sale number, customer name)
    if (search) {
      sales = sales.filter(
        (s: any) =>
          s.sale_number?.toLowerCase().includes(search) ||
          s.customer_name?.toLowerCase().includes(search)
      );
    }

    res.status(200).json({
      success: true,
      data: sales,
    });
  } catch (error: any) {
    console.error('Get sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales history.',
    });
  }
}

export async function getSaleById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const businessId = req.user?.businessId;
    const db = await getDb();

    const saleRes = await db.query(
      `SELECT s.id, s.sale_number, s.customer_id, s.total_amount, s.discount_amount, s.status, s.notes, s.created_at,
              b.name as business_name, b.phone as business_phone, b.email as business_email, b.address as business_address, b.currency_symbol,
              c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address
       FROM sales s
       JOIN businesses b ON s.business_id = b.id
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.id = $1 AND s.business_id = $2`,
      [id, businessId]
    );

    if (saleRes.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Sale record not found.',
      });
      return;
    }

    const sale = saleRes.rows[0];

    // Fetch sale items
    const itemsRes = await db.query(
      `SELECT id, product_id, product_name, quantity, unit_price, subtotal
       FROM sale_items
       WHERE sale_id = $1`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        ...sale,
        items: itemsRes.rows,
      },
    });
  } catch (error: any) {
    console.error('Get sale detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sale details.',
    });
  }
}

export async function createSale(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const businessId = req.user?.businessId;
    const { customerId, items, discountAmount, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'A sale must contain at least one product line item.',
      });
      return;
    }

    const db = await getDb();

    // 1. Validate stock for every item before executing
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid item specification. Valid product and positive quantity required.',
        });
        return;
      }

      const prodRes = await db.query(
        `SELECT id, name, price, stock_quantity
         FROM products
         WHERE id = $1 AND business_id = $2`,
        [item.productId, businessId]
      );

      if (prodRes.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: `Product not found: ${item.productName || item.productId}`,
        });
        return;
      }

      const product = prodRes.rows[0];
      if (product.stock_quantity < item.quantity) {
        res.status(400).json({
          success: false,
          message: `Insufficient inventory for "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}.`,
        });
        return;
      }
    }

    // 2. Generate Sale Number (e.g. INV-1025)
    const countRes = await db.query(
      `SELECT COUNT(id) as count FROM sales WHERE business_id = $1`,
      [businessId]
    );
    const orderIndex = parseInt(countRes.rows[0]?.count || '0', 10) + 1025;
    const saleNumber = `INV-${orderIndex}`;

    // 3. Calculate Totals
    let subtotal = 0;
    const sanitizedItems: Array<{
      id: string;
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }> = [];

    for (const item of items) {
      const prodRes = await db.query(
        `SELECT name, price, stock_quantity FROM products WHERE id = $1 AND business_id = $2`,
        [item.productId, businessId]
      );
      if (prodRes.rows.length === 0) {
        throw new Error(`Product not found or unauthorized: ${item.productId}`);
      }
      const prod = prodRes.rows[0];
      const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : Number(prod.price);
      const itemSubtotal = Math.round((unitPrice * Number(item.quantity) + Number.EPSILON) * 100) / 100;
      subtotal += itemSubtotal;

      sanitizedItems.push({
        id: uuidv4(),
        productId: item.productId,
        productName: prod?.name || item.productName || 'Product',
        quantity: Number(item.quantity),
        unitPrice,
        subtotal: itemSubtotal,
      });
    }

    const discount = Math.max(0, Math.round((Number(discountAmount || 0) + Number.EPSILON) * 100) / 100);
    const totalAmount = Math.max(0, Math.round((subtotal - discount + Number.EPSILON) * 100) / 100);
    const saleId = uuidv4();
    const now = new Date().toISOString();

    // 4. Execute atomic transaction (Sale creation + Items insertion + Stock deduction)
    await db.transaction(async (tx) => {
      // Insert Sale
      await tx.query(
        `INSERT INTO sales (id, sale_number, business_id, customer_id, total_amount, discount_amount, status, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [saleId, saleNumber, businessId, customerId || null, totalAmount, discount, 'completed', notes || '', now]
      );

      // Insert Items and decrement stock with atomic guard
      for (const item of sanitizedItems) {
        await tx.query(
          `INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, unit_price, subtotal, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [item.id, saleId, item.productId, item.productName, item.quantity, item.unitPrice, item.subtotal, now]
        );

        // Atomic inventory reduction with concurrency boundary check
        await tx.query(
          `UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND business_id = $3`,
          [item.quantity, item.productId, businessId]
        );
      }
    });

    res.status(201).json({
      success: true,
      message: `Sale ${saleNumber} created successfully! Inventory updated.`,
      data: {
        id: saleId,
        saleNumber,
        customerId,
        totalAmount,
        discountAmount: discount,
        subtotal,
        status: 'completed',
        notes,
        items: sanitizedItems,
        createdAt: now,
      },
    });
  } catch (error: any) {
    console.error('Create sale error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete sale.',
    });
  }
}

