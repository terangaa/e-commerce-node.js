const express = require('express');
const multer = require('multer');
const { dashboard, showAddProduct, addProduct, deleteProduct } = require('../controllers/adminWebController');
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
router.post('/products/:id/delete', ensureAdmin, deleteProduct);

module.exports = router;