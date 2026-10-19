const express = require('express');
const router = express.Router();
const { getDashboardStats, getAiForecast, getReportsSummary } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, authorize('admin'), getDashboardStats);
router.get('/summary', protect, authorize('admin'), getReportsSummary);
router.get('/forecast', protect, authorize('admin'), getAiForecast);

module.exports = router;
