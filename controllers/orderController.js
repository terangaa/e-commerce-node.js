// controllers/orderController.js
const { Order, OrderItem, Product } = require('../models');
const { sendOrderNotification, sendCustomerNotification } = require('../services/emailService');
const { sendOrderNotificationSMS, sendOrderNotificationWhatsApp } = require('../services/smsService');

/**
 * Crée une commande, ses items, et envoie notifications email + SMS/WhatsApp
 */
async function buildOrderAndNotify({ customerName, customerEmail, customerPhone, customerAddress, items, paymentMethod }) {
  let normalizedItems = items;

  // support form-encoded fields items[0][productId] etc.
  if (!normalizedItems || !Array.isArray(normalizedItems)) {
    if (normalizedItems && typeof normalizedItems === 'object') {
      normalizedItems = Object.keys(normalizedItems)
        .filter(k => k.match(/^\d+$/))
        .sort((a, b) => Number(a) - Number(b))
        .map(k => normalizedItems[k]);
    }
  }

  if (!normalizedItems || !Array.isArray(normalizedItems) || normalizedItems.length === 0) {
    const error = new Error('Items are required');
    error.status = 400;
    throw error;
  }

  // Normalize product IDs as numbers
  normalizedItems = normalizedItems.map(i => ({
    ...i,
    productId: Number(i.productId),
    quantity: Number(i.quantity),
  }));

  const productIds = normalizedItems.map(i => i.productId);
  const products = await Product.findAll({ where: { id: productIds } });
  if (products.length !== normalizedItems.length) {
    const error = new Error('Certains produits sont invalides');
    error.status = 400;
    throw error;
  }

  const productsMap = new Map(products.map(p => [p.id, p]));
  for (const item of normalizedItems) {
    const product = productsMap.get(item.productId);
    if (!product) {
      const error = new Error(`Produit introuvable : ${item.productId}`);
      error.status = 400;
      throw error;
    }

    const qty = Number(item.quantity);
    const price = Number(product.price);
    if (!Number.isFinite(qty) || qty <= 0) {
      const error = new Error(`Quantité invalide pour le produit ${item.productId}`);
      error.status = 400;
      throw error;
    }
    if (qty > Number(product.stock || 0)) {
      const error = new Error(`Stock insuffisant pour ${product.name} (disponible: ${product.stock})`);
      error.status = 400;
      throw error;
    }
    if (!Number.isFinite(price) || price < 0) {
      const error = new Error(`Prix invalide pour le produit ${item.productId}`);
      error.status = 400;
      throw error;
    }
  }

  const totalAmount = normalizedItems.reduce((sum, item) => {
    const product = productsMap.get(item.productId);
    return sum + Number(product.price) * Number(item.quantity);
  }, 0);

  // Création de la commande
  const order = await Order.create({
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    status: 'pending',
    paymentMethod: paymentMethod || 'cash',
    totalAmount,
  });

  // Création des OrderItems et mise à jour du stock
  const createdItems = await Promise.all(normalizedItems.map(async (item) => {
    const product = products.find(p => p.id === item.productId);

    // Déduire le stock
    product.stock = Math.max(0, Number(product.stock || 0) - item.quantity);
    await product.save();

    return OrderItem.create({
      orderId: order.id,
      productId: product.id,
      quantity: item.quantity,
      unitPrice: product.price,
    });
  }));

  const enrichedItems = createdItems.map(oi => ({
    ...oi.dataValues,
    Product: products.find(p => p.id === oi.productId),
  }));

  // Notifications email
  const emailNotifications = await Promise.allSettled([
    sendOrderNotification(order, enrichedItems),
    sendCustomerNotification(order, enrichedItems),
  ]);

  const emailStatus = {
    owner: emailNotifications[0].status === 'fulfilled' ? 'sent' : 'failed',
    customer: emailNotifications[1].status === 'fulfilled' ? 'sent' : 'failed',
    errors: [],
  };

  emailNotifications.forEach((result, idx) => {
    if (result.status === 'rejected') {
      const who = idx === 0 ? 'owner' : 'customer';
      console.error(`Notification ${who} failed:`, result.reason);
      emailStatus.errors.push({ target: who, error: result.reason?.message || String(result.reason) });
    }
  });

  // Notifications SMS/WhatsApp (optionnelles)
  const smsNotifications = await Promise.allSettled([
    sendOrderNotificationSMS(order, enrichedItems),
    sendOrderNotificationWhatsApp(order, enrichedItems),
  ]);

  const smsStatus = { sms: "disabled", whatsapp: "disabled", errors: [] };

  if (smsNotifications[0].status === "fulfilled") smsStatus.sms = smsNotifications[0].value ? "sent" : "disabled";
  else {
    smsStatus.sms = "failed";
    console.error("Notification sms failed:", smsNotifications[0].reason);
    smsStatus.errors.push({ type: "sms", error: smsNotifications[0].reason?.message || String(smsNotifications[0].reason) });
  }

  if (smsNotifications[1].status === "fulfilled") smsStatus.whatsapp = smsNotifications[1].value ? "sent" : "disabled";
  else {
    smsStatus.whatsapp = "failed";
    console.error("Notification whatsapp failed:", smsNotifications[1].reason);
    smsStatus.errors.push({ type: "whatsapp", error: smsNotifications[1].reason?.message || String(smsNotifications[1].reason) });
  }

  return { order, createdItems, emailStatus, smsStatus };
}

/**
 * Route POST /orders
 */
async function createOrder(req, res, next) {
  try {
    const { customerName, customerEmail, customerPhone, customerAddress, items, paymentMethod } = req.body;

    // fallback sur le panier session
    let orderItems = items;
    if ((!orderItems || orderItems.length === 0) && req.session && Array.isArray(req.session.cart) && req.session.cart.length > 0) {
      orderItems = req.session.cart.map(item => ({ productId: item.productId, quantity: item.quantity }));
    }

    const { order, createdItems, emailStatus, smsStatus } = await buildOrderAndNotify({
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      items: orderItems,
      paymentMethod,
    });

    // vider panier session
    if (req.session) req.session.cart = [];

    // Rendre la page EJS de confirmation
    res.render('orderSuccess', {
      order,
      emailStatus,
      smsStatus,
      __: res.__,
      locale: req.getLocale(),
      user: req.session?.user || null,
      currentPage: 'cart',
    });

  } catch (err) {
    if (err.status) return res.status(err.status).render('error', { message: err.message });
    next(err);
  }
}

/**
 * Route GET /orders/:id
 */
async function getOrder(req, res, next) {
  try {
    const order = await Order.findByPk(req.params.id, { include: [{ model: OrderItem, include: [Product] }] });
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });
    res.json(order);
  } catch (err) {
    next(err);
  }
}

module.exports = { buildOrderAndNotify, createOrder, getOrder };