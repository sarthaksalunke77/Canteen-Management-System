const express = require('express');
const router = express.Router();
const { register, login, getMe, status, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/status', status);
router.post('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;

