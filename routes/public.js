const express = require('express');
const router = express.Router();

const {
  listProducts,
  productDetails,
  cartPage,
  addToCart,
  updateCart,
  removeFromCart,
  checkoutCart,
  clearCart,
  contactPage,
  contactSubmit
} = require('../controllers/publicController');

/* =========================
   SAFE WRAPPER CORRIGÉ
========================= */
function safe(fn, name) {
  if (typeof fn !== 'function') {
    throw new Error(`❌ Controller manquant ou mal importé: ${name}`);
  }
  return fn;
}

/* =========================
   PRODUITS
========================= */
router.get('/', safe(listProducts, 'listProducts'));

/* =========================
   CART
========================= */
router.get('/cart', safe(cartPage, 'cartPage'));
router.post('/cart/add', safe(addToCart, 'addToCart'));
router.post('/cart/update', safe(updateCart, 'updateCart'));
router.post('/cart/remove', safe(removeFromCart, 'removeFromCart'));
router.post('/cart/clear', safe(clearCart, 'clearCart'));
//uter.post('/cart/checkout', safe(checkoutCart, 'checkoutCart'));

/* =========================
   CONTACT
========================= */
router.get('/contact', safe(contactPage, 'contactPage'));
router.post('/contact', safe(contactSubmit, 'contactSubmit'));

/* =========================
   PRODUCT DETAILS (DERNIER)
========================= */
router.get('/:id', safe(productDetails, 'productDetails'));

module.exports = router;