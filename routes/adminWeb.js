const express = require('express');
const multer = require('multer');
const {
  dashboard,
  showAddProduct,
  addProduct,
  showEditProduct,
  updateProduct,
  deleteProduct,
  addCategory,
  deleteCategory,
  listOrders,
  updateOrderStatus,
  showThiakThiakDelivery,
  assignThiakThiakDelivery,
  testEmail,
} = require('../controllers/adminWebController');
const { ensureAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = file.originalname.split('.').pop();
    cb(null, `${unique}.${ext}`);
  },
});

const upload = multer({ storage });

router.get('/dashboard', ensureAdmin, dashboard);
router.get('/products/add', ensureAdmin, showAddProduct);
router.post('/products/add', ensureAdmin, upload.single('image'), addProduct);
// Modification produit
router.get('/products/:id/edit', ensureAdmin, showEditProduct);
router.post('/products/:id/edit', ensureAdmin, upload.single('image'), updateProduct);
router.post('/products/:id/delete', ensureAdmin, deleteProduct);
router.post('/categories/add', ensureAdmin, addCategory);
router.post('/categories/:id/delete', ensureAdmin, deleteCategory);
router.get('/orders', ensureAdmin, listOrders);
router.post('/orders/:id/status', ensureAdmin, updateOrderStatus);
router.get('/orders/:id/delivery/thiak-thiak', ensureAdmin, showThiakThiakDelivery);
router.post('/orders/:id/delivery/thiak-thiak', ensureAdmin, assignThiakThiakDelivery);
router.get('/test-email', ensureAdmin, testEmail);

module.exports = router;