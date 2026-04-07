const express = require('express');
const router = express.Router();
const productVariantController = require('../controllers/productVariantController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Routes pour les variantes de produits
router.get('/product/:productId', productVariantController.getProductVariants);
router.get('/product/:productId/attributes', productVariantController.getProductVariantAttributes);
router.get('/:id', productVariantController.getVariantById);
router.post('/', authenticateToken, isAdmin, productVariantController.createVariant);
router.put('/:id', authenticateToken, isAdmin, productVariantController.updateVariant);
router.delete('/:id', authenticateToken, isAdmin, productVariantController.deleteVariant);
router.patch('/:id/stock', authenticateToken, isAdmin, productVariantController.updateStock);

module.exports = router;
