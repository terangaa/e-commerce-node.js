const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');   // 👈 ICI
const QRCode = require('qrcode');

const router = express.Router();
const { ensureAdmin } = require('../middlewares/authMiddleware');

function generateInvoiceNumber(orderId) {
  const year = new Date().getFullYear();
  return `INV-${year}-${orderId.toString().padStart(5, '0')}`;
}

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sadikhyade851@gmail.com',
    pass: 'azkqpahketqmfzff'
  }
});


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

/////////////////////
// MIDDLEWARE ADMIN
/////////////////////
router.use(ensureAdmin);

/////////////////////
// MULTER UPLOAD
/////////////////////

const normalizeFolderName = (name) => {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'autres';
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const categoryId = req.body.categoryId;
    let uploadFolder = path.join('public', 'uploads');

    if (categoryId) {
      Category.findByPk(categoryId)
        .then(category => {
          if (category && category.name) {
            const folderName = normalizeFolderName(category.name);
            uploadFolder = path.join('public', 'uploads', folderName);
          }
          return fs.promises.mkdir(uploadFolder, { recursive: true });
        })
        .then(() => cb(null, uploadFolder))
        .catch(cb);
    } else {
      fs.promises.mkdir(uploadFolder, { recursive: true })
        .then(() => cb(null, uploadFolder))
        .catch(cb);
    }
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = file.originalname.split('.').pop();
    cb(null, `${unique}.${ext}`);
  }
});

const upload = multer({ storage });

/////////////////////
// DASHBOARD
/////////////////////
router.get('/dashboard', dashboard);

/////////////////////
// USERS
/////////////////////
router.get('/users', listUsers);
router.post('/users', addUser);
router.post('/users/:id/delete', deleteUser);
router.post('/users/:id/make-admin', makeAdmin);

/////////////////////
// PRODUCTS
/////////////////////
router.get('/products/add', showAddProduct);
router.post('/products/add', upload.single('image'), addProduct);

router.get('/products/:id/edit', showEditProduct);
router.post('/products/:id/edit', upload.single('image'), updateProduct);

router.post('/products/:id/delete', deleteProduct);

/////////////////////
// CATEGORIES
/////////////////////
router.get('/categories', showCategories);
router.post('/categories', addCategory);
router.post('/categories/:id/delete', deleteCategory);

/////////////////////
// ORDERS
/////////////////////

/////////////////////
// ORDERS
/////////////////////

// LISTE COMMANDES
router.get('/orders', listOrders);

/////////////////////
// DÉTAIL COMMANDE
/////////////////////
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

/////////////////////
// PAGE EDIT COMMANDE
/////////////////////
router.get('/orders/:id/edit', async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, include: [Product] }]
    });

    if (!order) return res.status(404).send("Commande introuvable");

    res.render('admin/order-edit', { order });
  } catch (err) {
    next(err);
  }
});

/////////////////////
// UPDATE COMMANDE (IMPORTANT)
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

    // 1. update client
    await order.update({
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      status
    });

    // 2. update items
    if (Array.isArray(productIds)) {
      for (let i = 0; i < productIds.length; i++) {

        const item = await OrderItem.findOne({
          where: {
            orderId: order.id,
            productId: productIds[i]
          }
        });

        if (item) {
          const qty = parseInt(quantities[i]);

          await item.update({
            quantity: qty
          });
        }
      }
    }

    // 3. recalcul TOTAL (IMPORTANT)
    const items = await OrderItem.findAll({
      where: { orderId: order.id }
    });

    let total = 0;

    for (const item of items) {
      total += Number(item.quantity) * Number(item.unitPrice);
    }

    await order.update({
      totalAmount: total
    });

    return res.redirect('/admin/orders/' + order.id);

  } catch (err) {
    next(err);
  }
});
/////////////////////
// UPDATE STATUT
/////////////////////
router.post('/orders/:id/status', updateOrderStatus);

/////////////////////
// DELETE COMMANDE
/////////////////////

router.post('/orders/:id/delete', async (req, res) => {
  try {
    await Order.destroy({
      where: { id: req.params.id }
    });

    return res.redirect('/admin/orders');
  } catch (err) {
    console.error(err);
    return res.status(500).send("Erreur suppression commande");
  }
});

// ================= DELETE ORDER =================
router.get('/orders/:id/invoice', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, include: [Product] }]
    });

    if (!order) return res.status(404).send("Commande introuvable");

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=facture-${order.id}.pdf`
    );

    doc.pipe(res);

    const invoiceNumber = generateInvoiceNumber(order.id);
    const invoiceDate = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // ================= COLORS =================
    const PRIMARY = '#1e3a8a';
    const SECONDARY = '#3b82f6';
    const DARK = '#1f2937';
    const GRAY = '#6b7280';
    const LIGHT = '#f3f4f6';
    const GOLD = '#f59e0b';

    // ================= HEADER =================
    doc.rect(0, 0, 595, 120).fill(PRIMARY);

    doc.fillColor('#ffffff')
      .fontSize(28)
      .font('Helvetica-Bold')
      .text("FACTURE", 40, 25);

    doc.fontSize(10)
      .font('Helvetica')
      .text(invoiceNumber, 450, 25, { align: 'right', width: 105 })
      .text(invoiceDate, 450, 40, { align: 'right', width: 105 })
      .text("ECOMMERCE-JIM", 450, 55, { align: 'right', width: 105 });

    doc.moveDown(2);

    doc.fontSize(11)
      .text("Service client: 76 613 74 08", 40, 90)
      .text("ceesaysamba24@gmail.com", 40, 105);

    // ================= CLIENT INFO =================
    doc.moveDown(2);
    doc.fillColor(DARK)
      .fontSize(13)
      .font('Helvetica-Bold')
      .text("Informations client", 40);

    doc.font('Helvetica')
      .fontSize(11)
      .fillColor(GRAY)
      .text(order.customerName, 40)
      .text(order.customerEmail, 40)
      .text(order.customerPhone, 40)
      .text(order.deliveryAddress || 'Non définie', 40);

    // ================= TABLE HEADER =================
    let y = 260;

    doc.rect(40, y, 515, 30).fill(PRIMARY);

    doc.fillColor('#ffffff')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text("Désignation", 50, y + 8)
      .text("Qté", 300, y + 8)
      .text("Prix unitaire", 380, y + 8)
      .text("Total", 490, y + 8);

    y += 35;

    let total = 0;

    // ================= ITEMS =================
    order.OrderItems.forEach((item, i) => {
      const lineTotal = item.quantity * item.unitPrice;
      total += lineTotal;

      if (i % 2 === 0) {
        doc.rect(40, y, 515, 28).fill(LIGHT);
      }

      doc.fillColor(DARK)
        .font('Helvetica')
        .fontSize(10)
        .text(item.Product?.name || 'Produit', 50, y + 7)
        .text(String(item.quantity), 300, y + 7)
        .text(`${item.unitPrice.toLocaleString('fr-FR')} CFA`, 380, y + 7)
        .text(`${lineTotal.toLocaleString('fr-FR')} CFA`, 490, y + 7);

      y += 28;
    });

    // ================= TOTALS =================
    y += 15;

    const shipping = order.shippingCost || 0;
    const subtotal = total;

    doc.rect(300, y, 255, 25).fill('#e5e7eb');
    doc.fillColor(DARK)
      .fontSize(10)
      .text("Sous-total", 310, y + 7)
      .text(`${subtotal.toLocaleString('fr-FR')} CFA`, 500, y + 7, { align: 'right' });

    y += 30;

    if (shipping > 0) {
      doc.rect(300, y, 255, 25).fill('#e5e7eb');
      doc.fillColor(DARK)
        .fontSize(10)
        .text("Livraison", 310, y + 7)
        .text(`${shipping.toLocaleString('fr-FR')} CFA`, 500, y + 7, { align: 'right' });
      y += 30;
    }

    const grandTotal = subtotal + shipping;

    doc.rect(300, y, 255, 40).fill(GOLD);
    doc.fillColor('#000')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text("TOTAL À PAYER", 310, y + 8)
      .fontSize(18)
      .text(`${grandTotal.toLocaleString('fr-FR')} CFA`, 310, y + 22);

    // ================= QR CODE =================
    // ================= QR CODE =================
    const phone = "221766137408";

    // ⚠️ message simple pour test
    const message = encodeURIComponent("Bonjour JIM Shopping");

    const qrData = `https://wa.me/${phone}?text=${message}`;

    console.log("QR DATA:", qrData); // 🔍 debug

    try {
      const qrImage = await QRCode.toDataURL(qrData);
      doc.image(qrImage, 450, 120, { width: 90 });
    } catch (err) {
      console.log("QR error", err);
    }
    // ================= PIED DE PAGE =================
    y += 80;

    doc.rect(40, y, 515, 1).fill(GRAY);
    doc.moveDown(1);

    doc.fillColor(GRAY)
      .fontSize(9)
      .font('Helvetica')
      .text(
        "Merci pour votre confiance. Paiement à réception de marchandise.",
        40,
        y + 20,
        { align: 'center', width: 515 }
      );

    doc.fontSize(8)
      .text(
        "E-COMMERCE-JIM - Dakar, Senegal | Tel: +221 76 613 74 08",
        40,
        y + 35,
        { align: 'center', width: 515 }
      );

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur génération facture");
  }
});
// ================= EMAIL FACTURE =================
router.get('/orders/:id/send-invoice', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, include: [Product] }]
    });

    if (!order) return res.status(404).send("Commande introuvable");

    const doc = new PDFDocument();
    const buffers = [];

    // ✅ FIX ICI
    const invoiceNumber = generateInvoiceNumber(order.id);

    doc.on('data', buffers.push.bind(buffers));

    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers);

      await transporter.sendMail({
        from: 'sadikhyade851@gmail.com',
        to: order.customerEmail,
        subject: `Facture ${invoiceNumber}`,

        html: `
        <div style="font-family: Arial; background:#f4f6fb; padding:20px">
          <div style="max-width:600px;margin:auto;background:white;border-radius:10px">

            <div style="background:#2563eb;color:white;padding:20px;text-align:center">
              <h2>🧾 Facture - ${invoiceNumber}</h2>
            </div>

            <div style="padding:20px">
              <p>Bonjour <b>${order.customerName}</b>,</p>
              <p>Merci pour votre commande 🙏</p>

              <p><b>Commande :</b> #${order.id}</p>
              <p><b>Total :</b> ${order.totalAmount} FCFA</p>

              <a href="http://localhost:3000/admin/orders/${order.id}/invoice"
                 style="background:#2563eb;color:white;padding:10px 15px;border-radius:5px;text-decoration:none">
                 Télécharger la facture
              </a>
            </div>

          </div>
        </div>
        `,

        attachments: [
          {
            filename: `facture-${order.id}.pdf`,
            content: pdfData
          }
        ]
      });

      res.redirect('/admin/orders/' + order.id);
    });

    // ================= PDF =================
    doc.fontSize(20).text("FACTURE", { align: "center" });

    doc.text(`Facture: ${invoiceNumber}`);
    doc.text(`Client: ${order.customerName}`);
    doc.text(`Total: ${order.totalAmount} CFA`);

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur envoi facture");
  }
});

/////////////////////
// DELIVERY THIAK-THIAK
/////////////////////
router.get('/orders/:id/delivery/thiak-thiak', showThiakThiakDelivery);
router.post('/orders/:id/delivery/thiak-thiak', assignThiakThiakDelivery);

module.exports = router;