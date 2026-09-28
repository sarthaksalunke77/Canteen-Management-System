const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

exports.createOrder = async (req, res) => {
    const { items, payment_method } = req.body; // items: [{ menu_item_id, quantity, price }]
    const user_id = req.user.id;
    
    try {
        await db.query('BEGIN'); // Start transaction

        // Calculate total
        let total_amount = 0;
        for (let item of items) {
            // Get actual price from DB to prevent client-side manipulation
            const priceRes = await db.query('SELECT price FROM menu_items WHERE id = $1', [item.menu_item_id]);
            if (priceRes.rows.length === 0) throw new Error(`Invalid item ID: ${item.menu_item_id}`);
            total_amount += (priceRes.rows[0].price * item.quantity);
        }

        // Handle Wallet payment
        if (payment_method === 'Wallet') {
            const userRes = await db.query('SELECT wallet_balance FROM users WHERE id = $1', [user_id]);
            const balance = userRes.rows[0].wallet_balance;
            if (balance < total_amount) {
                await db.query('ROLLBACK');
                return res.status(400).json({ error: 'Insufficient wallet balance' });
            }
            // Deduct balance
            await db.query('UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2', [total_amount, user_id]);
        }

        // Insert Order
        const orderRes = await db.query(
            'INSERT INTO orders (user_id, total_amount, payment_method, payment_status) VALUES ($1, $2, $3, $4) RETURNING id',
            [user_id, total_amount, payment_method, payment_method === 'Cash' ? 'Pending' : 'Paid']
        );
        const order_id = orderRes.rows[0].id;

        // Insert Order Items
        for (let item of items) {
            const priceRes = await db.query('SELECT price FROM menu_items WHERE id = $1', [item.menu_item_id]);
            await db.query(
                'INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_time) VALUES ($1, $2, $3, $4)',
                [order_id, item.menu_item_id, item.quantity, priceRes.rows[0].price]
            );
        }

        // Generate Receipt
        const receiptNo = `REC-${Date.now()}-${order_id}`;
        await db.query(
            'INSERT INTO receipts (order_id, receipt_number) VALUES ($1, $2)',
            [order_id, receiptNo]
        );

        // Record Payment History
        await db.query(
            'INSERT INTO payment_history (user_id, order_id, amount, transaction_type, payment_gateway, gateway_transaction_id) VALUES ($1, $2, $3, $4, $5, $6)',
            [user_id, order_id, total_amount, 'Deduction', payment_method, uuidv4()]
        );

        await db.query('COMMIT');
        
        const newOrder = { order_id, receipt_number: receiptNo, total_amount, status: 'New' };
        
        // Emit Socket Event
        if (req.io) {
            req.io.emit('new_order', newOrder);
        }

        res.status(201).json({ success: true, data: newOrder });

    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
};

exports.getUserOrders = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT o.*, r.receipt_number 
            FROM orders o 
            LEFT JOIN receipts r ON o.id = r.order_id 
            WHERE o.user_id = $1 
            ORDER BY o.created_at DESC
        `, [req.user.id]);
        
        // Fetch items for each order
        const orders = result.rows;
        for (let order of orders) {
            const itemsRes = await db.query(`
                SELECT oi.quantity, oi.price_at_time, m.name 
                FROM order_items oi 
                JOIN menu_items m ON oi.menu_item_id = m.id 
                WHERE oi.order_id = $1
            `, [order.id]);
            order.items = itemsRes.rows;
        }

        res.json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT o.*, u.name as customer_name, u.phone 
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            ORDER BY o.created_at DESC
        `);
        
        const orders = result.rows;
        for (let order of orders) {
            const itemsRes = await db.query(`
                SELECT oi.quantity, oi.price_at_time, m.name 
                FROM order_items oi 
                JOIN menu_items m ON oi.menu_item_id = m.id 
                WHERE oi.order_id = $1
            `, [order.id]);
            order.items = itemsRes.rows;
        }

        res.json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    const { status } = req.body;
    try {
        const result = await db.query(
            'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        
        // Emit Socket Event
        if (req.io) {
            req.io.emit('order_status_update', { id: req.params.id, status });
        }
        
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
