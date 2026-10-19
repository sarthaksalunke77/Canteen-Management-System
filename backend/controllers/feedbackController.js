// Feedback Controller — Handles student and faculty feedback
const db = require('../config/db');

let feedbackList = [
  {
    id: 1,
    name: 'Aarav Sharma',
    role: 'Computer Eng. Student',
    rating: 5,
    category: 'Food Quality',
    message: 'The Samosas and Masala Chai are absolutely unbeatable! Fast service even during the 1:15 PM rush.',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 2,
    name: 'Priya Patel',
    role: 'Biotech Student',
    rating: 5,
    category: 'Service Speed',
    message: 'The QR table ordering is a lifesaver. No standing in long lines anymore, just sit, scan, and order!',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 3,
    name: 'Prof. R. K. Verma',
    role: 'Faculty',
    rating: 5,
    category: 'Cleanliness',
    message: 'Very clean dining area and polite staff. The Veg Thali is fresh, balanced, and great value for money.',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

exports.getFeedback = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM feedback ORDER BY id DESC LIMIT 50');
    if (result.rows && result.rows.length > 0) {
      return res.json(result.rows);
    }
  } catch (err) {
    // In-memory fallback
  }
  res.json(feedbackList);
};

exports.addFeedback = async (req, res) => {
  const { name, role, rating, category, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ error: 'Name and message are required' });
  }

  const newEntry = {
    id: feedbackList.length + 1,
    name: name.trim(),
    role: (role || 'Student').trim(),
    rating: parseInt(rating) || 5,
    category: (category || 'General').trim(),
    message: message.trim(),
    created_at: new Date().toISOString()
  };

  try {
    const result = await db.query(
      `INSERT INTO feedback (name, role, rating, category, message, created_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [newEntry.name, newEntry.role, newEntry.rating, newEntry.category, newEntry.message, newEntry.created_at]
    );
    if (result.rows && result.rows.length > 0) {
      feedbackList.unshift(result.rows[0]);
      return res.status(201).json({ success: true, feedback: result.rows[0] });
    }
  } catch (err) {
    // In-memory fallback
  }

  feedbackList.unshift(newEntry);
  res.status(201).json({ success: true, feedback: newEntry });
};
