const db = require('../config/db');

// In-memory fallback menu items if PostgreSQL is not active
let fallbackMenu = [
  { id: 1, name: 'Veg Thali', description: 'Complete meal with dal, rice, roti, and sabzi.', price: 80, category: 'Meals', image_emoji: '🍱', available: 1 },
  { id: 2, name: 'Chicken Biryani', description: 'Aromatic basmati rice with spiced chicken.', price: 120, category: 'Meals', image_emoji: '🍗', available: 1 },
  { id: 3, name: 'Masala Dosa', description: 'Crispy crepe stuffed with spiced potato filling.', price: 60, category: 'Snacks', image_emoji: '🥞', available: 1 },
  { id: 4, name: 'Samosa (2 pcs)', description: 'Fried pastry with savory potato filling.', price: 20, category: 'Snacks', image_emoji: '🥟', available: 1 },
  { id: 5, name: 'Cold Coffee', description: 'Chilled coffee blended with milk and ice cream.', price: 40, category: 'Beverages', image_emoji: '☕', available: 1 },
  { id: 6, name: 'Masala Chai', description: 'Traditional Indian spiced tea.', price: 15, category: 'Beverages', image_emoji: '🍵', available: 1 },
  { id: 7, name: 'Paneer Butter Masala', description: 'Cottage cheese cubes in rich tomato gravy.', price: 110, category: 'Meals', image_emoji: '🍲', available: 1 },
  { id: 8, name: 'Gulab Jamun (2 pcs)', description: 'Sweet milk-solid dumplings soaked in rose syrup.', price: 30, category: 'Desserts', image_emoji: '🍨', available: 1 },
  { id: 9, name: 'Veg Burger', description: 'Crispy veg patty with fresh lettuce and sauces.', price: 50, category: 'Snacks', image_emoji: '🍔', available: 1 },
  { id: 10, name: 'Fresh Lime Soda', description: 'Refreshing sparkling lime drink.', price: 25, category: 'Beverages', image_emoji: '🍹', available: 1 }
];

exports.getMenu = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM menu_items ORDER BY category, id');
        if (result.rows && result.rows.length > 0) {
            const mapped = result.rows.map(item => ({
                id: item.id,
                name: item.name,
                description: item.description,
                price: parseFloat(item.price),
                category: item.category,
                image_emoji: item.image_emoji || item.image_url || '🍽️',
                available: item.is_available !== false ? 1 : 0
            }));
            return res.json(mapped);
        }
        res.json(fallbackMenu);
    } catch (err) {
        // Fallback to internal catalog when DB is offline
        res.json(fallbackMenu);
    }
};

exports.getMenuItem = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const result = await db.query('SELECT * FROM menu_items WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            const item = result.rows[0];
            return res.json({
                id: item.id,
                name: item.name,
                description: item.description,
                price: parseFloat(item.price),
                category: item.category,
                image_emoji: item.image_emoji || item.image_url || '🍽️',
                available: item.is_available !== false ? 1 : 0
            });
        }
    } catch (err) {}
    
    const found = fallbackMenu.find(m => m.id === id);
    if (!found) return res.status(404).json({ error: 'Item not found' });
    res.json(found);
};

exports.createMenuItem = async (req, res) => {
    const { name, description, price, category, image_emoji, image_url } = req.body;
    const emoji = image_emoji || image_url || '🍽️';
    
    try {
        const result = await db.query(
            'INSERT INTO menu_items (name, description, price, category, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, description, parseFloat(price), category, emoji]
        );
        const item = result.rows[0];
        return res.status(201).json({
            id: item.id,
            name: item.name,
            description: item.description,
            price: parseFloat(item.price),
            category: item.category,
            image_emoji: emoji,
            available: 1
        });
    } catch (err) {
        const newItem = {
            id: fallbackMenu.length ? Math.max(...fallbackMenu.map(m => m.id)) + 1 : 1,
            name,
            description: description || '',
            price: parseFloat(price),
            category: category || 'Meals',
            image_emoji: emoji,
            available: 1
        };
        fallbackMenu.push(newItem);
        res.status(201).json(newItem);
    }
};

exports.updateMenuItem = async (req, res) => {
    const id = parseInt(req.params.id);
    const { name, description, price, category, image_emoji, image_url, available, is_available } = req.body;
    const isAvail = available !== undefined ? (available ? 1 : 0) : (is_available !== undefined ? (is_available ? 1 : 0) : 1);
    const emoji = image_emoji || image_url || '🍽️';

    try {
        const result = await db.query(
            'UPDATE menu_items SET name = $1, description = $2, price = $3, category = $4, image_url = $5, is_available = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
            [name, description, parseFloat(price), category, emoji, isAvail === 1, id]
        );
        if (result.rows.length > 0) {
            const item = result.rows[0];
            return res.json({
                id: item.id,
                name: item.name,
                description: item.description,
                price: parseFloat(item.price),
                category: item.category,
                image_emoji: emoji,
                available: isAvail
            });
        }
    } catch (err) {}

    const index = fallbackMenu.findIndex(m => m.id === id);
    if (index !== -1) {
        fallbackMenu[index] = {
            ...fallbackMenu[index],
            name: name !== undefined ? name : fallbackMenu[index].name,
            description: description !== undefined ? description : fallbackMenu[index].description,
            price: price !== undefined ? parseFloat(price) : fallbackMenu[index].price,
            category: category !== undefined ? category : fallbackMenu[index].category,
            image_emoji: emoji,
            available: isAvail
        };
        return res.json(fallbackMenu[index]);
    }
    res.status(404).json({ error: 'Item not found' });
};

exports.deleteMenuItem = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        await db.query('DELETE FROM menu_items WHERE id = $1', [id]);
    } catch (err) {}
    
    fallbackMenu = fallbackMenu.filter(m => m.id !== id);
    res.json({ success: true });
};
