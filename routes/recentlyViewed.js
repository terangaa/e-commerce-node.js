const express = require('express');
const router = express.Router();
const recentlyViewedController = require('../controllers/recentlyViewedController');
const { authenticateToken } = require('../middleware/auth');

// Routes pour les produits récemment consultés
router.get('/', authenticateToken, recentlyViewedController.getRecentlyViewed);
router.post('/', authenticateToken, recentlyViewedController.addToRecentlyViewed);
router.delete('/:productId', authenticateToken, recentlyViewedController.removeFromRecentlyViewed);
router.delete('/', authenticateToken, recentlyViewedController.clearRecentlyViewed);

// Routes pour les utilisateurs non connectés (via session)
router.get('/session', recentlyViewedController.getSessionRecentlyViewed);
router.post('/session', recentlyViewedController.addToSessionRecentlyViewed);

module.exports = router;
