import { Response } from 'express';
import { getDb, uuidv4 } from '../db/database';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const businessId = req.user?.businessId;
    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const category = (req.query.category as string) || '';
    const stockStatus = (req.query.stockStatus as string) || '';
    const db = await getDb();

    const result = await db.query(
      `SELECT id, name, category, sku, price, cost_price, stock_quantity, low_stock_threshold, created_at, updated_at
       FROM products
       WHERE business_id = $1
       ORDER BY name ASC`,
      [businessId]
    );

    let products = result.rows;

    // Apply category filter
    if (category && category !== 'All') {
      products = products.filter((p: any) => p.category?.toLowerCase() === category.toLowerCase());
    }

    // Apply stockStatus filter
    if (stockStatus === 'low') {
      products = products.filter((p: any) => Number(p.stock_quantity) > 0 && Number(p.stock_quantity) <= Number(p.low_stock_threshold));
    } else if (stockStatus === 'out') {
      products = products.filter((p: any) => Number(p.stock_quantity) <= 0);
    } else if (stockStatus === 'in_stock') {
      products = products.filter((p: any) => Number(p.stock_quantity) > Number(p.low_stock_threshold));
    }

    // Apply search filter
    if (search) {
      products = products.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(search) ||
          p.sku?.toLowerCase().includes(search) ||
          p.category?.toLowerCase().includes(search)
      );
    }

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product catalog.',
    });
  }
}

export async function getProductById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const businessId = req.user?.businessId;
    const db = await getDb();

    const result = await db.query(
      `SELECT id, name, category, sku, price, cost_price, stock_quantity, low_stock_threshold, created_at, updated_at
       FROM products
       WHERE id = $1 AND business_id = $2`,
      [id, businessId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Get product by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product detail.',
    });
  }
}

export async function createProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const businessId = req.user?.businessId;
    const { name, category, sku, price, costPrice, stockQuantity, lowStockThreshold } = req.body;

    if (!name || !category || price === undefined) {
      res.status(400).json({
        success: false,
        message: 'Product name, category, and selling price are required.',
      });
      return;
    }

    const id = uuidv4();
    const db = await getDb();

    const priceNum = parseFloat(price) || 0;
    const costPriceNum = parseFloat(costPrice) || 0;
    const stockQtyNum = parseInt(stockQuantity, 10) || 0;
    const lowStockNum = parseInt(lowStockThreshold, 10) || 5;

    await db.query(
      `INSERT INTO products (id, business_id, name, category, sku, price, cost_price, stock_quantity, low_stock_threshold)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, businessId, name.trim(), category.trim(), sku?.trim() || '', priceNum, costPriceNum, stockQtyNum, lowStockNum]
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: {
        id,
        business_id: businessId,
        name: name.trim(),
        category: category.trim(),
        sku: sku?.trim() || '',
        price: priceNum,
        cost_price: costPriceNum,
        stock_quantity: stockQtyNum,
        low_stock_threshold: lowStockNum,
      },
    });
  } catch (error: any) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product.',
    });
  }
}

export async function updateProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const businessId = req.user?.businessId;
    const { name, category, sku, price, costPrice, stockQuantity, lowStockThreshold } = req.body;

    if (!name || !category || price === undefined) {
      res.status(400).json({
        success: false,
        message: 'Product name, category, and selling price are required.',
      });
      return;
    }

    const db = await getDb();
    const priceNum = parseFloat(price) || 0;
    const costPriceNum = parseFloat(costPrice) || 0;
    const stockQtyNum = parseInt(stockQuantity, 10) || 0;
    const lowStockNum = parseInt(lowStockThreshold, 10) || 5;

    await db.query(
      `UPDATE products
       SET name = $1, category = $2, sku = $3, price = $4, cost_price = $5, stock_quantity = $6, low_stock_threshold = $7
       WHERE id = $8 AND business_id = $9`,
      [name.trim(), category.trim(), sku?.trim() || '', priceNum, costPriceNum, stockQtyNum, lowStockNum, id, businessId]
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: {
        id,
        name: name.trim(),
        category: category.trim(),
        sku: sku?.trim() || '',
        price: priceNum,
        cost_price: costPriceNum,
        stock_quantity: stockQtyNum,
        low_stock_threshold: lowStockNum,
      },
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product.',
    });
  }
}

export async function deleteProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const businessId = req.user?.businessId;
    const db = await getDb();

    await db.query(
      `DELETE FROM products WHERE id = $1 AND business_id = $2`,
      [id, businessId]
    );

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully.',
    });
  } catch (error: any) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product.',
    });
  }
}

