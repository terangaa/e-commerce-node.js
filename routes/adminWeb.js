const express = require('express');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');

const router = express.Router();
const { ensureAdmin } = require('../middlewares/authMiddleware');

// ✅ IMPORTANT : utiliser memoryStorage (Cloudinary)
const upload = require('../middlewares/upload');

const {
  Category,
  Order,
  OrderItem,
  Product
} = require('../models');

const {
  dashboard,
  showCategories,
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


// ================= EMAIL CONFIG =================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// ================= ADMIN MIDDLEWARE =================
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

// 🔥 CLOUDINARY UPLOAD
router.post('/products/add', upload.single('image'), addProduct);

router.get('/products/:id/edit', showEditProduct);

// 🔥 CLOUDINARY UPDATE
router.post('/products/:id/edit', upload.single('image'), updateProduct);

router.post('/products/:id/delete', deleteProduct);

// ================= CATEGORIES =================
router.get('/categories', showCategories);
router.post('/categories', addCategory);
router.post('/categories/:id/delete', deleteCategory);

// ================= ORDERS =================
router.get('/orders', listOrders);

// ================= ORDER DETAILS =================
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

// ================= EDIT ORDER =================
router.post('/orders/:id/edit', async (req, res, next) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      status,
      productIds,
      quantities
    } = req.body;

    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem }]
    });

    if (!order) return res.status(404).send("Commande introuvable");

    await order.update({
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      status
    });

    if (Array.isArray(productIds)) {
      for (let i = 0; i < productIds.length; i++) {
        const item = await OrderItem.findOne({
          where: {
            orderId: order.id,
            productId: productIds[i]
          }
        });

        if (item) {
          await item.update({
            quantity: parseInt(quantities[i])
          });
        }
      }
    }

    const items = await OrderItem.findAll({
      where: { orderId: order.id }
    });

    let total = 0;
    for (const item of items) {
      total += item.quantity * item.unitPrice;
    }

    await order.update({ totalAmount: total });

    res.redirect('/admin/orders/' + order.id);

  } catch (err) {
    next(err);
  }
});

// ================= UPDATE STATUS =================
router.post('/orders/:id/status', updateOrderStatus);

// ================= DELETE ORDER =================
router.post('/orders/:id/delete', async (req, res) => {
  await Order.destroy({ where: { id: req.params.id } });
  res.redirect('/admin/orders');
});

// ================= INVOICE PDF =================
router.get('/orders/:id/invoice', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, include: [Product] }]
    });

    if (!order) return res.status(404).send("Commande introuvable");

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=facture-${order.id}.pdf`);

    doc.pipe(res);

    doc.fontSize(20).text("FACTURE", { align: "center" });
    doc.text(`Commande #${order.id}`);
    doc.text(`Client: ${order.customerName}`);
    doc.text(`Total: ${order.totalAmount} CFA`);

    doc.end();

  } catch (err) {
    res.status(500).send("Erreur facture");
  }
});

// ================= SEND EMAIL =================
router.get('/orders/:id/send-invoice', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    const doc = new PDFDocument();
    const buffers = [];

    const invoiceNumber = generateInvoiceNumber(order.id);

    doc.on('data', buffers.push.bind(buffers));

    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers);

      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: order.customerEmail,
        subject: `Facture ${invoiceNumber}`,
        html: `<h2>Facture ${invoiceNumber}</h2>`,
        attachments: [{
          filename: `facture-${order.id}.pdf`,
          content: pdfData
        }]
      });

      res.redirect('/admin/orders/' + order.id);
    });

    doc.text("FACTURE");
    doc.text(`Total: ${order.totalAmount}`);

    doc.end();

  } catch (err) {
    res.status(500).send("Erreur email");
  }
});

// ================= SETTINGS =================
router.get('/settings', (req, res) => {
  res.render('admin/settings', {
    settings: global.siteSettings || {}
  });
});

router.post('/settings', (req, res) => {
  global.siteSettings = req.body;
  res.redirect('/admin/settings');
});

// ================= DELIVERY =================
router.get('/orders/:id/delivery/thiak-thiak', showThiakThiakDelivery);
router.post('/orders/:id/delivery/thiak-thiak', assignThiakThiakDelivery);

module.exports = router;