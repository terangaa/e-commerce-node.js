const { Product, Category } = require('../models');

async function home(req, res, next) {
  try {
    const categories = await Category.findAll({ include: Product });
    const topProducts = await Product.findAll({ limit: 8, order: [['createdAt', 'DESC']] });
    res.render('home', { categories, topProducts, __: res.__, locale: req.getLocale(), user: req.session?.user || null });
  } catch (err) {
    next(err);
  }
}

async function listProducts(req, res, next) {
  try {
    const products = await Product.findAll({ include: Category });
    res.render('products', { products, __: res.__, locale: req.getLocale(), user: req.session?.user || null });
  } catch (err) {
    next(err);
  }
}

async function productDetails(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id, { include: Category });
    if (!product) return res.status(404).json({ error: res.__('product_not_found') });
    res.render('productDetails', { product, __: res.__, locale: req.getLocale(), user: req.session?.user || null });
  } catch (err) {
    next(err);
  }
}

module.exports = { home, listProducts, productDetails };