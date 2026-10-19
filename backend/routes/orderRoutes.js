const express = require('express');
const router = express.Router();
const { createOrder, getAllOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(createOrder)
    .get(protect, authorize('admin'), getAllOrders);

router.get('/:id', getOrderById);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);

module.exports = router;
