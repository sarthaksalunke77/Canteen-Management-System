const db = require('../config/db');

exports.getDashboardStats = async (req, res) => {
    try {
        const totalOrdersRes = await db.query('SELECT COUNT(*) as count FROM orders');
        const todaySalesRes = await db.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE DATE(created_at) = CURRENT_DATE AND status != $1', ['Cancelled']);
        const pendingOrdersRes = await db.query('SELECT COUNT(*) as count FROM orders WHERE status IN ($1, $2)', ['New', 'Preparing']);
        const completedOrdersRes = await db.query('SELECT COUNT(*) as count FROM orders WHERE status = $1', ['Completed']);
        
        // Top selling items
        const topSellingRes = await db.query(`
            SELECT m.name, SUM(oi.quantity) as total_sold
            FROM order_items oi
            JOIN menu_items m ON oi.menu_item_id = m.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'Cancelled'
            GROUP BY m.id, m.name
            ORDER BY total_sold DESC
            LIMIT 5
        `);

        // Recent transactions
        const recentTransRes = await db.query(`
            SELECT ph.*, u.name as customer_name 
            FROM payment_history ph
            JOIN users u ON ph.user_id = u.id
            ORDER BY ph.created_at DESC LIMIT 10
        `);

        res.json({
            success: true,
            data: {
                totalOrders: parseInt(totalOrdersRes.rows[0].count),
                todaySales: parseFloat(todaySalesRes.rows[0].total),
                pendingOrders: parseInt(pendingOrdersRes.rows[0].count),
                completedOrders: parseInt(completedOrdersRes.rows[0].count),
                topSellingItems: topSellingRes.rows,
                recentTransactions: recentTransRes.rows
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAiForecast = async (req, res) => {
    // Simulated AI Forecasting based on historical data
    try {
        const topSellingRes = await db.query(`
            SELECT m.name, SUM(oi.quantity) as total_sold
            FROM order_items oi
            JOIN menu_items m ON oi.menu_item_id = m.id
            GROUP BY m.id, m.name
            ORDER BY total_sold DESC
            LIMIT 3
        `);
        
        let forecast = topSellingRes.rows.map(item => ({
            name: item.name,
            predicted_sales_next_week: Math.floor(parseInt(item.total_sold) * (1 + Math.random() * 0.5 + 0.1)),
            recommendation: `Increase stock for ingredients of ${item.name} by 20% due to upcoming trend.`
        }));

        if (forecast.length === 0) {
            forecast = [
                { name: 'Veg Thali', predicted_sales_next_week: 150, recommendation: 'Increase stock of rice and dal.' },
                { name: 'Cold Coffee', predicted_sales_next_week: 120, recommendation: 'High demand expected due to weather, stock up on milk.' }
            ];
        }

        res.json({
            success: true,
            demo_mode: true,
            message: "AI Forecasting model (Demo) applied to historical sales.",
            forecast: forecast
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
