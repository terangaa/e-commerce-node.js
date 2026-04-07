const { Category, Product, Order, OrderItem } = require('../models');
const { Op } = require('sequelize');

// ------------------- DASHBOARD -------------------
async function dashboard(req, res, next) {
  try {
    const categories = await Category.findAll();
    const products = await Product.findAll({ include: Category });
    const orders = await Order.findAll({ limit: 10, order: [['createdAt', 'DESC']] });
    const error = req.session.adminError || null;
    const success = req.session.adminSuccess || null;
    delete req.session.adminError;
    delete req.session.adminSuccess;
    res.render('admin/dashboard', { user: req.session.user, categories, products, orders, error, success });
  } catch (err) {
    next(err);
  }
}

// ------------------- PRODUITS -------------------
async function showAddProduct(req, res) {
  const categories = await Category.findAll();
  res.render('admin/addProduct', {
    categories,
    formData: {},
    error: null,
    success: null,
    user: req.session.user,
    locale: req.query.lang || 'fr'
  });
}

async function addProduct(req, res, next) {
  try {
    let { name, description, price, stock, categoryId, status } = req.body;
    const imageUrl = req.file ? `/public/uploads/${req.file.filename}` : null;

    if (!name || !price || !categoryId || !status) {
      return res.render('admin/addProduct', {
        categories: await Category.findAll(),
        formData: req.body,
        error: 'Champs requis manquants',
        success: null,
        user: req.session.user,
        locale: req.query.lang || 'fr'
      });
    }

    // Transformation status
    status = (status === 'actif') ? 'available' : 'unavailable';

    await Product.create({ name, description, price, stock, categoryId, status, imageUrl });
    req.session.adminSuccess = 'Produit ajouté avec succès';
    res.redirect('/admin/dashboard');
  } catch (err) {
    next(err);
  }
}

async function showEditProduct(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      req.session.adminError = 'Produit introuvable';
      return res.redirect('/admin/dashboard');
    }
    const categories = await Category.findAll();
    res.render('admin/addProduct', {
      categories,
      formData: product,
      error: null,
      success: null,
      user: req.session.user,
      locale: req.query.lang || 'fr'
    });
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    let { name, description, price, stock, categoryId, status } = req.body;
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      req.session.adminError = 'Produit introuvable';
      return res.redirect('/admin/dashboard');
    }

    // Transformation status
    status = (status === 'actif') ? 'available' : 'unavailable';

    product.name = name;
    product.description = description;
    product.price = price;
    product.stock = stock;
    product.categoryId = categoryId;
    product.status = status;
    if (req.file) product.imageUrl = `/public/uploads/${req.file.filename}`;
    await product.save();

    req.session.adminSuccess = 'Produit mis à jour avec succès';
    res.redirect('/admin/dashboard');
  } catch (err) {
    next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      req.session.adminError = 'Produit introuvable';
      return res.redirect('/admin/dashboard');
    }
    await product.destroy();
    req.session.adminSuccess = 'Produit supprimé avec succès';
    res.redirect('/admin/dashboard');
  } catch (err) {
    next(err);
  }
}

// ------------------- CATÉGORIES -------------------
async function addCategory(req, res, next) {
  try {
    const { name } = req.body;
    if (!name) {
      req.session.adminError = 'Nom de catégorie requis';
      return res.redirect('/admin/dashboard');
    }
    await Category.create({ name, description: '' });
    res.redirect('/admin/dashboard');
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      req.session.adminError = 'Catégorie introuvable';
      return res.redirect('/admin/dashboard');
    }
    await category.destroy();
    res.redirect('/admin/dashboard');
  } catch (err) {
    next(err);
  }
}

// ------------------- COMMANDES -------------------
async function listOrders(req, res, next) {
  try {
    const status = req.query.status;
    const from = req.query.from;
    const to = req.query.to;

    const where = {};
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to) where.createdAt[Op.lte] = new Date(to);
    }

    const orders = await Order.findAll({
      where,
      include: [{ model: OrderItem, include: [Product] }],
      order: [['createdAt', 'DESC']],
    });
    res.render('admin/orders', { user: req.session.user, orders, status, from, to });
  } catch (err) {
    next(err);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      req.session.adminError = 'Commande introuvable';
      return res.redirect('/admin/orders');
    }
    const status = req.body.status;
    const allowed = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      req.session.adminError = 'Statut non valide';
      return res.redirect('/admin/orders');
    }
    order.status = status;
    await order.save();
    res.redirect('/admin/orders');
  } catch (err) {
    next(err);
  }
}

// ------------------- LIVRAISON THIAK-THIAK -------------------
async function showThiakThiakDelivery(req, res, next) {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      req.session.adminError = 'Commande introuvable';
      return res.redirect('/admin/dashboard');
    }
    res.render('admin/deliveryThiakThiak', { user: req.session.user, order, error: null });
  } catch (err) {
    next(err);
  }
}

async function assignThiakThiakDelivery(req, res, next) {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      req.session.adminError = 'Commande introuvable';
      return res.redirect('/admin/dashboard');
    }

    const { driverName, deliveryLat, deliveryLng } = req.body;
    if (!driverName || !deliveryLat || !deliveryLng) {
      return res.render('admin/deliveryThiakThiak', {
        user: req.session.user,
        order,
        error: 'Tous les champs sont requis pour activer la livraison thiak-thiak',
      });
    }

    order.deliveryMethod = 'thiak-thiak';
    order.deliveryStatus = 'assigned';
    order.deliveryDriver = driverName;
    order.deliveryLat = parseFloat(deliveryLat);
    order.deliveryLng = parseFloat(deliveryLng);
    order.status = 'in_delivery';
    await order.save();

    req.session.adminSuccess = `Livraison thiak-thiak assignée à ${driverName} pour la commande #${order.id}`;
    res.redirect('/admin/dashboard');
  } catch (err) {
    next(err);
  }
}

// ------------------- EMAIL DE TEST -------------------
async function testEmail(req, res, next) {
  try {
    const { sendTestEmail } = require('../services/emailService');
    const info = await sendTestEmail();
    req.session.adminSuccess = `Email de test envoyé : messageId ${info.messageId}`;
    res.redirect('/admin/dashboard');
  } catch (err) {
    req.session.adminError = err.message || 'Échec test email';
    res.redirect('/admin/dashboard');
  }
}

// ------------------- EXPORT -------------------
module.exports = {
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
  testEmail
};