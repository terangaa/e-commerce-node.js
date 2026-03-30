const { Category, Product, Order, OrderItem } = require('../models');

async function dashboard(req, res, next) {
  try {
    const categories = await Category.findAll();
    const products = await Product.findAll({ include: Category });
    const orders = await Order.findAll({ limit: 10, order: [['createdAt', 'DESC']] });
    const error = req.session.adminError || null;
    delete req.session.adminError;
    res.render('admin/dashboard', { user: req.session.user, categories, products, orders, error });
  } catch (err) {
    next(err);
  }
}

async function showAddProduct(req, res) {
  const categories = await Category.findAll();
  res.render('admin/addProduct', { categories, error: null });
}

async function addProduct(req, res, next) {
  try {
    const { name, description, price, stock, categoryId } = req.body;
    const imageUrl = req.file ? `/public/uploads/${req.file.filename}` : null;

    if (!name || !price || !categoryId) {
      return res.render('admin/addProduct', { categories: await Category.findAll(), error: 'Champs requis manquants' });
    }

    await Product.create({ name, description, price, stock, categoryId, imageUrl });
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
    res.redirect('/admin/dashboard');
  } catch (err) {
    next(err);
  }
}

module.exports = { dashboard, showAddProduct, addProduct, deleteProduct };