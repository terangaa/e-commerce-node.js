const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');

// Page de la liste de souhaits
router.get('/', wishlistController.wishlistPage);

// API routes
router.get('/api', wishlistController.getWishlist);
router.get('/api/count', wishlistController.getWishlistCount);
router.get('/api/check/:productId', wishlistController.checkWishlist);
router.post('/api/add', wishlistController.addToWishlist);
router.delete('/api/remove/:productId', wishlistController.removeFromWishlist);

module.exports = router;
