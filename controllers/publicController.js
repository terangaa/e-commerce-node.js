// ✅ CORRECT
const { sequelize, Product, Category } = require('../models');
const { Op } = require('sequelize');
const { sendContactNotification } = require('../services/emailService');
/* =========================
   HELPERS
========================= */
async function getCartData(req) {
  const cart = req.session.cart || [];
  const productIds = cart.map(i => i.productId);

  const products = productIds.length
    ? await Product.findAll({
        where: { id: productIds },
        include: [{ model: Category, as: 'category' }]
      })
    : [];

  const cartItems = cart.map(item => {
    const product = products.find(p => p.id === item.productId);

    return {
      product,
      quantity: item.quantity,
      total: product ? Number(product.price) * Number(item.quantity) : 0,
    };
  });

  const totalAmount = cartItems.reduce((sum, item) => sum + item.total, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return { cartItems, totalAmount, cartCount };
}

/* =========================
   HOME
========================= */
async function home(req, res, next) {
  try {
    const categories = await Category.findAll({
      include: [{ model: Product, as: 'products' }]
    });

    const topProducts = await Product.findAll({
      limit: 8,
      order: [['createdAt', 'DESC']],
      include: [{ model: Category, as: 'category' }]
    });

    const { cartItems, totalAmount, cartCount } = await getCartData(req);

    res.render('home', {
      categories,
      topProducts,
      cartItems,
      totalAmount,
      cartCount,
      user: req.session?.user || null,
      locale: req.getLocale(),
      currentPage: 'home'
    });

  } catch (err) {
    next(err);
  }
}

/* =========================
   PRODUCTS LIST
========================= */
async function listProducts(req, res, next) {
  try {
    const categories = await Category.findAll();
    const where = { status: 'available' };
    const selectedCategoryId = req.query.categoryId
      ? Number(req.query.categoryId)
      : null;
    const searchQuery = req.query.q || '';
    
    if (selectedCategoryId) {
      where.categoryId = selectedCategoryId;
    }
    if (searchQuery) {
      where[Op.or] = [
        { name: { [Op.like]: `%${searchQuery}%` } },
        { description: { [Op.like]: `%${searchQuery}%` } }
      ];
    }

    const products = await Product.findAll({
      where,
      include: [{ model: Category, as: 'category', required: false }]
    });

    const { cartItems, totalAmount, cartCount } = await getCartData(req);
    res.render('products', {
      products,
      categories,
      selectedCategoryId,
      searchQuery,
      cartItems,
      totalAmount,
      cartCount,
      user: req.session?.user || null,
      locale: req.getLocale(),
      currentPage: 'products'
    });
  } catch (err) {
    next(err);
  }
}
/* =========================
   PRODUCT DETAILS
========================= */
async function productDetails(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, as: 'category' }]
    });

    if (!product) return res.status(404).send('Produit introuvable');

    const { cartItems, totalAmount, cartCount } = await getCartData(req);

    res.render('productDetails', {
      product,
      cartItems,
      totalAmount,
      cartCount,
      user: req.session?.user || null,
      locale: req.getLocale(),
      currentPage: 'products'
    });

  } catch (err) {
    next(err);
  }
}

/* =========================
   CART
========================= */
async function addToCart(req, res) {
  const productId = Number(req.body.productId);
  const quantity = Number(req.body.quantity) || 1;

  const cart = req.session.cart || [];
  const existing = cart.find(i => i.productId === productId);

  if (existing) existing.quantity += quantity;
  else cart.push({ productId, quantity });

  req.session.cart = cart;
  res.redirect('/products/cart');
}

async function cartPage(req, res) {
  const { cartItems, totalAmount, cartCount } = await getCartData(req);

  res.render('cart', {
    cartItems,
    totalAmount,
    cartCount,
    user: req.session?.user || null,
    locale: req.getLocale(),
    currentPage: 'cart'
  });
}

async function clearCart(req, res) {
  req.session.cart = [];
  res.redirect('/products/cart');
}

async function updateCart(req, res) {
  const cart = req.session.cart || [];
  const item = cart.find(i => i.productId === Number(req.body.productId));

  if (item) item.quantity = Number(req.body.quantity);

  req.session.cart = cart;
  res.redirect('/products/cart');
}

async function removeFromCart(req, res) {
  req.session.cart = (req.session.cart || [])
    .filter(i => i.productId !== Number(req.body.productId));

  res.redirect('/products/cart');
}

/* =========================
   CONTACT
========================= */
async function contactPage(req, res) {
  const { cartItems, totalAmount, cartCount } = await getCartData(req);

  res.render('contact', {
    cartItems,
    totalAmount,
    cartCount,
    user: req.session?.user || null,
    locale: req.getLocale(),
    success: req.session.contactSuccess || null,
    error: req.session.contactError || null,
    currentPage: 'contact'
  });

  delete req.session.contactSuccess;
  delete req.session.contactError;
}

async function contactSubmit(req, res) {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    req.session.contactError = 'Tous les champs sont requis.';
    return res.redirect('/contact');
  }

  await sendContactNotification(name, email, message);

  req.session.contactSuccess = 'Message envoyé avec succès.';
  res.redirect('/contact');
}

async function checkoutCart(req, res, next) {
  try {
    const cart = req.session.cart || [];

    if (!cart.length) {
      return res.status(400).send('Panier vide');
    }

    const items = cart.map(i => ({
      productId: Number(i.productId),
      quantity: Number(i.quantity)
    }));

    const {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      paymentMethod
    } = req.body;

    const { order } = await buildOrderAndNotify({
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      items,
      paymentMethod
    });

    req.session.cart = [];

    res.render('orderSuccess', {
      order,
      cartItems: [],
      totalAmount: 0,
      cartCount: 0,
      user: req.session?.user || null,
      locale: req.getLocale(),
      currentPage: 'cart'
    });

  } catch (err) {
    next(err);
  }
}

/* =========================
   EXPORT FINAL
========================= */
module.exports = {
  home,
  listProducts,
  productDetails,
  addToCart,
  cartPage,
  clearCart,
  updateCart,
  removeFromCart,
  contactPage,
  contactSubmit
};