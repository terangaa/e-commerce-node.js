const express = require('express');
const router = express.Router();
const productVariantController = require('../controllers/productVariantController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

/* ─────────────────────────────
   📦 VARIANTS ROUTES (PUBLIC)
───────────────────────────── */

// 🔍 Get variants of a product
router.get('/product/:productId', productVariantController.getProductVariants);

// 📊 Get attributes (size, color, etc.)
router.get('/product/:productId/attributes', productVariantController.getProductVariantAttributes);

// 🎯 Filter variants by attribute
router.get('/product/:productId/filter', productVariantController.getVariantsByAttribute);

// 🔎 Get variant by ID
router.get('/:id', productVariantController.getVariantById);

/* ─────────────────────────────
   🔐 ADMIN ROUTES (SECURE)
───────────────────────────── */

// ➕ Create variant (admin only)
router.post(
    '/',
    authenticateToken,
    isAdmin,
    productVariantController.createVariant
);

// ✏️ Update variant (admin only)
router.put(
    '/:id',
    authenticateToken,
    isAdmin,
    productVariantController.updateVariant
);

// 🗑 Delete variant (admin only)
router.delete(
    '/:id',
    authenticateToken,
    isAdmin,
    productVariantController.deleteVariant
);

// 📦 Update stock (admin only)
router.patch(
    '/:id/stock',
    authenticateToken,
    isAdmin,
    productVariantController.updateStock
);

module.exports = router;