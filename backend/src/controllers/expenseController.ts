import { Response } from 'express';
import { getDb, uuidv4 } from '../db/database';
import { AuthenticatedRequest } from '../middleware/auth';

const DEFAULT_CATEGORIES = [
  'Rent',
  'Utilities',
  'Supplies',
  'Transport',
  'Marketing',
  'Salary',
  'Maintenance',
  'Other',
];

export async function getExpenses(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const businessId = req.user?.businessId;
    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const category = (req.query.category as string) || '';
    const startDate = (req.query.startDate as string) || '';
    const endDate = (req.query.endDate as string) || '';
    const db = await getDb();

    const result = await db.query(
      `SELECT id, category, amount, description, date, created_at
       FROM expenses
       WHERE business_id = $1
       ORDER BY date DESC`,
      [businessId]
    );

    let expenses = result.rows;

    // Apply category filter
    if (category && category !== 'All') {
      expenses = expenses.filter((e: any) => e.category?.toLowerCase() === category.toLowerCase());
    }

    // Apply date range filters
    if (startDate) {
      expenses = expenses.filter((e: any) => e.date >= startDate);
    }
    if (endDate) {
      expenses = expenses.filter((e: any) => e.date <= endDate);
    }

    // Apply search filter
    if (search) {
      expenses = expenses.filter(
        (e: any) =>
          e.description?.toLowerCase().includes(search) ||
          e.category?.toLowerCase().includes(search)
      );
    }

    const totalAmount = expenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        expenses,
        totalAmount,
        categories: DEFAULT_CATEGORIES,
      },
    });
  } catch (error: any) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses.',
    });
  }
}

export async function createExpense(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const businessId = req.user?.businessId;
    const { category, amount, description, date } = req.body;

    if (!category || amount === undefined) {
      res.status(400).json({
        success: false,
        message: 'Category and amount are required.',
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid positive expense amount.',
      });
      return;
    }

    const id = uuidv4();
    const db = await getDb();
    const expenseDate = date || new Date().toISOString().split('T')[0];

    await db.query(
      `INSERT INTO expenses (id, business_id, category, amount, description, date)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, businessId, category.trim(), amountNum, description?.trim() || '', expenseDate]
    );

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully.',
      data: {
        id,
        business_id: businessId,
        category: category.trim(),
        amount: amountNum,
        description: description?.trim() || '',
        date: expenseDate,
      },
    });
  } catch (error: any) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record expense.',
    });
  }
}

export async function updateExpense(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const businessId = req.user?.businessId;
    const { category, amount, description, date } = req.body;

    if (!category || amount === undefined) {
      res.status(400).json({
        success: false,
        message: 'Category and amount are required.',
      });
      return;
    }

    const amountNum = parseFloat(amount);
    const db = await getDb();
    const expenseDate = date || new Date().toISOString().split('T')[0];

    await db.query(
      `UPDATE expenses
       SET category = $1, amount = $2, description = $3, date = $4
       WHERE id = $5 AND business_id = $6`,
      [category.trim(), amountNum, description?.trim() || '', expenseDate, id, businessId]
    );

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully.',
      data: { id, category, amount: amountNum, description, date: expenseDate },
    });
  } catch (error: any) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense.',
    });
  }
}

export async function deleteExpense(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const businessId = req.user?.businessId;
    const db = await getDb();

    await db.query(
      `DELETE FROM expenses WHERE id = $1 AND business_id = $2`,
      [id, businessId]
    );

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully.',
    });
  } catch (error: any) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense.',
    });
  }
}

