
const { Order, PaymentTransaction } = require('../models');
const { initiateWavePayment, initiateOrangePayment, refundPayment } = require('../services/paymentGatewayService');

function buildCallbackUrl(req, provider) {
  return `${req.protocol}://${req.get('host')}/orders/pay/callback/${provider}`;
}

async function createTx(orderId, provider, amount, txId, status, raw={}) {
  return PaymentTransaction.create({ orderId, provider, amount, transactionId: txId, status, rawResponse: JSON.stringify(raw) });
}

async function processWave(req, res) {
  try {
    const { orderId, amount, customerPhone } = req.body;
    const payment = await initiateWavePayment({ orderId, amount, customerPhone, callbackUrl: buildCallbackUrl(req, 'wave') });
    await Order.update({ status: 'payment_pending', paymentMethod: 'wave' }, { where: { id: orderId } });
    await createTx(orderId, 'wave', amount, payment.transactionId, 'pending', payment.raw || payment);
    res.json({ status: 'pending', ...payment });
  } catch (e) { res.status(500).json({ message: e.message }); }
}

async function processOrangeMoney(req, res) {
  try {
    const { orderId, amount, customerPhone } = req.body;
    const payment = await initiateOrangePayment({ orderId, amount, customerPhone, callbackUrl: buildCallbackUrl(req, 'orangemoney') });
    await Order.update({ status: 'payment_pending', paymentMethod: 'orange_money' }, { where: { id: orderId } });
    await createTx(orderId, 'orange_money', amount, payment.transactionId, 'pending', payment.raw || payment);
    res.json({ status: 'pending', ...payment });
  } catch (e) { res.status(500).json({ message: e.message }); }
}

async function paymentCallback(req, res) {
  const { provider } = req.params;
  const payload = { ...req.query, ...req.body };
  const orderId = payload.orderId || payload.client_reference || payload.merchant_key;
  const transactionId = payload.transactionId || payload.id || payload.txnid;
  const normalized = String(payload.status || payload.checkout_status || '').toLowerCase();
  const finalStatus = ['success','paid','completed','succeeded'].includes(normalized) ? 'paid' : 'payment_failed';
  await Order.update({ status: finalStatus }, { where: { id: orderId } });
  await createTx(orderId, provider, payload.amount || 0, transactionId, finalStatus, payload);
  res.json({ provider, orderId, status: finalStatus });
}

async function refund(req, res) {
  try {
    const { transactionId, provider } = req.body;
    const result = await refundPayment({ provider, transactionId });
    await PaymentTransaction.create({ orderId: req.body.orderId || 0, provider, transactionId, amount: 0, status: 'refunded', rawResponse: JSON.stringify(result) });
    res.json({ status: 'refunded', result });
  } catch (e) { res.status(500).json({ message: e.message }); }
}

async function history(req, res) {
  const rows = await PaymentTransaction.findAll({ where: { orderId: req.params.orderId } });
  res.json(rows);
}

async function receipt(req, res) {
  const order = await Order.findByPk(req.params.orderId);
  if (!order) return res.status(404).send('Order not found');
  const content = `%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 200]/Contents 4 0 R>>endobj\n4 0 obj<</Length 80>>stream\nBT /F1 12 Tf 20 160 Td (Receipt Order #${order.id} Amount ${order.totalAmount} Status ${order.status}) Tj ET\nendstream endobj\nxref\n0 5\n0000000000 65535 f \ntrailer<</Root 1 0 R/Size 5>>\nstartxref\n0\n%%EOF`;
  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=receipt-order-${order.id}.pdf`);
  res.send(content);
}

module.exports = { processWave, processOrangeMoney, paymentCallback, refund, history, receipt };
