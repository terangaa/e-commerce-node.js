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
      .text("ALMANA SONO", 450, 55, { align: 'right', width: 105 });

    doc.moveDown(2);

    doc.fontSize(11)
      .text("Service client: 71 564 09 82", 40, 90)
      .text("sadikh@almana-sono.com", 40, 105);

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
    const qrData = `Facture ${invoiceNumber} - Total: ${grandTotal}FCFA`;

    try {
      const qrImage = await QRCode.toDataURL(qrData);
      doc.image(qrImage, 450, y - 60, { width: 80 });
    } catch (err) {
      console.log("QR error");
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
        "ALMANA SONO - Dakar, Senegal | Tel: 71 564 09 82",
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

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();

    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));

    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers);

      const invoiceNumber = generateInvoiceNumber(order.id);

      // 📧 ENVOI EMAIL AVEC PIÈCE JOINTE
      await transporter.sendMail({
        from: 'sadikhyade851@gmail.com',
        to: order.customerEmail,
        subject: `Facture ${invoiceNumber}`,

        html: `
  <div style="font-family: Arial; background:#f4f6fb; padding:20px">

    <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 5px 15px rgba(0,0,0,0.1)">

      <div style="background:#2563eb; color:white; padding:20px; text-align:center">
        <h2>🧾 Facture - ${invoiceNumber}</h2>
      </div>

      <div style="padding:20px">

        <p>Bonjour <b>${order.customerName}</b>,</p>

        <p>Merci pour votre commande 🙏</p>

        <div style="background:#f1f5f9; padding:15px; border-radius:8px; margin:15px 0">
          <p><b>Commande :</b> #${order.id}</p>
          <p><b>Total :</b> ${order.totalAmount} FCFA</p>
          <p><b>Statut :</b> ${order.status}</p>
        </div>

        <p>Votre facture est jointe en PDF 📎</p>

        <div style="text-align:center; margin:25px 0">
          <a href="http://localhost:3000/admin/orders/${order.id}/invoice"
             style="background:#2563eb; color:white; padding:12px 20px; text-decoration:none; border-radius:6px; font-weight:bold">
             Télécharger la facture
          </a>
        </div>

<div style="text-align:center; margin:25px 0">

 <div style="text-align:center; margin:20px 0">
      <a href="https://wa.me/221711423982?text=Bonjour%20votre%20commande%20%23${order.id}%20est%20confirm%C3%A9e%20-%20Total%20${order.totalAmount}%20FCFA"
         style="background:#25D366; color:white; padding:12px 18px; text-decoration:none; border-radius:6px;">
        💬 Confirmer sur WhatsApp
      </a>
    </div>

    <!-- APPEL -->
    <div style="text-align:center; margin:20px 0">
      <a href="tel:+221711423982"
         style="background:#2563eb; color:white; padding:12px 18px; text-decoration:none; border-radius:6px;">
        📞 Appeler
      </a>
    </div>

</div>


        <p>Si vous avez des questions, contactez-nous.</p>

        <b>Sadikh Yade</b><br>
Service client : 71 564 09 82<br>
Email : sadikh@almana-sono.com

      </div>

      <div style="background:#f1f5f9; padding:15px; text-align:center; font-size:12px; color:#666">
        © ${new Date().getFullYear()} sadikh yade
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

    // ================= CONTENU PDF =================
    doc.fontSize(20).text("FACTURE", { align: "center" });

    doc.moveDown();
    doc.text(`Commande #: ${order.id}`);
    doc.text(`Client: ${order.customerName}`);
    doc.text(`Email: ${order.customerEmail}`);
    doc.text(`Téléphone: ${order.customerPhone}`);
    doc.text(`Adresse: ${order.deliveryAddress}`);

    doc.moveDown();

let total = 0;

    const invoiceDate = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Header
    doc.rect(0, 0, 595, 100).fill('#1e3a8a');

    doc.fillColor('#ffffff')
      .fontSize(24)
      .font('Helvetica-Bold')
      .text("FACTURE", 40, 20);

    doc.fontSize(10)
      .font('Helvetica')
      .text(invoiceNumber, 450, 20, { align: 'right', width: 105 })
      .text(invoiceDate, 450, 35, { align: 'right', width: 105 });

    doc.moveDown(3);

    doc.fillColor('#1f2937')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text("Client:", 40);

    doc.font('Helvetica')
      .fontSize(10)
      .fillColor('#6b7280')
      .text(order.customerName, 40)
      .text(order.customerEmail, 40)
      .text(order.customerPhone, 40);

    doc.moveDown();

    let startY = doc.y;

    doc.rect(40, startY, 515, 25).fill('#1e3a8a');
    doc.fillColor('#ffffff')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text("Désignation", 50, startY + 7)
      .text("Qté", 320, startY + 7)
      .text("Total", 490, startY + 7);

    startY += 30;

    order.OrderItems.forEach((item, i) => {
      const lineTotal = item.quantity * item.unitPrice;
      total += lineTotal;

      if (i % 2 === 0) {
        doc.rect(40, startY, 515, 25).fill('#f3f4f6');
      }

      doc.fillColor('#1f2937')
        .fontSize(10)
        .font('Helvetica')
        .text(item.Product?.name || 'Produit', 50, startY + 7)
        .text(String(item.quantity), 320, startY + 7)
        .text(`${lineTotal.toLocaleString('fr-FR')} CFA`, 490, startY + 7);

      startY += 25;
    });

    startY += 20;

    doc.rect(300, startY, 255, 35).fill('#f59e0b');
    doc.fillColor('#000')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text("TOTAL À PAYER", 310, startY + 5)
      .fontSize(18)
      .text(`${total.toLocaleString('fr-FR')} CFA`, 310, startY + 15);

    doc.moveDown(3);

    doc.fillColor('#6b7280')
      .fontSize(9)
      .text(
        "Merci pour votre confiance - ALMANA SONO",
        { align: 'center' }
      );

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur envoi facture PDF");
  }
});


router.get('/settings', (req, res) => {
  res.render('admin/settings', {
    user: req.session.user
  });
});


/////////////////////
// DELIVERY THIAK-THIAK
/////////////////////
router.get('/orders/:id/delivery/thiak-thiak', showThiakThiakDelivery);
router.post('/orders/:id/delivery/thiak-thiak', assignThiakThiakDelivery);

module.exports = router;