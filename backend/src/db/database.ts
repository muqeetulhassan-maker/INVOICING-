
import { Pool, QueryResult } from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

export interface DbInterface {
  query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }>;
  transaction<T>(callback: (client: DbInterface) => Promise<T>): Promise<T>;
  init(): Promise<void>;
  driver: 'postgres' | 'local';
}

class PostgresDatabase implements DbInterface {
  private pool: Pool;
  driver: 'postgres' = 'postgres';

  constructor() {
    if (config.databaseUrl) {
      this.pool = new Pool({ connectionString: config.databaseUrl });
    } else {
      this.pool = new Pool({
        host: config.pg.host,
        port: config.pg.port,
        database: config.pg.database,
        user: config.pg.user,
        password: config.pg.password,
      });
    }
  }

  async init(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS businesses (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          currency VARCHAR(10) DEFAULT 'PKR',
          currency_symbol VARCHAR(10) DEFAULT 'Rs',
          phone VARCHAR(50),
          email VARCHAR(255),
          address TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'owner',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS customers (
          id VARCHAR(64) PRIMARY KEY,
          business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NOT NULL,
          email VARCHAR(255),
          address TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS products (
          id VARCHAR(64) PRIMARY KEY,
          business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(100) NOT NULL,
          sku VARCHAR(100),
          price NUMERIC(12, 2) NOT NULL DEFAULT 0,
          cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
          stock_quantity INTEGER NOT NULL DEFAULT 0,
          low_stock_threshold INTEGER NOT NULL DEFAULT 5,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sales (
          id VARCHAR(64) PRIMARY KEY,
          sale_number VARCHAR(50) NOT NULL,
          business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE SET NULL,
          total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
          discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
          status VARCHAR(50) DEFAULT 'completed',
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sale_items (
          id VARCHAR(64) PRIMARY KEY,
          sale_id VARCHAR(64) NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
          product_id VARCHAR(64) REFERENCES products(id) ON DELETE RESTRICT,
          product_name VARCHAR(255) NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price NUMERIC(12, 2) NOT NULL,
          subtotal NUMERIC(12, 2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS expenses (
          id VARCHAR(64) PRIMARY KEY,
          business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          category VARCHAR(100) NOT NULL,
          amount NUMERIC(12, 2) NOT NULL,
          description TEXT,
          date DATE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('PostgreSQL database initialized successfully.');
    } finally {
      client.release();
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
    const res: QueryResult = await this.pool.query(sql, params);
    return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 };
  }

  async transaction<T>(callback: (client: DbInterface) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const txDb: DbInterface = {
        driver: 'postgres',
        init: async () => {},
        query: async <K = any>(sql: string, params: any[] = []) => {
          const res = await client.query(sql, params);
          return { rows: res.rows as K[], rowCount: res.rowCount ?? 0 };
        },
        transaction: async (nestedCb) => nestedCb(txDb),
      };
      const result = await callback(txDb);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

// Resilient pure-JS Storage Engine
class LocalStoreDatabase implements DbInterface {
  driver: 'local' = 'local';
  private filePath: string;
  private data: {
    businesses: any[];
    users: any[];
    customers: any[];
    products: any[];
    sales: any[];
    sale_items: any[];
    expenses: any[];
  } = {
    businesses: [],
    users: [],
    customers: [],
    products: [],
    sales: [],
    sale_items: [],
    expenses: [],
  };

  constructor(filePath?: string) {
    this.filePath = filePath || path.join(__dirname, '../../nova_store.json');
  }

  async init(): Promise<void> {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.save();
      }
      console.log('Local store database initialized at:', this.filePath);
    } catch (e) {
      console.warn('Initializing empty local storage.');
      this.save();
    }
  }

  private save(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
    const trimmed = sql.trim();
    const upper = trimmed.toUpperCase();

    // 1. SELECT queries
    if (upper.startsWith('SELECT')) {
      if (upper.includes('FROM BUSINESSES') && upper.includes('WHERE EMAIL =')) {
        const email = params[0]?.toLowerCase();
        const rows = this.data.businesses.filter((b) => b.email?.toLowerCase() === email);
        return { rows: rows as T[], rowCount: rows.length };
      }

      if (upper.includes('FROM USERS') && (upper.includes('WHERE U.ID =') || upper.includes('WHERE ID ='))) {
        const id = params[0];
        const user = this.data.users.find((u) => u.id === id);
        if (!user) return { rows: [], rowCount: 0 };
        const biz = this.data.businesses.find((b) => b.id === user.business_id);
        const row = {
          ...user,
          business_name: biz?.name,
          currency: biz?.currency || 'PKR',
          currency_symbol: biz?.currency_symbol || 'Rs',
          business_phone: biz?.phone,
          business_address: biz?.address,
        };
        return { rows: [row] as T[], rowCount: 1 };
      }

      if (upper.includes('FROM USERS') && (upper.includes('EMAIL') || upper.includes('JOIN BUSINESSES'))) {
        const paramVal = String(params[0] || '').toLowerCase();
        const user = this.data.users.find((u) => u.email?.toLowerCase() === paramVal || u.id === paramVal);
        if (!user) return { rows: [], rowCount: 0 };
        const biz = this.data.businesses.find((b) => b.id === user.business_id);
        const row = {
          ...user,
          business_name: biz?.name,
          currency: biz?.currency || 'PKR',
          currency_symbol: biz?.currency_symbol || 'Rs',
          business_phone: biz?.phone,
          business_address: biz?.address,
        };
        return { rows: [row] as T[], rowCount: 1 };
      }


      if (upper.includes('SUM(TOTAL_AMOUNT)') && upper.includes('FROM SALES')) {
        const bizId = params[0];
        const completedSales = this.data.sales.filter((s) => s.business_id === bizId && s.status === 'completed');
        const total = completedSales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
        return {
          rows: [{ total_revenue: total, total_sales_count: completedSales.length }] as T[],
          rowCount: 1,
        };
      }

      if (upper.includes('SUM(AMOUNT)') && upper.includes('FROM EXPENSES')) {
        const bizId = params[0];
        const bizExpenses = this.data.expenses.filter((e) => e.business_id === bizId);
        const total = bizExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
        return {
          rows: [{ total_expenses: total, expense_count: bizExpenses.length }] as T[],
          rowCount: 1,
        };
      }

      if (upper.includes('COUNT(ID)') && upper.includes('FROM CUSTOMERS')) {
        const bizId = params[0];
        const count = this.data.customers.filter((c) => c.business_id === bizId).length;
        return { rows: [{ count }] as T[], rowCount: 1 };
      }

      if (upper.includes('FROM PRODUCTS') && upper.includes('STOCK_QUANTITY <=')) {
        const bizId = params[0];
        const low = this.data.products
          .filter((p) => p.business_id === bizId && Number(p.stock_quantity) <= Number(p.low_stock_threshold))
          .sort((a, b) => a.stock_quantity - b.stock_quantity);
        return { rows: low as T[], rowCount: low.length };
      }

      if (upper.includes('FROM SALES') && upper.includes('STATUS = \'COMPLETED\'')) {
        const bizId = params[0];
        const sales = this.data.sales
          .filter((s) => s.business_id === bizId && s.status === 'completed')
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        return { rows: sales as T[], rowCount: sales.length };
      }

      if (upper.includes('FROM EXPENSES') && upper.includes('ORDER BY DATE ASC')) {
        const bizId = params[0];
        const exp = this.data.expenses
          .filter((e) => e.business_id === bizId)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return { rows: exp as T[], rowCount: exp.length };
      }

      if (upper.includes('FROM SALES S') && upper.includes('LIMIT 6')) {
        const bizId = params[0];
        const list = this.data.sales
          .filter((s) => s.business_id === bizId)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 6)
          .map((s) => {
            const customer = this.data.customers.find((c) => c.id === s.customer_id);
            const itemCount = this.data.sale_items.filter((it) => it.sale_id === s.id).length;
            return {
              ...s,
              customer_name: customer?.name || 'Walk-in Customer',
              customer_phone: customer?.phone || '',
              item_count: itemCount,
            };
          });
        return { rows: list as T[], rowCount: list.length };
      }

      if (upper.includes('FROM BUSINESSES') && upper.includes('WHERE ID =')) {
        const id = params[0];
        const rows = this.data.businesses.filter((b) => b.id === id);
        return { rows: rows as T[], rowCount: rows.length };
      }

      if (upper.includes('FROM CUSTOMERS') && upper.includes('WHERE ID =')) {
        const id = params[0];
        const bizId = params[1];
        let rows = this.data.customers.filter((c) => c.id === id);
        if (bizId) {
          rows = rows.filter((c) => c.business_id === bizId);
        }
        return { rows: rows as T[], rowCount: rows.length };
      }

      if (upper.includes('FROM PRODUCTS') && upper.includes('WHERE ID =')) {
        const id = params[0];
        const bizId = params[1];
        let rows = this.data.products.filter((p) => p.id === id);
        if (bizId) {
          rows = rows.filter((p) => p.business_id === bizId);
        }
        return { rows: rows as T[], rowCount: rows.length };
      }

      if (upper.includes('FROM SALES S') && upper.includes('WHERE S.ID =')) {
        const id = params[0];
        const bizId = params[1];
        const s = this.data.sales.find((x) => x.id === id && (!bizId || x.business_id === bizId));
        if (!s) return { rows: [], rowCount: 0 };
        const customer = this.data.customers.find((c) => c.id === s.customer_id);
        const biz = this.data.businesses.find((b) => b.id === s.business_id);
        const row = {
          ...s,
          business_name: biz?.name || 'Nova Traders',
          business_phone: biz?.phone || '',
          business_email: biz?.email || '',
          business_address: biz?.address || '',
          currency_symbol: biz?.currency_symbol || 'Rs',
          customer_name: customer?.name || 'Walk-in Customer',
          customer_phone: customer?.phone || '',
          customer_email: customer?.email || '',
          customer_address: customer?.address || '',
        };
        return { rows: [row] as T[], rowCount: 1 };
      }

      if (upper.includes('FROM SALES S') && upper.includes('WHERE S.CUSTOMER_ID =')) {
        const customerId = params[0];
        const bizId = params[1];
        const sales = this.data.sales
          .filter((s) => s.customer_id === customerId && (!bizId || s.business_id === bizId))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return { rows: sales as T[], rowCount: sales.length };
      }

      if (upper.includes('FROM CUSTOMERS')) {
        const bizId = params[0];
        let list = this.data.customers.filter((c) => c.business_id === bizId);
        const enriched = list.map((c) => {
          const custSales = this.data.sales.filter((s) => s.customer_id === c.id && s.status === 'completed');
          const totalSpent = custSales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
          return {
            ...c,
            totalSpent,
            total_spent: totalSpent,
            totalSales: custSales.length,
            total_orders: custSales.length,
          };
        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return { rows: enriched as T[], rowCount: enriched.length };
      }

      if (upper.includes('FROM PRODUCTS')) {
        const bizId = params[0];
        const list = this.data.products
          .filter((p) => p.business_id === bizId)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return { rows: list as T[], rowCount: list.length };
      }

      if (upper.includes('FROM EXPENSES')) {
        const bizId = params[0];
        const list = this.data.expenses
          .filter((e) => e.business_id === bizId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return { rows: list as T[], rowCount: list.length };
      }

      if (upper.includes('FROM SALE_ITEMS')) {
        const saleId = params[0];
        const items = this.data.sale_items.filter((it) => it.sale_id === saleId);
        return { rows: items as T[], rowCount: items.length };
      }

      if (upper.includes('FROM SALES')) {
        const bizId = params[0];
        const list = this.data.sales
          .filter((s) => s.business_id === bizId)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map((s) => {
            const customer = this.data.customers.find((c) => c.id === s.customer_id);
            const items = this.data.sale_items.filter((it) => it.sale_id === s.id);
            return {
              ...s,
              customer_name: customer?.name || 'Walk-in Customer',
              customer_phone: customer?.phone || '',
              customer_email: customer?.email || '',
              items,
              item_count: items.length,
            };
          });
        return { rows: list as T[], rowCount: list.length };
      }
    }

    // 2. INSERT queries
    if (upper.startsWith('INSERT INTO BUSINESSES')) {
      const [id, name, currency, currency_symbol, phone, email, address] = params;
      const now = new Date().toISOString();
      const entity = { id, name, currency, currency_symbol, phone, email, address, created_at: now, updated_at: now };
      this.data.businesses.push(entity);
      this.save();
      return { rows: [entity] as T[], rowCount: 1 };
    }

    if (upper.startsWith('INSERT INTO USERS')) {
      const [id, business_id, full_name, email, password_hash, role] = params;
      const entity = { id, business_id, full_name, email, password_hash, role: role || 'owner', created_at: new Date().toISOString() };
      this.data.users.push(entity);
      this.save();
      return { rows: [entity] as T[], rowCount: 1 };
    }

    if (upper.startsWith('INSERT INTO CUSTOMERS')) {
      const [id, business_id, name, phone, email, address] = params;
      const now = new Date().toISOString();
      const entity = { id, business_id, name, phone, email, address, created_at: now, updated_at: now };
      this.data.customers.push(entity);
      this.save();
      return { rows: [entity] as T[], rowCount: 1 };
    }

    if (upper.startsWith('INSERT INTO PRODUCTS')) {
      const [id, business_id, name, category, sku, price, cost_price, stock_quantity, low_stock_threshold] = params;
      const now = new Date().toISOString();
      const entity = {
        id,
        business_id,
        name,
        category,
        sku,
        price: Number(price),
        cost_price: Number(cost_price),
        stock_quantity: Number(stock_quantity),
        low_stock_threshold: Number(low_stock_threshold),
        created_at: now,
        updated_at: now,
      };
      this.data.products.push(entity);
      this.save();
      return { rows: [entity] as T[], rowCount: 1 };
    }

    if (upper.startsWith('INSERT INTO SALES')) {
      const [id, sale_number, business_id, customer_id, total_amount, discount_amount, status, notes, created_at] = params;
      const entity = {
        id,
        sale_number,
        business_id,
        customer_id,
        total_amount: Number(total_amount),
        discount_amount: Number(discount_amount || 0),
        status: status || 'completed',
        notes: notes || '',
        created_at: created_at || new Date().toISOString(),
      };
      this.data.sales.push(entity);
      this.save();
      return { rows: [entity] as T[], rowCount: 1 };
    }

    if (upper.startsWith('INSERT INTO SALE_ITEMS')) {
      const [id, sale_id, product_id, product_name, quantity, unit_price, subtotal, created_at] = params;
      const entity = {
        id,
        sale_id,
        product_id,
        product_name,
        quantity: Number(quantity),
        unit_price: Number(unit_price),
        subtotal: Number(subtotal),
        created_at: created_at || new Date().toISOString(),
      };
      this.data.sale_items.push(entity);
      this.save();
      return { rows: [entity] as T[], rowCount: 1 };
    }

    if (upper.startsWith('INSERT INTO EXPENSES')) {
      const [id, business_id, category, amount, description, date] = params;
      const entity = {
        id,
        business_id,
        category,
        amount: Number(amount),
        description: description || '',
        date: date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      };
      this.data.expenses.push(entity);
      this.save();
      return { rows: [entity] as T[], rowCount: 1 };
    }

    // 3. UPDATE queries
    if (upper.startsWith('UPDATE PRODUCTS SET STOCK_QUANTITY = STOCK_QUANTITY -')) {
      const qty = Number(params[0]);
      const prodId = params[1];
      const prod = this.data.products.find((p) => p.id === prodId);
      if (prod) {
        prod.stock_quantity = Math.max(0, Number(prod.stock_quantity) - qty);
        prod.updated_at = new Date().toISOString();
        this.save();
        return { rows: [prod] as T[], rowCount: 1 };
      }
    }

    if (upper.startsWith('UPDATE CUSTOMERS')) {
      const [name, phone, email, address, id, business_id] = params;
      const cust = this.data.customers.find((c) => c.id === id && c.business_id === business_id);
      if (cust) {
        cust.name = name;
        cust.phone = phone;
        cust.email = email;
        cust.address = address;
        cust.updated_at = new Date().toISOString();
        this.save();
        return { rows: [cust] as T[], rowCount: 1 };
      }
    }

    if (upper.startsWith('UPDATE PRODUCTS') && upper.includes('SET NAME =')) {
      const [name, category, sku, price, cost_price, stock_quantity, low_stock_threshold, id, business_id] = params;
      const prod = this.data.products.find((p) => p.id === id && p.business_id === business_id);
      if (prod) {
        prod.name = name;
        prod.category = category;
        prod.sku = sku;
        prod.price = Number(price);
        prod.cost_price = Number(cost_price);
        prod.stock_quantity = Number(stock_quantity);
        prod.low_stock_threshold = Number(low_stock_threshold);
        prod.updated_at = new Date().toISOString();
        this.save();
        return { rows: [prod] as T[], rowCount: 1 };
      }
    }

    if (upper.startsWith('UPDATE EXPENSES')) {
      const [category, amount, description, date, id, business_id] = params;
      const exp = this.data.expenses.find((e) => e.id === id && e.business_id === business_id);
      if (exp) {
        exp.category = category;
        exp.amount = Number(amount);
        exp.description = description;
        exp.date = date;
        this.save();
        return { rows: [exp] as T[], rowCount: 1 };
      }
    }

    if (upper.startsWith('UPDATE BUSINESSES')) {
      const [name, phone, address, currency, currency_symbol, id] = params;
      const biz = this.data.businesses.find((b) => b.id === id);
      if (biz) {
        biz.name = name;
        biz.phone = phone;
        biz.address = address;
        biz.currency = currency || biz.currency;
        biz.currency_symbol = currency_symbol || biz.currency_symbol;
        biz.updated_at = new Date().toISOString();
        this.save();
        return { rows: [biz] as T[], rowCount: 1 };
      }
    }

    // 4. DELETE queries
    if (upper.startsWith('DELETE FROM CUSTOMERS')) {
      const [id, business_id] = params;
      const initial = this.data.customers.length;
      this.data.customers = this.data.customers.filter((c) => !(c.id === id && c.business_id === business_id));
      this.save();
      return { rows: [] as T[], rowCount: initial - this.data.customers.length };
    }

    if (upper.startsWith('DELETE FROM PRODUCTS')) {
      const [id, business_id] = params;
      const initial = this.data.products.length;
      this.data.products = this.data.products.filter((p) => !(p.id === id && p.business_id === business_id));
      this.save();
      return { rows: [] as T[], rowCount: initial - this.data.products.length };
    }

    if (upper.startsWith('DELETE FROM EXPENSES')) {
      const [id, business_id] = params;
      const initial = this.data.expenses.length;
      this.data.expenses = this.data.expenses.filter((e) => !(e.id === id && e.business_id === business_id));
      this.save();
      return { rows: [] as T[], rowCount: initial - this.data.expenses.length };
    }

    return { rows: [] as T[], rowCount: 0 };
  }

  async transaction<T>(callback: (client: DbInterface) => Promise<T>): Promise<T> {
    return callback(this);
  }
}

let dbInstance: DbInterface | null = null;

export async function getDb(): Promise<DbInterface> {
  if (dbInstance) return dbInstance;

  if (config.dbDriver === 'postgres') {
    const pgDb = new PostgresDatabase();
    await pgDb.init();
    dbInstance = pgDb;
    return dbInstance;
  }

  if (config.dbDriver === 'local') {
    const localDb = new LocalStoreDatabase();
    await localDb.init();
    dbInstance = localDb;
    return dbInstance;
  }

  // Auto driver: attempt PostgreSQL first; if it fails (e.g. no database created or password prompt), fallback to local store smoothly!
  try {
    const pgDb = new PostgresDatabase();
    await pgDb.init();
    console.log('Connected to PostgreSQL database successfully.');
    dbInstance = pgDb;
    return dbInstance;
  } catch (err: any) {
    console.warn(`PostgreSQL connection failed (${err.message}). Using local embedded storage database.`);
    const localDb = new LocalStoreDatabase();
    await localDb.init();
    dbInstance = localDb;
    return dbInstance;
  }
}

export { uuidv4 };
