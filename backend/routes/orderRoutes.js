const express = require('express');
const router = express.Router();
const { createOrder, getUserOrders, updateOrderStatus, getAllOrders } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createOrder)
    .get(protect, authorize('admin'), getAllOrders);

router.get('/myorders', protect, getUserOrders);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);

module.exports = router;
