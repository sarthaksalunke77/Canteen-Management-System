const db = require('../config/db');

// In-memory fallback menu items if PostgreSQL is not active
let fallbackMenu = [
  { id: 1, name: 'Samosa', description: 'Crispy golden pastry filled with spiced potatoes and peas.', price: 20, category: 'Snacks', image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop', image_emoji: '🥟', available: 1 },
  { id: 2, name: 'Masala Dosa', description: 'Crispy crepe stuffed with savory mashed potato filling.', price: 50, category: 'South Indian', image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop', image_emoji: '🥞', available: 1 },
  { id: 3, name: 'Veg Biryani', description: 'Fragrant basmati rice cooked with garden fresh vegetables & spices.', price: 70, category: 'Meals', image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop', image_emoji: '🍚', available: 1 },
  { id: 4, name: 'Veg Noodles', description: 'Wok-tossed noodles with crunchy vegetables and oriental sauces.', price: 60, category: 'Chinese', image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop', image_emoji: '🍜', available: 1 },
  { id: 5, name: 'Cold Coffee', description: 'Creamy iced espresso blended with rich chocolate and vanilla.', price: 40, category: 'Beverages', image_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop', image_emoji: '☕', available: 1 },
  { id: 6, name: 'Veg Sandwich', description: 'Tri-layer toasted sandwich stuffed with fresh vegetables & cheese.', price: 50, category: 'Snacks', image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop', image_emoji: '🥪', available: 1 },
  { id: 7, name: 'Paneer Roll', description: 'Warm flatbread rolled with marinated paneer and tangy chutney.', price: 60, category: 'Snacks', image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop', image_emoji: '🌯', available: 1 },
  { id: 8, name: 'Masala Chai', description: 'Cardamom and ginger infused traditional hot brewed Indian tea.', price: 15, category: 'Tea & Coffee', image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop', image_emoji: '🍵', available: 1 },
  { id: 9, name: 'Veg Thali', description: 'Complete traditional meal with dal, seasonal sabzi, roti, rice & salad.', price: 80, category: 'Meals', image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop', image_emoji: '🍱', available: 1 },
  { id: 10, name: 'Gulab Jamun (2 pcs)', description: 'Melt-in-mouth soft dumplings immersed in rose-cardamom sugar syrup.', price: 30, category: 'Desserts', image_url: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&auto=format&fit=crop', image_emoji: '🍨', available: 1 }
];

const FOOD_IMAGE_MAP = {
  'samosa': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop',
  'dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop',
  'biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop',
  'rice': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop',
  'noodle': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop',
  'chowmein': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop',
  'chinese': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop',
  'coffee': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop',
  'sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop',
  'roll': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop',
  'paneer': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop',
  'chai': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop',
  'tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop',
  'thali': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop',
  'jamun': 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&auto=format&fit=crop',
  'dessert': 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&auto=format&fit=crop',
  'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop',
  'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop',
  'lime': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop',
  'soda': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop',
  'juice': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&auto=format&fit=crop',
  'beverage': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop',
  'snack': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop',
  'meal': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop'
};

function getItemImageUrl(name, category, existingUrl) {
  if (existingUrl && typeof existingUrl === 'string' && existingUrl.startsWith('http')) {
    return existingUrl;
  }
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();
  for (const [key, url] of Object.entries(FOOD_IMAGE_MAP)) {
    if (n.includes(key)) return url;
  }
  for (const [key, url] of Object.entries(FOOD_IMAGE_MAP)) {
    if (c.includes(key)) return url;
  }
  return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop';
}

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
                image_url: getItemImageUrl(item.name, item.category, item.image_url),
                image_emoji: item.image_emoji || (item.image_url && !item.image_url.startsWith('http') ? item.image_url : '🍽️'),
                available: item.is_available !== false ? 1 : 0
            }));
            return res.json(mapped);
        }
        res.json(fallbackMenu.map(i => ({ ...i, image_url: getItemImageUrl(i.name, i.category, i.image_url) })));
    } catch (err) {
        // Fallback to internal catalog when DB is offline
        res.json(fallbackMenu.map(i => ({ ...i, image_url: getItemImageUrl(i.name, i.category, i.image_url) })));
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
