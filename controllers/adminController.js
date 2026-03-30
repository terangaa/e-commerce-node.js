const { Product, Category, Order, OrderItem } = require('../models');

async function createCategory(req, res, next) {
  try {
    const { name, description } = req.body;
    const category = await Category.create({ name, description });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

async function listCategories(req, res, next) {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    await category.update(req.body);
    res.json(category);
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    await category.destroy();
    res.json({ message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const { name, description, price, stock, imageUrl, categoryId } = req.body;
    const product = await Product.create({ name, description, price, stock, imageUrl, categoryId });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

async function listProductsAdmin(req, res, next) {
  try {
    const products = await Product.findAll({ include: Category });
    res.json(products);
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await product.update(req.body);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await product.destroy();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
}

async function listOrdersAdmin(req, res, next) {
  try {
    const orders = await Order.findAll({ include: [{ model: OrderItem, include: [Product] }] });
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createCategory,
  listCategories,
  updateCategory,
  deleteCategory,
  createProduct,
  listProductsAdmin,
  updateProduct,
  deleteProduct,
  listOrdersAdmin,
};