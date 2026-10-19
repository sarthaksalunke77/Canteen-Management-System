const db = require('../config/db');

// In-memory orders store fallback
let fallbackOrders = [];
let nextOrderId = 1001;

exports.createOrder = async (req, res) => {
    const { customer_name, customer_phone, items, total, payment_method, order_type, table_number } = req.body;
    
    if (!customer_name || !items || !total) {
        return res.status(400).json({ error: 'Missing required order details' });
    }

    const orderTotal = parseFloat(total);
    const orderItems = Array.isArray(items) ? items : [];

    try {
        const orderRes = await db.query(
            `INSERT INTO orders (total_amount, payment_method, payment_status, status) 
             VALUES ($1, $2, $3, 'Received') RETURNING id, created_at`,
            [orderTotal, payment_method || 'Cash', payment_method === 'Cash' ? 'Pending' : 'Paid']
        );
        const orderId = orderRes.rows[0].id;
        const createdAt = orderRes.rows[0].created_at;

        // Try inserting items if DB is ready
        for (const item of orderItems) {
            try {
                await db.query(
                    'INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_time) VALUES ($1, $2, $3, $4)',
                    [orderId, item.id, item.qty || 1, item.price]
                );
            } catch (itemErr) {}
        }

        const newOrder = {
            id: orderId,
            customer_name,
            customer_phone: customer_phone || '',
            items: orderItems,
            total: orderTotal,
            payment_method: payment_method || 'Cash',
            order_type: order_type || 'Dine In',
            table_number: table_number || '',
            status: 'Received',
            created_at: createdAt
        };

        // Cache in memory for quick retrieval
        fallbackOrders.unshift(newOrder);

        if (req.io) {
            req.io.emit('new_order', newOrder);
        }

        return res.status(201).json(newOrder);
    } catch (err) {
        // Fallback store
        const newOrder = {
            id: nextOrderId++,
            customer_name,
            customer_phone: customer_phone || '',
            items: orderItems,
            total: orderTotal,
            payment_method: payment_method || 'Cash',
            order_type: order_type || 'Dine In',
            table_number: table_number || '',
            status: 'Received',
            created_at: new Date().toISOString()
        };
        fallbackOrders.unshift(newOrder);

        if (req.io) {
            req.io.emit('new_order', newOrder);
        }

        return res.status(201).json(newOrder);
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT o.id, o.total_amount as total, o.status, o.payment_method, o.created_at
            FROM orders o 
            ORDER BY o.created_at DESC
        `);
        if (result.rows && result.rows.length > 0) {
            return res.json(result.rows);
        }
    } catch (err) {}
    
    res.json(fallbackOrders);
};

exports.getOrderById = async (req, res) => {
    const id = parseInt(req.params.id);
    const found = fallbackOrders.find(o => o.id === id);
    if (found) return res.json(found);

    try {
        const result = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            return res.json(result.rows[0]);
        }
    } catch (err) {}

    res.status(404).json({ error: 'Order not found' });
};

exports.updateOrderStatus = async (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    const validStatuses = ['Received', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        await db.query('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);
    } catch (err) {}

    const order = fallbackOrders.find(o => o.id === id);
    if (order) {
        order.status = status;
    }

    if (req.io) {
        req.io.emit('order_status_update', { id, status });
    }

    res.json(order || { id, status });
};

exports.getFallbackOrders = () => fallbackOrders;
