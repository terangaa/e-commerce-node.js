const express = require('express');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

const router = express.Router();
const { ensureAdmin } = require('../middlewares/authMiddleware');

// 🔥 UPLOAD CLOUDINARY (memoryStorage)
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

// ================= EMAIL =================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// ================= MIDDLEWARE =================
router.use(ensureAdmin);

// ================= UTIL =================
function generateInvoiceNumber(orderId) {
  const year = new Date().getFullYear();
  return `INV-${year}-${orderId.toString().padStart(5, '0')}`;
}

// ================= DASHBOARD =================
router.get('/dashboard', dashboard);

// ================= USERS =================
router.get('/users', listUsers);
router.post('/users', addUser);
router.post('/users/:id/delete', deleteUser);
router.post('/users/:id/make-admin', makeAdmin);

// ================= PRODUCTS =================
router.get('/products/add', showAddProduct);

// 🔥 CREATE PRODUCT (CLOUDINARY)
router.post('/products/add', upload.single('image'), addProduct);

router.get('/products/:id/edit', showEditProduct);

// 🔥 UPDATE PRODUCT (CLOUDINARY)
router.post('/products/:id/edit', upload.single('image'), updateProduct);

router.post('/products/:id/delete', deleteProduct);

// ================= CATEGORIES =================
router.get('/categories', addCategory);
router.post('/categories', addCategory);
router.post('/categories/:id/delete', deleteCategory);

// ================= ORDERS =================
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

// ================= DELETE ORDER =================
router.post('/orders/:id/delete', async (req, res) => {
  await Order.destroy({ where: { id: req.params.id } });
  res.redirect('/admin/orders');
});

// ================= PDF INVOICE =================
router.get('/orders/:id/invoice', async (req, res) => {
  const order = await Order.findByPk(req.params.id);

  const doc = new PDFDocument();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=facture-${order.id}.pdf`);

  doc.pipe(res);

  doc.fontSize(20).text("FACTURE");
  doc.text(`Commande #${order.id}`);
  doc.text(`Total: ${order.totalAmount} CFA`);

  doc.end();
});

// ================= DELIVERY =================
router.get('/orders/:id/delivery/thiak-thiak', showThiakThiakDelivery);
router.post('/orders/:id/delivery/thiak-thiak', assignThiakThiakDelivery);

module.exports = router;