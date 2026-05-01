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
    const products = await Product.findAll({
      include: [{ model: Category, as: 'category' }]
    });
    const categories = await Category.findAll();
    const orders = await Order.findAll({
      include: [{
        model: OrderItem,
        include: [{ model: Product, include: [{ model: Category, as: 'category' }] }]
      }],
      order: [['createdAt', 'DESC']]
    });
    const users = await User.findAll();

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
      products,
      categories,
      orders,
      users,
      selectedTab: req.query.tab || 'dashboard',
      error: null,
      recentOrders,
      ordersByStatus
    });
  } catch (err) {
    next(err);
  }
}

// ================= ADD PRODUCT PAGE =================
async function showAddProduct(req, res) {
  try {
    const categories = await Category.findAll();

    return res.render('admin/addProduct', {
      user: req.session.user,
      formData: {},
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

    console.log('📦 req.body complet:', req.body);
    console.log('📦 status reçu:', status);

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

    let imageUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    const finalStatus = (status === 'unavailable') ? 'unavailable' : 'available';
    console.log('📦 finalStatus:', finalStatus);

    const newProduct = await Product.create({
      name,
      price,
      description,
      stock,
      categoryId,
      status: finalStatus,
      imageUrl
    });

    console.log('✅ Produit créé:', newProduct.dataValues);

    return res.render('admin/addProduct', {
      user: req.session.user,
      formData: newProduct.dataValues,
      categories,
      error: null,
      success: "Produit ajouté avec succès !"
    });

  } catch (err) {
    console.error('❌ ERREUR addProduct:', err.message);
    console.error('❌ STACK:', err.stack);

    const categories = await Category.findAll().catch(() => []);

    return res.render('admin/addProduct', {
      user: req.session.user,
      formData: req.body,
      categories,
      error: err.message,
      success: null
    });
  }
}
// ================= EDIT PRODUCT PAGE =================
async function showEditProduct(req, res) {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, as: 'category' }]
    });
    const categories = await Category.findAll();

    if (!product) {
      return res.redirect('/admin/dashboard?tab=products');
    }

    return res.render('admin/addProduct', {
      user: req.session.user,
      formData: product,
      categories,
      error: null,
      success: null
    });

  } catch (err) {
    console.error(err);
    return res.redirect('/admin/dashboard');
  }
}

// ================= UPDATE PRODUCT =================
// ✅ FIX PRINCIPAL : correction de la logique du status
async function updateProduct(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.redirect('/admin/dashboard?tab=products');
    }

    const { name, description, price, stock, categoryId, status } = req.body;

    product.name        = name;
    product.description = description;
    product.price       = price;
    product.stock       = stock;
    product.categoryId  = categoryId;

    // ✅ FIX : accepte toutes les valeurs possibles du formulaire
    // 'available' ou 'actif'  → disponible
    // 'unavailable' ou 'inactif' → indisponible
    // valeur manquante → disponible par défaut
    if (status === 'available' || status === 'actif') {
      product.status = 'available';
    } else if (status === 'unavailable' || status === 'inactif') {
      product.status = 'unavailable';
    } else {
      product.status = 'available'; // ✅ défaut sécurisé
    }

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
  try {
    await Product.destroy({ where: { id: req.params.id } });
  } catch (err) {
    console.error('❌ Erreur suppression produit:', err.message);
  }
  res.redirect('/admin/dashboard?tab=products');
}

// ================= USERS =================
async function listUsers(req, res) {
  try {
    const users = await User.findAll();
    res.render('admin/users', {
      users: users || [],
      selectedTab: 'users',
      error: null,
      success: null
    });
  } catch (err) {
    console.error('❌ Erreur listUsers:', err.message);
    res.render('admin/users', {
      users: [],
      selectedTab: 'users',
      error: err.message,
      success: null
    });
  }
}
async function addUser(req, res) {
  try {
    const { name, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      passwordHash: hash,
      role: 'user'
    });
  } catch (err) {
    console.error('❌ Erreur création utilisateur:', err.message);
  }
  res.redirect('/admin/users');
}

async function deleteUser(req, res) {
  try {
    await User.destroy({ where: { id: req.params.id } });
  } catch (err) {
    console.error('❌ Erreur suppression utilisateur:', err.message);
  }
  res.redirect('/admin/users');
}

async function makeAdmin(req, res) {
  try {
    const user = await User.findByPk(req.params.id);
    if (user) {
      user.role = 'admin';
      await user.save();
    }
  } catch (err) {
    console.error('❌ Erreur makeAdmin:', err.message);
  }
  res.redirect('/admin/users');
}

// ================= CATEGORIES =================
async function addCategory(req, res) {
  try {
    await Category.create({ name: req.body.name });
  } catch (err) {
    console.error('❌ Erreur création catégorie:', err.message);
  }
  res.redirect('/admin/dashboard?tab=categories');
}

async function deleteCategory(req, res) {
  try {
    await Category.destroy({ where: { id: req.params.id } });
  } catch (err) {
    console.error('❌ Erreur suppression catégorie:', err.message);
  }
  res.redirect('/admin/dashboard?tab=categories');
}

// ================= ORDERS =================
async function listOrders(req, res) {
  try {
    const orders = await Order.findAll({
      include: [{ model: OrderItem, include: [Product] }],
      order: [['createdAt', 'DESC']]
    });

    res.render('admin/orders', {
      orders: orders || [],
      selectedTab: 'orders'
    });
  } catch (err) {
    console.error('❌ Erreur listOrders:', err.message);
    res.render('admin/orders', { orders: [], selectedTab: 'orders' });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const order = await Order.findByPk(req.params.id);
    if (order) {
      order.status = req.body.status;
      await order.save();
    }
  } catch (err) {
    console.error('❌ Erreur updateOrderStatus:', err.message);
  }
  res.redirect('/admin/dashboard?tab=orders');
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