const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Routes pour le suivi des commandes
router.get('/order/:orderId', authenticateToken, trackingController.getOrderTracking);
router.get('/stats', authenticateToken, isAdmin, trackingController.getTrackingStats);
router.get('/all', authenticateToken, isAdmin, trackingController.getAllOrdersWithTracking);
router.put('/order/:orderId/status', authenticateToken, isAdmin, trackingController.updateOrderStatus);

module.exports = router;
