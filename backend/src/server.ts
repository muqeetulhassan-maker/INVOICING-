import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { getDb } from './db/database';
import { seedDatabase } from './db/seed';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import customerRoutes from './routes/customerRoutes';
import productRoutes from './routes/productRoutes';
import saleRoutes from './routes/saleRoutes';
import expenseRoutes from './routes/expenseRoutes';
import reportRoutes from './routes/reportRoutes';
import settingRoutes from './routes/settingRoutes';
import receiptRoutes from './routes/receiptRoutes';

const app = express();

// Middlewares
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));


// Request logging in dev
if (config.nodeEnv !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// Root Landing & Health check endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Nova Business Management API</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #FAF9F6; color: #1E293B; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); max-width: 480px; text-align: center; border: 1px solid #E2E8F0; }
        .badge { display: inline-block; background: #E6F4EA; color: #137333; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 20px; margin-bottom: 16px; }
        h1 { margin: 0 0 10px; font-size: 24px; color: #0F172A; }
        p { font-size: 14px; color: #64748B; line-height: 1.6; margin-bottom: 24px; }
        .btn { display: inline-block; background: #2F5D50; color: white; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px; transition: background 0.2s; }
        .btn:hover { background: #24493e; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">● Backend API Online</div>
        <h1>Nova Business Management</h1>
        <p>The backend REST API server is running smoothly on port 5000.<br>To access the full web application dashboard, open the frontend portal.</p>
        <a href="http://localhost:5173" class="btn">Launch Web App (Port 5173) &rarr;</a>
      </div>
    </body>
    </html>
  `);
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Nova Business Management OS API',
  });
});


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/receipts', receiptRoutes);

// Global Error Handler

app.use(errorHandler);

async function startServer() {
  try {
    // Initialize DB
    await getDb();

    // Auto-seed sample Nova Traders account if needed
    try {
      await seedDatabase();
    } catch (err) {
      console.warn('Seed status:', err);
    }

    app.listen(config.port, () => {
      console.log(`🚀 Nova Business Management API running at http://localhost:${config.port}`);
      console.log(`📊 Health Check: http://localhost:${config.port}/api/health`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

