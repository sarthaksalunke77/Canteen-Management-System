const express = require('express');
const router = express.Router();
const { getDashboardStats, getAiForecast } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, authorize('admin'), getDashboardStats);
router.get('/forecast', protect, authorize('admin'), getAiForecast);

module.exports = router;
