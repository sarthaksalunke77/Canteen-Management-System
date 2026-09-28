const db = require('../config/db');

exports.getMenu = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM menu_items ORDER BY category, id');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMenuItem = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM menu_items WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createMenuItem = async (req, res) => {
    const { name, description, price, category, image_url } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO menu_items (name, description, price, category, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, description, price, category, image_url]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateMenuItem = async (req, res) => {
    const { name, description, price, category, image_url, is_available } = req.body;
    try {
        const result = await db.query(
            'UPDATE menu_items SET name = $1, description = $2, price = $3, category = $4, image_url = $5, is_available = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
            [name, description, price, category, image_url, is_available, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteMenuItem = async (req, res) => {
    try {
        const result = await db.query('DELETE FROM menu_items WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
        res.json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
