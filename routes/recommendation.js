const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

// Routes pour les recommandations de produits
router.get('/related/:productId', recommendationController.getRelatedProducts);
router.get('/best-sellers', recommendationController.getBestSellers);
router.get('/top-rated', recommendationController.getTopRated);
router.get('/recent', recommendationController.getRecentProducts);
router.get('/personalized', recommendationController.getPersonalizedRecommendations);

module.exports = router;
