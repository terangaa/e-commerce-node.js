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

const {
  showThiakThiakDelivery,
  assignThiakThiakDelivery
} = require('../controllers/adminWebController');

const { ensureAdmin } = require('../middlewares/authMiddleware');

const { Order } = require('../models');

// Middleware admin global
router.use(ensureAdmin);




/* =========================
   CATEGORIES
========================= */
router.post('/categories', createCategory);
router.get('/categories', listCategories);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);




/* =========================
   PRODUITS
========================= */
router.post('/products', createProduct);
router.get('/products', listProductsAdmin);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);




/* =========================
   COMMANDES
========================= */

// Liste commandes
router.get('/orders', listOrdersAdmin);

// DETAIL / EDIT commande
router.get('/orders/edit/:id', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: ['OrderItems']
    });

    if (!order) {
      return res.status(404).send('Commande introuvable');
    }

    res.render('admin/edit-order', { order });

  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur chargement commande');
  }
});

// UPDATE STATUT commande
router.post('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    await Order.update(
      { status },
      { where: { id: req.params.id } }
    );

    res.redirect('/admin/orders');

  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur mise à jour statut');
  }
});

// DELETE commande
router.post('/orders/delete/:id', async (req, res) => {
  try {
    await Order.destroy({
      where: { id: req.params.id }
    });

    res.redirect('/admin/orders');

  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur suppression commande');
  }
});

// Livraison Thiak-Thiak (ton existant)
router.get('/orders/:id/delivery/thiak-thiak', showThiakThiakDelivery);
router.post('/orders/:id/delivery/thiak-thiak', assignThiakThiakDelivery);




/* =========================
   UTILISATEURS
========================= */
router.get('/users', listUsers);
router.post('/users', addUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/make-admin', makeAdmin);
