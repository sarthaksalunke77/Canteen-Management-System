const express = require('express');
const router = express.Router();
const { getMenu, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem } = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(getMenu) // public access
    .post(protect, authorize('admin'), createMenuItem);

router.route('/:id')
    .get(getMenuItem)
    .put(protect, authorize('admin'), updateMenuItem)
    .delete(protect, authorize('admin'), deleteMenuItem);

module.exports = router;
