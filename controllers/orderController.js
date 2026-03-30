const { Order, OrderItem, Product } = require('../models');
const { sendOrderNotification, sendCustomerNotification } = require('../services/emailService');

async function createOrder(req, res, next) {
  try {
    const { customerName, customerEmail, customerPhone, customerAddress, items, paymentMethod } = req.body;
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
      return res.status(400).json({ error: 'Items are required' });
    }

    // Normalize product IDs as numbers to éviter les problèmes string vs number
    normalizedItems = normalizedItems.map(i => ({
      ...i,
      productId: Number(i.productId),
      quantity: Number(i.quantity),
    }));

    const productIds = normalizedItems.map(i => i.productId);
    const products = await Product.findAll({ where: { id: productIds } });
    if (products.length !== normalizedItems.length) {
      return res.status(400).json({ error: 'Certains produits sont invalides' });
    }

    const productsMap = new Map(products.map(p => [p.id, p]));
    for (const item of normalizedItems) {
      const product = productsMap.get(item.productId);
      if (!product) return res.status(400).json({ error: `Produit introuvable : ${item.productId}` });

      const qty = Number(item.quantity);
      const price = Number(product.price);
      if (!Number.isFinite(qty) || qty <= 0) {
        return res.status(400).json({ error: `Quantité invalide pour le produit ${item.productId}` });
      }
      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({ error: `Prix invalide pour le produit ${item.productId}` });
      }
    }

    const totalAmount = normalizedItems.reduce((sum, item) => {
      const product = productsMap.get(item.productId);
      return sum + Number(product.price) * Number(item.quantity);
    }, 0);

    const order = await Order.create({
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      status: 'pending',
      paymentMethod: paymentMethod || 'cash',
      totalAmount,
    });

    const createdItems = await Promise.all(normalizedItems.map(async (item) => {
      const product = products.find(p => p.id === item.productId);
      return OrderItem.create({
        orderId: order.id,
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
      });
    }));

    const enrichedItems = createdItems.map(oi => ({ ...oi.dataValues, Product: products.find(p => p.id === oi.productId) }));

    // Envoi de notification email au propriétaire + client en arrière-plan
    const notifications = [
      sendOrderNotification(order, enrichedItems),
      sendCustomerNotification(order, enrichedItems),
    ];

    Promise.allSettled(notifications).then(results => {
      results.forEach((result, idx) => {
        if (result.status === 'rejected') {
          console.error(`Notification ${idx === 0 ? 'owner' : 'customer'} failed:`, result.reason);
        }
      });
    });

    res.status(201).json({
      message: 'Commande créée avec succès',
      order,
      orderItems: createdItems,
    });
  } catch (err) {
    next(err);
  }
}

async function getOrder(req, res, next) {
  try {
    const order = await Order.findByPk(req.params.id, { include: [{ model: OrderItem, include: [Product] }] });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, getOrder };