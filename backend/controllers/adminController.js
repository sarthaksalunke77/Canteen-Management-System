const db = require('../config/db');
const { getFallbackOrders } = require('./orderController');

exports.getReportsSummary = async (req, res) => {
    try {
        const orders = getFallbackOrders ? getFallbackOrders() : [];
        const totalOrders = orders.length;
        const totalRevenue = orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + (o.total || 0), 0);
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayOrders = orders.filter(o => (o.created_at || '').slice(0, 10) === todayStr).length;
        const todayRevenue = orders
            .filter(o => (o.created_at || '').slice(0, 10) === todayStr && o.status !== 'Cancelled')
            .reduce((sum, o) => sum + (o.total || 0), 0);
        const pendingOrders = orders.filter(o => ['Received', 'Preparing'].includes(o.status)).length;

        const categoryStats = [
            { category: 'Meals', count: 3, revenue: 310 },
            { category: 'Snacks', count: 3, revenue: 130 },
            { category: 'Beverages', count: 3, revenue: 80 },
            { category: 'Desserts', count: 1, revenue: 30 }
        ];

        const statusCounts = {};
        orders.forEach(o => {
            statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
        });
        const statusBreakdown = Object.keys(statusCounts).map(s => ({ status: s, count: statusCounts[s] }));

        res.json({
            totalOrders,
            totalRevenue,
            todayOrders,
            todayRevenue,
            pendingOrders,
            categoryStats,
            recentOrders: orders.slice(0, 10),
            statusBreakdown
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getDashboardStats = async (req, res) => {
    exports.getReportsSummary(req, res);
};

exports.getAiForecast = async (req, res) => {
    const forecast = [
        { name: 'Veg Thali', predicted_sales_next_week: 150, recommendation: 'Increase stock of rice and dal.' },
        { name: 'Cold Coffee', predicted_sales_next_week: 120, recommendation: 'High demand expected due to weather, stock up on milk.' },
        { name: 'Chicken Biryani', predicted_sales_next_week: 110, recommendation: 'Consistent weekend peak expected, prepare marinated chicken early.' }
    ];

    res.json({
        success: true,
        demo_mode: true,
        message: "AI Forecasting model (Demo) applied to historical sales.",
        forecast: forecast
    });
};
