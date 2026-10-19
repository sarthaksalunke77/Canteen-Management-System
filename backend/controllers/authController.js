const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id, role, username = 'Admin') => {
    return jwt.sign({ id, role, username }, process.env.JWT_SECRET || 'cms-secret-key-2026', { expiresIn: '7d' });
};

exports.register = async (req, res) => {
    const { name, email, phone, password } = req.body;
    try {
        // Check if user exists
        const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user
        const result = await db.query(
            'INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, phone, hashedPassword]
        );

        const user = result.rows[0];
        const token = generateToken(user.id, user.role);

        res.status(201).json({ success: true, token, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, username, password } = req.body;
    const identifier = username || email;

    // Direct check for default administrator credentials (admin / admin123)
    if ((identifier === 'admin' || identifier === 'admin@cms.com') && password === 'admin123') {
        const token = generateToken(1, 'admin');
        if (req.session) {
            req.session.isAdmin = true;
            req.session.adminUser = identifier;
        }
        return res.json({
            success: true,
            username: identifier,
            token,
            user: { id: 1, name: 'Admin', email: 'admin@cms.com', role: 'admin' }
        });
    }

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1 OR name = $1', [identifier]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user.id, user.role);
        if (req.session && user.role === 'admin') {
            req.session.isAdmin = true;
            req.session.adminUser = user.name || user.email;
        }
        delete user.password_hash;
        
        res.json({
            success: true,
            username: user.name || user.email,
            token,
            user
        });
    } catch (err) {
        // Fallback for demo when DB is not actively reachable
        if ((identifier === 'admin' || identifier === 'admin@cms.com') && password === 'admin123') {
            const token = generateToken(1, 'admin');
            if (req.session) {
                req.session.isAdmin = true;
                req.session.adminUser = identifier;
            }
            return res.json({
                success: true,
                username: identifier,
                token,
                user: { id: 1, name: 'Admin', email: 'admin@cms.com', role: 'admin' }
            });
        }
        res.status(500).json({ error: err.message });
    }
};

exports.status = (req, res) => {
    if (req.session && req.session.isAdmin) {
        return res.json({ isAdmin: true, username: req.session.adminUser || 'admin' });
    }

    // Check JWT header if passed
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        const token = req.headers.authorization.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cms-secret-key-2026');
            if (decoded && decoded.role === 'admin') {
                if (req.session) {
                    req.session.isAdmin = true;
                    req.session.adminUser = decoded.username || 'admin';
                }
                return res.json({ isAdmin: true, username: decoded.username || 'admin' });
            }
        } catch (e) {}
    }

    return res.json({ isAdmin: false, username: null });
};

exports.logout = (req, res) => {
    if (req.session) {
        req.session.destroy();
    }
    res.json({ success: true });
};

exports.getMe = async (req, res) => {
    try {
        const result = await db.query('SELECT id, name, email, phone, role, wallet_balance, created_at FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
