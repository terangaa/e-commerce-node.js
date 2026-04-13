const path = require('path');
const { Category, Product, Order, OrderItem, User } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// ------------------- DASHBOARD -------------------
async function dashboard(req, res, next) {
  try {
    const selectedTab = req.query.tab || 'products';
    const categories = await Category.findAll();
    const products = await Product.findAll({ include: Category });
    const orders = await Order.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{
        model: OrderItem,
        include: [Product]
      }]
    });
    const users = await User.findAll({ attributes: ['id', 'name', 'email', 'role'] });

    // Analytics data for charts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentOrders = await Order.findAll({
      where: { createdAt: { [Op.gte]: sevenDaysAgo } },
      attributes: [
        [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
        [require('sequelize').fn('SUM', require('sequelize').col('totalAmount')), 'revenue']
      ],
      group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
      order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']],
      raw: true
    });

    const ordersByStatus = await Order.findAll({
      attributes: [
        'deliveryStatus',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['deliveryStatus'],
      raw: true
    });

    const error = req.session.adminError || null;
    const success = req.session.adminSuccess || null;
    delete req.session.adminError;
    delete req.session.adminSuccess;

    res.render('admin/dashboard', {
      user: req.session.user,
      selectedTab,
      categories,
      products,
      orders,
      users,
      recentOrders,
      ordersByStatus,
      error,
      success
    });
  } catch (err) {
    next(err);
  }
}

async function showCategories(req, res, next) {
  try {
    req.query.tab = 'categories';
    return dashboard(req, res, next);
  } catch (err) {
    next(err);
  }
}

// ------------------- UTILISATEURS -------------------
async function listUsers(req, res, next) {
  try {
    const users = await User.findAll({ attributes: ['id', 'name', 'email', 'role'] });
    res.render('admin/users', { users, user: req.session.user, error: null, success: null });
  } catch (err) {
    req.session.adminError = err.message;
    res.redirect('/admin/dashboard');
  }
}

async function addUser(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      req.session.adminError = 'Tous les champs sont requis';
      return res.redirect('/admin/users');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, passwordHash: hashedPassword, role: 'user' });
    req.session.adminSuccess = `Utilisateur ${name} ajouté avec succès`;
    res.redirect('/admin/users');
  } catch (err) {
    req.session.adminError = err.message;
    res.redirect('/admin/users');
  }
}

async function deleteUser(req, res, next) {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      req.session.adminError = 'Utilisateur introuvable';
      return res.redirect('/admin/users');
    }
    await user.destroy();
    req.session.adminSuccess = 'Utilisateur supprimé';
    res.redirect('/admin/users');
  } catch (err) {
    req.session.adminError = err.message;
    res.redirect('/admin/users');
  }
}

async function makeAdmin(req, res, next) {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      req.session.adminError = 'Utilisateur introuvable';
      return res.redirect('/admin/users');
    }
    user.role = 'admin';
    await user.save();
    req.session.adminSuccess = `${user.name} est maintenant admin`;
    res.redirect('/admin/users');
  } catch (err) {
    req.session.adminError = err.message;
    res.redirect('/admin/users');
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
    const imageUrl = req.file ? `/uploads/${path.relative(path.join('public', 'uploads'), req.file.path).replace(/\\/g, '/')}` : null;

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

    status = (status === 'actif') ? 'available' : 'unavailable';

    product.name = name;
    product.description = description;
    product.price = price;
    product.stock = stock;
    product.categoryId = categoryId;
    product.status = status;
    if (req.file) product.imageUrl = `/uploads/${path.relative(path.join('public', 'uploads'), req.file.path).replace(/\\/g, '/')}`;
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
// controllers/adminWebController.js
async function showThiakThiakDelivery(req, res, next) {
  try {
    res.send(`Formulaire livraison Thiak-Thiak pour la commande ${req.params.id}`);
  } catch (err) {
    next(err);
  }
}

async function assignThiakThiakDelivery(req, res, next) {
  try {
    // Exemple : assigner un livreur
    res.send(`Livreur Thiak-Thiak assigné pour la commande ${req.params.id}`);
  } catch (err) {
    next(err);
  }
}

module.exports = { showThiakThiakDelivery, assignThiakThiakDelivery };

// ------------------- EXPORT -------------------
module.exports = {
  dashboard,
  showCategories,
  listUsers,
  addUser,
  deleteUser,
  makeAdmin,
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
  assignThiakThiakDelivery
};