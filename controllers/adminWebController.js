const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const { Category, Product, Order, OrderItem, User } = require('../models');
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

// ================= DASHBOARD =================
async function dashboard(req, res, next) {
  try {
    const products = await Product.findAll({ include: Category });

    const categories = await Category.findAll(); // ✅ IMPORTANT FIX

    const orders = await Order.findAll({
      include: [{ model: OrderItem, include: [Product] }],
      order: [['createdAt', 'DESC']]
    });

    const users = await User.findAll();

    // 🔥 données pour charts (sinon EJS crash)
    const recentOrders = orders.slice(0, 10);

    const ordersByStatus = {
      pending: orders.filter(o => o.status === 'pending').length,
      paid: orders.filter(o => o.status === 'paid').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };

    res.render('admin/dashboard', {
      user: req.session.user,

      // DATA PRINCIPALE
      products,
      categories,
      orders,
      users,

      // FIX EJS ERROR VARIABLES
      selectedTab: req.query.tab || 'dashboard',
      error: null,

      // CHART DATA
      recentOrders,
      ordersByStatus
    });

  } catch (err) {
    next(err);
  }
}

// ================= ADD PRODUCT PAGE =================
// ================= ADD PRODUCT PAGE =================
async function showAddProduct(req, res) {
  try {
    const categories = await Category.findAll();

    return res.render('admin/addProduct', {
      user: req.session.user,
      formData: {},              // ✅ FIX IMPORTANT
      categories: categories || [],
      error: null,
      success: null
    });

  } catch (err) {
    console.error(err);

    return res.status(500).render('admin/addProduct', {
      user: req.session.user,
      formData: {},
      categories: [],
      error: "Erreur serveur",
      success: null
    });
  }
}

// ================= CREATE PRODUCT =================
async function addProduct(req, res) {
  try {
    const { name, price, description, stock, categoryId, status } = req.body;
    const categories = await Category.findAll();

    if (!name || !price) {
      return res.render('admin/addProduct', {
        user: req.session.user,
        formData: req.body,
        categories,
        error: "Nom et prix obligatoires",
        success: null
      });
    }

    // ✅ Upload Cloudinary
    let imageUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    const newProduct = await Product.create({
      name, price, description, stock, categoryId,
      status: status || 'available',
      imageUrl  // ✅ URL Cloudinary
    });

    return res.render('admin/addProduct', {
      user: req.session.user,
      formData: newProduct.dataValues, // ✅ imageUrl renvoyé au template
      categories,
      error: null,
      success: "Produit ajouté avec succès"
    });

  } catch (err) {
    console.error(err);
    return res.render('admin/addProduct', {
      user: req.session.user,
      formData: req.body,
      categories: [],
      error: "Erreur serveur",
      success: null
    });
  }
}
// ================= EDIT PRODUCT =================
async function showEditProduct(req, res) {
  try {
    const product = await Product.findByPk(req.params.id);
    const categories = await Category.findAll();

    if (!product) {
      return res.redirect('/admin/dashboard?tab=products');
    }

    return res.render('admin/addProduct', {
      user: req.session.user,
      formData: product,   // ✅ IMPORTANT
      categories,
      error: null,
      success: null
    });

  } catch (err) {
    console.error(err);
    return res.redirect('/admin/dashboard');
  }
}

async function updateProduct(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);

    const { name, description, price, stock, categoryId, status } = req.body;

    product.name = name;
    product.description = description;
    product.price = price;
    product.stock = stock;
    product.categoryId = categoryId;
    product.status = status === 'actif' ? 'available' : 'unavailable';

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      product.imageUrl = result.secure_url;
    }

    await product.save();

    res.redirect('/admin/dashboard?tab=products');

  } catch (err) {
    next(err);
  }
}

// ================= DELETE PRODUCT =================
async function deleteProduct(req, res) {
  await Product.destroy({ where: { id: req.params.id } });
  res.redirect('/admin/dashboard?tab=products');
}

// ================= USERS =================
async function listUsers(req, res) {
  const users = await User.findAll();

  res.render('admin/users', {
    users: users || [],
    selectedTab: 'users'
  });
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

// ================= CATEGORIES =================
async function addCategory(req, res) {
  await Category.create({ name: req.body.name });
  res.redirect('/admin/dashboard?tab=categories');
}

async function deleteCategory(req, res) {
  await Category.destroy({ where: { id: req.params.id } });
  res.redirect('/admin/dashboard?tab=categories');
}

// ================= ORDERS =================
async function listOrders(req, res) {
  const orders = await Order.findAll({
    include: [{ model: OrderItem, include: [Product] }]
  });

  res.render('admin/orders', {
    orders: orders || [],
    selectedTab: 'orders'
  });
}

// ================= UPDATE ORDER STATUS =================
async function updateOrderStatus(req, res) {
  const order = await Order.findByPk(req.params.id);

  order.status = req.body.status;
  await order.save();

  res.redirect('/admin/orders');
}

// ================= DELIVERY =================
async function showThiakThiakDelivery(req, res) {
  res.send("Livraison Thiak-Thiak");
}

async function assignThiakThiakDelivery(req, res) {
  res.send("Livreur assigné");
}

// ================= EXPORT =================
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