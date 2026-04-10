const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { ensureAdmin } = require('../middlewares/authMiddleware');
const { Category } = require('../models');

const normalizeFolderName = (name) => {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'autres';
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const categoryId = req.body.categoryId;
    let uploadFolder = path.join('public', 'uploads');

    if (categoryId) {
      Category.findByPk(categoryId)
        .then(category => {
          if (category && category.name) {
            const folderName = normalizeFolderName(category.name);
            uploadFolder = path.join('public', 'uploads', folderName);
          }
          return fs.promises.mkdir(uploadFolder, { recursive: true });
        })
        .then(() => cb(null, uploadFolder))
        .catch(cb);
    } else {
      fs.promises.mkdir(uploadFolder, { recursive: true })
        .then(() => cb(null, uploadFolder))
        .catch(cb);
    }
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = file.originalname.split('.').pop();
    cb(null, `${unique}.${ext}`);
  }
});
const upload = multer({ storage });

const {
  dashboard,
  showCategories,
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
  listUsers,
  addUser,
  deleteUser,
  makeAdmin
} = require('../controllers/adminWebController');

// Middleware admin
router.use(ensureAdmin);

/////////////////////
// Dashboard
/////////////////////
router.get('/dashboard', dashboard);

/////////////////////
// Utilisateurs
/////////////////////
router.get('/users', listUsers);             // Liste tous les utilisateurs
router.post('/users', addUser);             // Ajouter un utilisateur
router.post('/users/:id/delete', deleteUser); // Supprimer un utilisateur
router.post('/users/:id/make-admin', makeAdmin); // Promouvoir un utilisateur en admin

/////////////////////
// Produits
/////////////////////
router.get('/products/add', showAddProduct);
router.post('/products/add', upload.single('image'), addProduct);
router.get('/products/:id/edit', showEditProduct);
router.post('/products/:id/edit', upload.single('image'), updateProduct);
router.post('/products/:id/delete', deleteProduct);

/////////////////////
// Catégories
/////////////////////
router.get('/categories', showCategories);
router.post('/categories', addCategory);
router.post('/categories/:id/delete', deleteCategory);

/////////////////////
// Commandes
/////////////////////
router.get('/orders', listOrders);
router.post('/orders/:id/status', updateOrderStatus);
router.get('/orders/:id/delivery/thiak-thiak', showThiakThiakDelivery);
router.post('/orders/:id/delivery/thiak-thiak', assignThiakThiakDelivery);

// /////////////////////
// Test email (optionnel)
// /////////////////////
// router.get('/test-email', testEmail);

module.exports = router;