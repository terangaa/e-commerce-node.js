const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const { Category, Product, Order, OrderItem, User } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// ================= CLOUDINARY UPLOAD =================
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'products',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// ------------------- DASHBOARD -------------------
async function dashboard(req, res, next) {
  try {
    const categories = await Category.findAll();
    const products = await Product.findAll({ include: Category });
    const orders = await Order.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{ model: OrderItem, include: [Product] }]
    });

    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role']
    });

    res.render('admin/dashboard', {
      user: req.session.user,
      categories,
      products,
      orders,
      users
    });

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
    user: req.session.user
  });
}

// ✅ CREATE PRODUCT AVEC CLOUDINARY
async function addProduct(req, res, next) {
  try {
    const { name, description, price, stock, categoryId, status } = req.body;

    if (!name || !price || !categoryId) {
      return res.send("Champs requis manquants");
    }

    let imageUrl = null;

    // 🔥 UPLOAD CLOUDINARY
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    await Product.create({
      name,
      description,
      price,
      stock,
      categoryId,
      status: status === 'actif' ? 'available' : 'unavailable',
      imageUrl
    });

    res.redirect('/admin/dashboard');

  } catch (err) {
    next(err);
  }
}

// ------------------- EDIT PRODUCT -------------------
async function showEditProduct(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);
    const categories = await Category.findAll();

    res.render('admin/addProduct', {
      categories,
      formData: product,
      error: null,
      success: null,
      user: req.session.user
    });

  } catch (err) {
    next(err);
  }
}

// ✅ UPDATE AVEC CLOUDINARY
async function updateProduct(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) return res.send("Produit introuvable");

    const { name, description, price, stock, categoryId, status } = req.body;

    product.name = name;
    product.description = description;
    product.price = price;
    product.stock = stock;
    product.categoryId = categoryId;
    product.status = status === 'actif' ? 'available' : 'unavailable';

    // 🔥 UPDATE IMAGE CLOUDINARY
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      product.imageUrl = result.secure_url;
    }

    await product.save();

    res.redirect('/admin/dashboard');

  } catch (err) {
    next(err);
  }
}

// ------------------- DELETE -------------------
async function deleteProduct(req, res) {
  const product = await Product.findByPk(req.params.id);
  if (product) await product.destroy();
  res.redirect('/admin/dashboard');
}

// ------------------- USERS -------------------
async function listUsers(req, res) {
  const users = await User.findAll();
  res.render('admin/users', { users, user: req.session.user });
}

async function addUser(req, res) {
  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    passwordHash: hash,
    role: 'user'
  });

  res.redirect('/admin/users');
}

async function deleteUser(req, res) {
  await User.destroy({ where: { id: req.params.id } });
  res.redirect('/admin/users');
}

async function makeAdmin(req, res) {
  const user = await User.findByPk(req.params.id);
  user.role = 'admin';
  await user.save();
  res.redirect('/admin/users');
}

// ------------------- CATEGORIES -------------------
async function addCategory(req, res) {
  await Category.create({ name: req.body.name });
  res.redirect('/admin/dashboard');
}

async function deleteCategory(req, res) {
  await Category.destroy({ where: { id: req.params.id } });
  res.redirect('/admin/dashboard');
}

// ------------------- ORDERS -------------------
async function listOrders(req, res) {
  const orders = await Order.findAll({
    include: [{ model: OrderItem, include: [Product] }]
  });

  res.render('admin/orders', {
    orders,
    user: req.session.user
  });
}

async function updateOrderStatus(req, res) {
  const order = await Order.findByPk(req.params.id);
  order.status = req.body.status;
  await order.save();
  res.redirect('/admin/orders');
}

// ------------------- DELIVERY -------------------
async function showThiakThiakDelivery(req, res) {
  res.send("Livraison Thiak-Thiak");
}

async function assignThiakThiakDelivery(req, res) {
  res.send("Livreur assigné");
}

// ------------------- EXPORT -------------------
module.exports = {
  dashboard,
  showAddProduct,
  addProduct,
  showEditProduct,
  updateProduct,
  deleteProduct,
  listUsers,
  addUser,
  deleteUser,
  makeAdmin,
  addCategory,
  deleteCategory,
  listOrders,
  updateOrderStatus,
  showThiakThiakDelivery,
  assignThiakThiakDelivery
};