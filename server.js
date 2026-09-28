const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = 3000;

// ─── Database Setup ─────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'canteen.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT NOT NULL DEFAULT 'Meals',
    image_emoji TEXT DEFAULT '🍽️',
    available INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    items_json TEXT NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Received',
    payment_method TEXT DEFAULT 'Cash',
    order_type TEXT DEFAULT 'Dine In',
    table_number TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );
`);

// Seed / reset admin user (always ensure admin/admin123 works)
const adminExists = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
const hash = bcrypt.hashSync('admin123', 10);
if (!adminExists) {
  db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', hash);
} else {
  // Always update hash so credentials are guaranteed correct
  db.prepare('UPDATE admin_users SET password_hash = ? WHERE username = ?').run(hash, 'admin');
}

// Seed menu items if empty
const menuCount = db.prepare('SELECT COUNT(*) as c FROM menu_items').get();
if (menuCount.c === 0) {
  const seedItems = [
    // Meals
    { name: 'Thali Special', desc: 'Full meal with dal, sabzi, roti & rice', price: 80, cat: 'Meals', emoji: '🍛' },
    { name: 'Veg Biryani', desc: 'Fragrant basmati rice with mixed vegetables', price: 70, cat: 'Meals', emoji: '🍚' },
    { name: 'Chicken Rice Bowl', desc: 'Grilled chicken over steamed rice', price: 110, cat: 'Meals', emoji: '🍗' },
    { name: 'Paneer Butter Masala + Roti', desc: 'Rich creamy paneer curry with 3 rotis', price: 95, cat: 'Meals', emoji: '🧆' },
    // Snacks
    { name: 'Samosa (2 pcs)', desc: 'Crispy fried potato-filled pastries', price: 20, cat: 'Snacks', emoji: '🥟' },
    { name: 'Bread Pakora', desc: 'Stuffed spiced bread fritters', price: 25, cat: 'Snacks', emoji: '🥪' },
    { name: 'Maggi Noodles', desc: 'Classic masala noodles', price: 30, cat: 'Snacks', emoji: '🍜' },
    { name: 'Pav Bhaji', desc: 'Spiced mashed vegetables with butter pav', price: 50, cat: 'Snacks', emoji: '🫓' },
    // Beverages
    { name: 'Masala Chai', desc: 'Freshly brewed spiced tea', price: 15, cat: 'Beverages', emoji: '☕' },
    { name: 'Cold Coffee', desc: 'Chilled blended coffee with milk', price: 40, cat: 'Beverages', emoji: '🥤' },
    { name: 'Fresh Lime Soda', desc: 'Refreshing lemon with soda water', price: 35, cat: 'Beverages', emoji: '🍋' },
    { name: 'Lassi', desc: 'Sweet yogurt drink', price: 30, cat: 'Beverages', emoji: '🥛' },
    // Desserts
    { name: 'Gulab Jamun (2 pcs)', desc: 'Soft milk dumplings in sugar syrup', price: 25, cat: 'Desserts', emoji: '🍮' },
    { name: 'Kheer', desc: 'Creamy rice pudding with dry fruits', price: 35, cat: 'Desserts', emoji: '🍨' },
    { name: 'Ice Cream Cup', desc: 'Vanilla / Chocolate / Strawberry', price: 30, cat: 'Desserts', emoji: '🍦' },
  ];
  const insert = db.prepare('INSERT INTO menu_items (name, description, price, category, image_emoji) VALUES (?, ?, ?, ?, ?)');
  seedItems.forEach(i => insert.run(i.name, i.desc, i.price, i.cat, i.emoji));
}

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));
app.use(session({
  secret: 'cms-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// ─── Serve HTML Pages ────────────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'templates', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'templates', 'admin.html')));
app.get('/order-status', (req, res) => res.sendFile(path.join(__dirname, 'templates', 'order_status.html')));

// ─── Auth Middleware ─────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// ─── Auth Routes ─────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  req.session.isAdmin = true;
  req.session.adminUser = username;
  res.json({ success: true, username });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/status', (req, res) => {
  res.json({ isAdmin: !!req.session.isAdmin, username: req.session.adminUser || null });
});

// ─── Menu Routes ─────────────────────────────────────────────────────────────
app.get('/api/menu', (req, res) => {
  const items = db.prepare('SELECT * FROM menu_items ORDER BY category, id').all();
  res.json(items);
});

app.post('/api/menu', requireAdmin, (req, res) => {
  const { name, description, price, category, image_emoji } = req.body;
  if (!name || !price || !category) return res.status(400).json({ error: 'Missing required fields' });
  const result = db.prepare(
    'INSERT INTO menu_items (name, description, price, category, image_emoji) VALUES (?, ?, ?, ?, ?)'
  ).run(name, description || '', parseFloat(price), category, image_emoji || '🍽️');
  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(result.lastInsertRowid);
  res.json(item);
});

app.put('/api/menu/:id', requireAdmin, (req, res) => {
  const { name, description, price, category, image_emoji, available } = req.body;
  db.prepare(
    'UPDATE menu_items SET name=?, description=?, price=?, category=?, image_emoji=?, available=? WHERE id=?'
  ).run(name, description, parseFloat(price), category, image_emoji, available ? 1 : 0, req.params.id);
  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
  res.json(item);
});

app.delete('/api/menu/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ─── Order Routes ─────────────────────────────────────────────────────────────
app.post('/api/orders', (req, res) => {
  const { customer_name, customer_phone, items, total, payment_method, order_type, table_number } = req.body;
  if (!customer_name || !items || !total) return res.status(400).json({ error: 'Missing required fields' });
  // Migrate DB if columns don't exist yet
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN order_type TEXT DEFAULT 'Dine In'`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN table_number TEXT DEFAULT ''`);
  } catch { /* column already exists */ }
  const result = db.prepare(
    'INSERT INTO orders (customer_name, customer_phone, items_json, total, payment_method, order_type, table_number) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(customer_name, customer_phone || '', JSON.stringify(items), parseFloat(total), payment_method || 'Cash', order_type || 'Dine In', table_number || '');
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
  let orderItems = [];
  try { orderItems = JSON.parse(order.items_json || '[]'); } catch { orderItems = []; }
  res.json({ ...order, items: orderItems });
});

app.get('/api/orders', requireAdmin, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  res.json(orders.map(o => {
    let items = [];
    try { items = JSON.parse(o.items_json || '[]'); } catch { items = []; }
    return { ...o, items };
  }));
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  let items = [];
  try { items = JSON.parse(order.items_json || '[]'); } catch { items = []; }
  res.json({ ...order, items });
});

app.put('/api/orders/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Received', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  let items = [];
  try { items = JSON.parse(order.items_json || '[]'); } catch { items = []; }
  res.json({ ...order, items });
});

// ─── Reports Route ────────────────────────────────────────────────────────────
app.get('/api/reports/summary', requireAdmin, (req, res) => {
  const totalOrders = db.prepare("SELECT COUNT(*) as c FROM orders").get().c;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total),0) as r FROM orders WHERE status != 'Cancelled'").get().r;
  const todayOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE date(created_at)=date('now')").get().c;
  const todayRevenue = db.prepare("SELECT COALESCE(SUM(total),0) as r FROM orders WHERE date(created_at)=date('now') AND status!='Cancelled'").get().r;
  const pendingOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status IN ('Received','Preparing')").get().c;
  const categoryStats = db.prepare(`
    SELECT mi.category, COUNT(*) as count, SUM(mi.price) as revenue
    FROM menu_items mi GROUP BY mi.category
  `).all();
  const recentOrders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 10").all()
    .map(o => {
      let items = [];
      try { items = JSON.parse(o.items_json || '[]'); } catch { items = []; }
      return { ...o, items };
    });
  const statusBreakdown = db.prepare("SELECT status, COUNT(*) as count FROM orders GROUP BY status").all();

  res.json({ totalOrders, totalRevenue, todayOrders, todayRevenue, pendingOrders, categoryStats, recentOrders, statusBreakdown });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🍽️  Canteen Management System running at http://localhost:${PORT}`);
  console.log(`📋  Admin panel: http://localhost:${PORT}/admin`);
  console.log(`🔑  Admin credentials: admin / admin123\n`);
});
