const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// Routes publiques
router.get('/product/:productId', reviewController.getProductReviews);
router.get('/product/:productId/stats', reviewController.getReviewStats);

// Routes protégées (nécessitent une authentification)
router.post('/', reviewController.createReview);
router.get('/user', reviewController.getUserReviews);
router.put('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
