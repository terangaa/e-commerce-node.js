const express = require('express');
const router = express.Router();
const { ensureAdmin } = require('../middlewares/authMiddleware');

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

// Middleware admin pour toutes les routes
router.use(ensureAdmin);

/////////////////////
// Catégories
/////////////////////
router.post('/categories', createCategory);
router.get('/categories', listCategories);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

/////////////////////
// Produits
/////////////////////
router.post('/products', createProduct);
router.get('/products', listProductsAdmin);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

/////////////////////
// Commandes
/////////////////////
router.get('/orders', listOrdersAdmin);

/////////////////////
// Gestion utilisateurs
/////////////////////
router.get('/users', listUsers);                  // Voir tous les utilisateurs
router.post('/users', addUser);                   // Ajouter utilisateur
router.delete('/users/:id', deleteUser);         // Supprimer utilisateur
router.put('/users/:id/make-admin', makeAdmin);  // Promouvoir en admin

module.exports = router;