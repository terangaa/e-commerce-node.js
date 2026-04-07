const express = require('express');
const { listProducts, productDetails, cartPage, addToCart, updateCart, removeFromCart, checkoutCart, clearCart, contactPage, contactSubmit } = require('../controllers/publicController');
const router = express.Router();

router.get('/', listProducts);
router.get('/cart', cartPage);
router.post('/cart/add', addToCart);
router.post('/cart/update', updateCart);
router.post('/cart/remove', removeFromCart);
router.post('/cart/checkout', checkoutCart);
router.post('/cart/clear', clearCart);
router.get('/contact', contactPage);
router.post('/contact', contactSubmit);
router.get('/:id', productDetails);

module.exports = router;
