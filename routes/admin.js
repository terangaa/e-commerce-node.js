const express = require('express');
const router = express.Router();

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
  listUsers,
  addUser,
  deleteUser,
  makeAdmin
} = require('../controllers/adminController');

const { showThiakThiakDelivery, assignThiakThiakDelivery } = require('../controllers/adminWebController');
const { ensureAdmin } = require('../middlewares/authMiddleware');

// Middleware admin
router.use(ensureAdmin);

// Catégories
router.post('/categories', createCategory);
router.get('/categories', listCategories);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Produits
router.post('/products', createProduct);
router.get('/products', listProductsAdmin);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Commandes
router.get('/orders', listOrdersAdmin);
router.get('/orders/:id/delivery/thiak-thiak', showThiakThiakDelivery);
router.post('/orders/:id/delivery/thiak-thiak', assignThiakThiakDelivery);

// Utilisateurs
router.get('/users', listUsers);
router.post('/users', addUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/make-admin', makeAdmin);

module.exports = router;