const express = require('express');
const {
  createCategory,
  listCategories,
  updateCategory,
  deleteCategory,
  createProduct,
  listProductsAdmin,
  updateProduct,
  deleteProduct,
  listOrdersAdmin,
} = require('../controllers/adminController');
const { showThiakThiakDelivery, assignThiakThiakDelivery } = require('../controllers/adminWebController');
const { ensureAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(ensureAdmin);

router.post('/categories', createCategory);
router.get('/categories', listCategories);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

router.post('/products', createProduct);
router.get('/products', listProductsAdmin);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

router.get('/orders', listOrdersAdmin);
router.get('/orders/:id/delivery/thiak-thiak', showThiakThiakDelivery);
router.post('/orders/:id/delivery/thiak-thiak', assignThiakThiakDelivery);

module.exports = router;
