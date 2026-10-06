import bcrypt from 'bcryptjs';
import { getDb, uuidv4 } from './database';

export async function seedDatabase() {
  const db = await getDb();
  console.log('Seeding database with Nova Traders sample dataset...');

  // Check if Nova Traders business already exists
  const existingBiz = await db.query('SELECT id FROM businesses WHERE email = $1', ['admin@novatraders.pk']);
  if (existingBiz.rows.length > 0) {
    console.log('Sample data already exists. Skipping seed.');
    return existingBiz.rows[0].id;
  }

  const businessId = uuidv4();
  const userId = uuidv4();
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Insert Business
  await db.query(
    `INSERT INTO businesses (id, name, currency, currency_symbol, phone, email, address)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      businessId,
      'Nova Traders',
      'PKR',
      'Rs',
      '0300-9876543',
      'admin@novatraders.pk',
      'Main Boulevard, Gulberg III, Lahore, Pakistan'
    ]
  );

  // 2. Insert User (Business Owner)
  await db.query(
    `INSERT INTO users (id, business_id, full_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      userId,
      businessId,
      'Ahmed Khan',
      'ahmed@novatraders.pk',
      passwordHash,
      'owner'
    ]
  );

  // 3. Insert Customers
  const customers = [
    { id: uuidv4(), name: 'Ahmed Khan', phone: '0300-1234567', email: 'ahmed.khan@gmail.com', address: 'DHA Phase 5, Lahore' },
    { id: uuidv4(), name: 'Ali Raza', phone: '0312-3456789', email: 'ali.raza@outlook.com', address: 'F-7/2, Islamabad' },
    { id: uuidv4(), name: 'Sara Ahmed', phone: '0333-5678901', email: 'sara.ahmed@yahoo.com', address: 'Clifton Block 4, Karachi' },
    { id: uuidv4(), name: 'Hamza Malik', phone: '0321-7890123', email: 'hamza.malik@novacorp.pk', address: 'Bahria Town, Rawalpindi' },
    { id: uuidv4(), name: 'Usman Farooq', phone: '0345-9012345', email: 'usman.f@techhub.com', address: 'Johar Town, Lahore' },
    { id: uuidv4(), name: 'Ayesha Tariq', phone: '0302-2345678', email: 'ayesha.tariq@gmail.com', address: 'Gulshan-e-Iqbal, Karachi' }
  ];

  for (const c of customers) {
    await db.query(
      `INSERT INTO customers (id, business_id, name, phone, email, address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [c.id, businessId, c.name, c.phone, c.email, c.address]
    );
  }

  // 4. Insert Products
  const products = [
    { id: uuidv4(), name: 'MacBook Pro M3 14"', category: 'Laptops', sku: 'LAP-MBP-14', price: 485000, costPrice: 420000, stock: 6, lowStock: 3 },
    { id: uuidv4(), name: 'Dell XPS 15 OLED', category: 'Laptops', sku: 'LAP-DELL-15', price: 395000, costPrice: 340000, stock: 4, lowStock: 2 },
    { id: uuidv4(), name: 'Logitech MX Master 3S', category: 'Accessories', sku: 'ACC-LOG-MX3S', price: 28500, costPrice: 22000, stock: 3, lowStock: 5 }, // Low stock
    { id: uuidv4(), name: 'Keychron K2 Mechanical Keyboard', category: 'Accessories', sku: 'ACC-KEY-K2', price: 24000, costPrice: 18000, stock: 2, lowStock: 4 }, // Low stock
    { id: uuidv4(), name: 'Anker 100W USB-C GaN Charger', category: 'Accessories', sku: 'ACC-ANK-100W', price: 14500, costPrice: 9500, stock: 18, lowStock: 5 },
    { id: uuidv4(), name: 'Dell UltraSharp 27" 4K USB-C Hub Monitor', category: 'Monitors', sku: 'MON-DELL-274K', price: 175000, costPrice: 145000, stock: 5, lowStock: 3 },
    { id: uuidv4(), name: 'Ergonomic Aluminum Laptop Stand', category: 'Accessories', sku: 'ACC-STND-ALU', price: 7500, costPrice: 4200, stock: 4, lowStock: 6 }, // Low stock
    { id: uuidv4(), name: 'Sony WH-1000XM5 Headphones', category: 'Audio', sku: 'AUD-SNY-XM5', price: 95000, costPrice: 78000, stock: 8, lowStock: 3 },
    { id: uuidv4(), name: 'Braided Thunderbolt 4 Cable 2m', category: 'Cables', sku: 'CAB-TB4-2M', price: 8500, costPrice: 4800, stock: 22, lowStock: 5 },
    { id: uuidv4(), name: 'HyperX QuadCast S Microphone', category: 'Audio', sku: 'AUD-HYP-QC', price: 42000, costPrice: 33000, stock: 1, lowStock: 3 } // Low stock
  ];

  for (const p of products) {
    await db.query(
      `INSERT INTO products (id, business_id, name, category, sku, price, cost_price, stock_quantity, low_stock_threshold)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [p.id, businessId, p.name, p.category, p.sku, p.price, p.costPrice, p.stock, p.lowStock]
    );
  }

  // 5. Insert Expenses
  const expenses = [
    { category: 'Rent', amount: 85000, description: 'Office space rent - Gulberg III Plaza', date: '2026-09-01' },
    { category: 'Utilities', amount: 28500, description: 'Electricity (LESCO) & High-speed Fiber', date: '2026-09-05' },
    { category: 'Marketing', amount: 45000, description: 'Google Ads & Meta campaign targeting retail stores', date: '2026-09-08' },
    { category: 'Supplies', amount: 18500, description: 'Packaging material, bubble wraps & invoice rolls', date: '2026-09-10' },
    { category: 'Transport', amount: 14000, description: 'Courier & local logistics courier delivery', date: '2026-09-12' },
    { category: 'Salary', amount: 120000, description: 'Staff salaries (Store manager & Sales associate)', date: '2026-09-01' },
    { category: 'Rent', amount: 85000, description: 'Office space rent - August', date: '2026-08-01' },
    { category: 'Utilities', amount: 31000, description: 'LESCO Electricity Bill - August peak summer', date: '2026-08-05' },
    { category: 'Marketing', amount: 52000, description: 'Digital marketing & brand awareness campaign', date: '2026-08-12' },
    { category: 'Maintenance', amount: 9500, description: 'AC servicing and electrical fixtures check', date: '2026-08-20' },
    { category: 'Salary', amount: 120000, description: 'Staff salaries - August', date: '2026-08-01' }
  ];

  for (const exp of expenses) {
    await db.query(
      `INSERT INTO expenses (id, business_id, category, amount, description, date)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), businessId, exp.category, exp.amount, exp.description, exp.date]
    );
  }

  // 6. Insert Historical and Recent Sales
  const salesData = [
    {
      saleNumber: 'INV-1024',
      customer: customers[0],
      date: '2026-09-14 14:30:00',
      status: 'completed',
      discount: 0,
      items: [
        { product: products[0], quantity: 1, price: 485000 },
        { product: products[2], quantity: 1, price: 28500 }
      ]
    },
    {
      saleNumber: 'INV-1023',
      customer: customers[1],
      date: '2026-09-13 11:15:00',
      status: 'completed',
      discount: 5000,
      items: [
        { product: products[5], quantity: 1, price: 175000 },
        { product: products[3], quantity: 1, price: 24000 },
        { product: products[6], quantity: 1, price: 7500 }
      ]
    },
    {
      saleNumber: 'INV-1022',
      customer: customers[2],
      date: '2026-09-11 16:45:00',
      status: 'completed',
      discount: 0,
      items: [
        { product: products[7], quantity: 1, price: 95000 },
        { product: products[4], quantity: 2, price: 14500 }
      ]
    },
    {
      saleNumber: 'INV-1021',
      customer: customers[3],
      date: '2026-09-09 10:20:00',
      status: 'completed',
      discount: 10000,
      items: [
        { product: products[1], quantity: 1, price: 395000 },
        { product: products[2], quantity: 1, price: 28500 },
        { product: products[8], quantity: 2, price: 8500 }
      ]
    },
    {
      saleNumber: 'INV-1020',
      customer: customers[4],
      date: '2026-09-06 17:00:00',
      status: 'completed',
      discount: 0,
      items: [
        { product: products[3], quantity: 2, price: 24000 },
        { product: products[6], quantity: 2, price: 7500 }
      ]
    },
    {
      saleNumber: 'INV-1019',
      customer: customers[5],
      date: '2026-09-02 13:40:00',
      status: 'completed',
      discount: 0,
      items: [
        { product: products[9], quantity: 1, price: 42000 },
        { product: products[8], quantity: 1, price: 8500 }
      ]
    },
    {
      saleNumber: 'INV-1018',
      customer: customers[0],
      date: '2026-08-28 15:30:00',
      status: 'completed',
      discount: 0,
      items: [
        { product: products[5], quantity: 1, price: 175000 }
      ]
    },
    {
      saleNumber: 'INV-1017',
      customer: customers[1],
      date: '2026-08-21 12:10:00',
      status: 'completed',
      discount: 0,
      items: [
        { product: products[7], quantity: 1, price: 95000 },
        { product: products[2], quantity: 1, price: 28500 }
      ]
    }
  ];

  for (const s of salesData) {
    const saleId = uuidv4();
    let total = s.items.reduce((sum, it) => sum + (it.price * it.quantity), 0) - s.discount;

    await db.query(
      `INSERT INTO sales (id, sale_number, business_id, customer_id, total_amount, discount_amount, status, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [saleId, s.saleNumber, businessId, s.customer.id, total, s.discount, s.status, 'In-store official order', s.date]
    );

    for (const item of s.items) {
      const subtotal = item.price * item.quantity;
      await db.query(
        `INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, unit_price, subtotal, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [uuidv4(), saleId, item.product.id, item.product.name, item.quantity, item.price, subtotal, s.date]
      );
    }
  }

  console.log('✅ Seed completed successfully! Test account: ahmed@novatraders.pk / password123');
  return businessId;
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

