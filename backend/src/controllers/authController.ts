import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, uuidv4 } from '../db/database';
import { config } from '../config/env';
import { AuthenticatedRequest } from '../middleware/auth';
import { isValidPhoneNumber } from '../utils/validators';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { businessName, fullName, email, password, phone, address } = req.body;

    if (!businessName || !fullName || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Business name, full name, email, and password are required.',
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

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }

    const db = await getDb();

    // Check if user already exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
      return;
    }

    const businessId = uuidv4();
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    // Create business
    await db.query(
      `INSERT INTO businesses (id, name, currency, currency_symbol, phone, email, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [businessId, businessName.trim(), 'PKR', 'Rs', phone || '', email.toLowerCase().trim(), address || '']
    );

    // Create owner user
    await db.query(
      `INSERT INTO users (id, business_id, full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, businessId, fullName.trim(), email.toLowerCase().trim(), passwordHash, 'owner']
    );

    const token = jwt.sign(
      {
        userId,
        businessId,
        email: email.toLowerCase().trim(),
        role: 'owner',
        fullName: fullName.trim(),
        businessName: businessName.trim(),
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Business registered successfully.',
      data: {
        token,
        user: {
          id: userId,
          fullName: fullName.trim(),
          email: email.toLowerCase().trim(),
          role: 'owner',
        },
        business: {
          id: businessId,
          name: businessName.trim(),
          currency: 'PKR',
          currencySymbol: 'Rs',
          phone: phone || '',
          address: address || '',
        },
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create account. Please try again.',
    });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
      return;
    }

    const db = await getDb();
    const result = await db.query(
      `SELECT u.id, u.business_id, u.full_name, u.email, u.password_hash, u.role,
              b.name as business_name, b.currency, b.currency_symbol, b.phone as business_phone, b.address as business_address
       FROM users u
       JOIN businesses b ON u.business_id = b.id
       WHERE LOWER(u.email) = $1`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: user.id,
        businessId: user.business_id,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        businessName: user.business_name,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        token,
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
        },
        business: {
          id: user.business_id,
          name: user.business_name,
          currency: user.currency || 'PKR',
          currencySymbol: user.currency_symbol || 'Rs',
          phone: user.business_phone || '',
          address: user.business_address || '',
        },
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.',
    });
  }
}

export async function demoLogin(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    let result = await db.query(
      `SELECT u.id, u.business_id, u.full_name, u.email, u.role,
              b.name as business_name, b.currency, b.currency_symbol, b.phone as business_phone, b.address as business_address
       FROM users u
       JOIN businesses b ON u.business_id = b.id
       WHERE LOWER(u.email) = $1`,
      ['ahmed@novatraders.pk']
    );

    if (result.rows.length === 0) {
      // If demo user not yet in db, trigger seed
      const { seedDatabase } = await import('../db/seed');
      await seedDatabase();

      result = await db.query(
        `SELECT u.id, u.business_id, u.full_name, u.email, u.role,
                b.name as business_name, b.currency, b.currency_symbol, b.phone as business_phone, b.address as business_address
         FROM users u
         JOIN businesses b ON u.business_id = b.id
         WHERE LOWER(u.email) = $1`,
        ['ahmed@novatraders.pk']
      );
    }

    const user = result.rows[0];

    const token = jwt.sign(
      {
        userId: user.id,
        businessId: user.business_id,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        businessName: user.business_name,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Signed in to Nova Traders demo account.',
      data: {
        token,
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
        },
        business: {
          id: user.business_id,
          name: user.business_name,
          currency: user.currency || 'PKR',
          currencySymbol: user.currency_symbol || 'Rs',
          phone: user.business_phone || '',
          address: user.business_address || '',
        },
      },
    });
  } catch (error: any) {
    console.error('Demo login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to authenticate demo account.',
    });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const db = await getDb();

    const result = await db.query(
      `SELECT u.id, u.business_id, u.full_name, u.email, u.role,
              b.name as business_name, b.currency, b.currency_symbol, b.phone as business_phone, b.address as business_address
       FROM users u
       JOIN businesses b ON u.business_id = b.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
      return;
    }

    const user = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
        },
        business: {
          id: user.business_id,
          name: user.business_name,
          currency: user.currency || 'PKR',
          currencySymbol: user.currency_symbol || 'Rs',
          phone: user.business_phone || '',
          address: user.business_address || '',
        },
      },
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile data.',
    });
  }
}

