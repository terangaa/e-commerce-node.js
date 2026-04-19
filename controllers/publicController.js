const { Product, Category } = require('../models');
const { buildOrderAndNotify } = require('./orderController');
const { sendContactNotification } = require('../services/emailService');

// Helper pour obtenir les données du panier
async function getCartData(req) {
  const cart = req.session.cart || [];
  const productIds = cart.map(i => i.productId);
  const products = productIds.length ? await Product.findAll({ where: { id: productIds }, include: Category }) : [];

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

async function home(req, res, next) {
  try {
    const categories = await Category.findAll({ include: Product });
    const topProducts = await Product.findAll({
      limit: 8,
      order: [['createdAt', 'DESC']],
      include: [Category]
    });
    const searchQuery = req.query.q || '';
    const { cartItems, totalAmount, cartCount } = await getCartData(req);
    res.render('home', { categories, topProducts, searchQuery, cartItems, totalAmount, cartCount, __: res.__, locale: req.getLocale(), user: req.session?.user || null, currentPage: 'home' });
  } catch (err) {
    next(err);
  }
}

async function listProducts(req, res, next) {
  try {
    const categories = await Category.findAll();
    const selectedCategoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
    const searchQuery = req.query.q || '';
    const where = { status: 'available' };

    if (selectedCategoryId) {
      where.categoryId = selectedCategoryId;
    }

    // Recherche textuelle
    if (searchQuery) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { name: { [Op.like]: `%${searchQuery}%` } },
        { description: { [Op.like]: `%${searchQuery}%` } }
      ];
    }

    const products = await Product.findAll({ where, include: Category });
    const { cartItems, totalAmount, cartCount } = await getCartData(req);
    res.render('products', {
      products,
      categories,
      selectedCategoryId,
      searchQuery,
      cartItems,
      totalAmount,
      cartCount,
      __: res.__,
      locale: req.getLocale(),
      user: req.session?.user || null,
      currentPage: 'products',
    });
  } catch (err) {
    next(err);
  }
}

async function productDetails(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id, { include: Category });
    if (!product) return res.status(404).json({ error: res.__('product_not_found') });
    const { cartItems, totalAmount, cartCount } = await getCartData(req);
    res.render('productDetails', { product, cartItems, totalAmount, cartCount, __: res.__, locale: req.getLocale(), user: req.session?.user || null, currentPage: 'products' });
  } catch (err) {
    next(err);
  }
}

async function addToCart(req, res, next) {
  try {
    const productId = Number(req.body.productId);
    const quantity = Number(req.body.quantity) || 1;

    const product = await Product.findByPk(productId);
    if (!product) return res.status(400).json({ error: 'Produit introuvable' });

    const cart = req.session.cart || [];
    const existing = cart.find(item => item.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ productId, quantity });
    }
    req.session.cart = cart;

    res.redirect('/products/cart');
  } catch (err) {
    next(err);
  }
}

async function cartPage(req, res, next) {
  try {
    const { cartItems, totalAmount, cartCount } = await getCartData(req);
    res.render('cart', {
      cartItems,
      totalAmount,
      cartCount,
      ownerWhatsApp: process.env.OWNER_WHATSAPP || "221711423982",
      __: res.__,
      locale: req.getLocale(),
      user: req.session?.user || null,
      currentPage: 'cart',
    });

    async function clearCart(req, res, next) {
      try {
        req.session.cart = [];
        res.redirect('/products/cart');
      } catch (err) {
        next(err);
      }
    }

    async function updateCart(req, res, next) {
      try {
        const productId = Number(req.body.productId);
        const quantity = Number(req.body.quantity);
        if (!Number.isFinite(productId) || !Number.isFinite(quantity) || quantity < 0) {
          return res.status(400).json({ error: 'Quantité invalide' });
        }
        const cart = req.session.cart || [];
        const item = cart.find(i => i.productId === productId);
        if (!item) {
          return res.status(404).json({ error: 'Produit non trouvé dans le panier' });
        }
        if (quantity === 0) {
          req.session.cart = cart.filter(i => i.productId !== productId);
        } else {
          item.quantity = quantity;
        }
        res.redirect('/products/cart');
      } catch (err) {
        next(err);
      }
    }

    async function removeFromCart(req, res, next) {
      try {
        const productId = Number(req.body.productId);
        req.session.cart = (req.session.cart || []).filter(i => i.productId !== productId);
        res.redirect('/products/cart');
      } catch (err) {
        next(err);
      }
    }

    async function checkoutCart(req, res, next) {
      try {
        const cart = req.session.cart || [];
        if (!cart.length) {
          return res.status(400).json({ error: 'Votre panier est vide' });
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

        const { order, emailStatus } = await buildOrderAndNotify({
          customerName,
          customerEmail,
          customerPhone,
          customerAddress,
          items,
          paymentMethod,
        });

        req.session.cart = [];

        res.render('orderSuccess', {
          order,
          emailStatus,
          cartItems: [],
          totalAmount: 0,
          cartCount: 0,

          // 🔥 FIX IMPORTANT
          ownerWhatsApp: process.env.OWNER_WHATSAPP || "221711423982",

          __: res.__,
          locale: req.getLocale(),
          user: req.session?.user || null,
          currentPage: 'cart'
        });

      } catch (err) {
        next(err);
      }
    }

    async function contactPage(req, res, next) {
      try {
        const { cartItems, totalAmount, cartCount } = await getCartData(req);
        res.render('contact', { cartItems, totalAmount, cartCount, __: res.__, locale: req.getLocale(), user: req.session?.user || null, success: req.session.contactSuccess || null, error: req.session.contactError || null, currentPage: 'contact' });
        delete req.session.contactSuccess;
        delete req.session.contactError;
      } catch (err) {
        next(err);
      }
    }

    async function contactSubmit(req, res, next) {
      try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
          req.session.contactError = 'Tous les champs sont requis.';
          return res.redirect('/contact');
        }
        // Log du message de contact
        console.log('[CONTACT]', { name, email, message, date: new Date().toISOString() });

        // Envoi d'email de notification (optionnel, ne bloque pas si échec)
        try {
          await sendContactNotification(name, email, message);
          console.log('[CONTACT] Email de notification envoyé avec succès');
        } catch (emailErr) {
          console.error('[CONTACT] Échec envoi email notification:', emailErr.message);
          // On continue même si l'email échoue
        }

        req.session.contactSuccess = 'Merci ! Votre message a été bien reçu. Nous vous répondrons rapidement.';
        res.redirect('/contact');
      } catch (err) {
        req.session.contactError = 'Erreur lors de l’envoi du message.';
        res.redirect('/contact');
      }
    }

    module.exports = { home, listProducts, productDetails, addToCart, cartPage, updateCart, removeFromCart, checkoutCart, clearCart, contactPage, contactSubmit };