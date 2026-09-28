-- database/schema.sql

-- Drop tables if they exist to allow clean recreation
DROP TABLE IF EXISTS loyalty_visits CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS payment_history CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS Table (Customers and Admins)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. MENU_ITEMS Table
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ORDERS Table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'New' CHECK (status IN ('New', 'Preparing', 'Ready', 'Completed', 'Cancelled')),
    payment_method VARCHAR(50) DEFAULT 'Wallet' CHECK (payment_method IN ('Wallet', 'Razorpay', 'Cash')),
    payment_status VARCHAR(20) DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Failed', 'Refunded')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. ORDER_ITEMS Table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_time DECIMAL(10, 2) NOT NULL
);

-- 5. PAYMENT_HISTORY Table
CREATE TABLE payment_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('Recharge', 'Deduction', 'Refund')),
    payment_gateway VARCHAR(50), -- e.g., 'Razorpay', 'System'
    gateway_transaction_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. RECEIPTS Table
CREATE TABLE receipts (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. LOYALTY_VISITS Table
CREATE TABLE loyalty_visits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    visit_date DATE DEFAULT CURRENT_DATE,
    points_earned INTEGER DEFAULT 0
);

-- Insert Default Admin User (Password: admin123)
-- bcrypt hash for 'admin123'
INSERT INTO users (name, email, phone, password_hash, role) 
VALUES ('Admin', 'admin@cms.com', '0000000000', '$2a$10$Xm/Iq.Hn9H.3f4vC.P0F/.zV6T0eCjZk0v9F9K5V1kG3q6l6t4vK6', 'admin');

-- Insert Sample Menu Items
INSERT INTO menu_items (name, description, price, category, image_url) VALUES 
('Veg Thali', 'Complete meal with dal, rice, roti, and sabzi.', 80.00, 'Meals', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200'),
('Chicken Biryani', 'Aromatic basmati rice with spiced chicken.', 120.00, 'Meals', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200'),
('Masala Dosa', 'Crispy crepe stuffed with spiced potato filling.', 60.00, 'Snacks', 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=200'),
('Samosa (2 pcs)', 'Fried pastry with savory potato filling.', 20.00, 'Snacks', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200'),
('Cold Coffee', 'Chilled coffee blended with milk and ice cream.', 40.00, 'Beverages', 'https://images.unsplash.com/photo-1461023058943-07cb1ce8db1b?w=200'),
('Masala Chai', 'Traditional Indian spiced tea.', 15.00, 'Beverages', 'https://images.unsplash.com/photo-1571934811356-5cc50f160c9f?w=200');
