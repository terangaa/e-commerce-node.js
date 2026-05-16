const express = require('express');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

const router = express.Router();
const { ensureAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

const {
  Category,
  Order,
  OrderItem,
  Product
} = require('../models');

const {
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
  listUsers,
  addUser,
  deleteUser,
  makeAdmin
} = require('../controllers/adminWebController');

/* ─────────────────────────────
   EMAIL CONFIG
───────────────────────────── */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

/* ─────────────────────────────
   MIDDLEWARE ADMIN
───────────────────────────── */
router.use(ensureAdmin);

/* ─────────────────────────────
   DASHBOARD
───────────────────────────── */
router.get('/dashboard', dashboard);

/* ─────────────────────────────
   USERS
───────────────────────────── */
router.get('/users', listUsers);
router.post('/users', addUser);
router.post('/users/:id/delete', deleteUser);
router.post('/users/:id/make-admin', makeAdmin);

/* ─────────────────────────────
   PRODUCTS
───────────────────────────── */
router.get('/products/add', showAddProduct);
router.post('/products/add', upload.single('image'), addProduct);

router.get('/products/:id/edit', showEditProduct);
router.post('/products/:id/edit', upload.single('image'), updateProduct);

router.post('/products/:id/delete', deleteProduct);

/* ─────────────────────────────
   CATEGORIES
───────────────────────────── */
router.get('/categories', async (req, res) => {
  const categories = await Category.findAll();
  res.render('admin/categories', { categories });
});

router.post('/categories', addCategory);
router.post('/categories/:id/delete', deleteCategory);

/* ─────────────────────────────
   ORDERS
───────────────────────────── */
router.get('/orders', listOrders);

router.get('/orders/:id', async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, include: [Product] }]
    });

    if (!order) return res.status(404).send("Commande introuvable");

    res.render('admin/order-detail', { order });
  } catch (err) {
    next(err);
  }
});

router.post('/orders/:id/status', updateOrderStatus);

router.post('/orders/:id/delete', async (req, res) => {
  await Order.destroy({ where: { id: req.params.id } });
  res.redirect('/admin/orders');
});

/* ─────────────────────────────
   PDF FACTURE
───────────────────────────── */
router.get('/orders/:id/invoice', async (req, res) => {
  const order = await Order.findByPk(req.params.id);

  if (!order) return res.status(404).send("Commande introuvable");

  const doc = new PDFDocument();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=facture-${order.id}.pdf`
  );

  doc.pipe(res);

  doc.fontSize(20).text("FACTURE");
  doc.text(`Commande #${order.id}`);
  doc.text(`Total: ${order.totalAmount} CFA`);

  doc.end();
});

/* ─────────────────────────────
   DELIVERY THIAK THIAK
───────────────────────────── */
router.get('/orders/:id/delivery/thiak-thiak', showThiakThiakDelivery);
router.post('/orders/:id/delivery/thiak-thiak', assignThiakThiakDelivery);

/* ─────────────────────────────
   SETTINGS (FIX IMPORTANT)
───────────────────────────── */

// GET SETTINGS PAGE
router.get('/settings', (req, res) => {
  res.render('admin/settings', {
    user: req.session.user,
    settings: {
      ownerWhatsApp: process.env.OWNER_WHATSAPP || '',
      shopName: process.env.SHOP_NAME || 'Ma Boutique',
      shopAddress: process.env.SHOP_ADDRESS || '',
      contactEmail: process.env.CONTACT_EMAIL || '',
      contactPhone: process.env.CONTACT_PHONE || ''
    }
  });
});

// SAVE SETTINGS
router.post('/settings', (req, res) => {
  console.log("SETTINGS DATA:", req.body);

  // ⚠️ Ici tu peux:
  // - sauvegarder en DB (recommandé)
  // - ou dans .env (pas dynamique)

  res.redirect('/admin/settings');
});

/* ─────────────────────────────
   ERROR SAFE ROUTE
───────────────────────────── */
router.use((req, res) => {
  res.status(404).render('404', {
    message: "Page admin introuvable"
  });
});

module.exports = router;