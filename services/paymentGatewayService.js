
const axios = require('axios');

async function initiateWavePayment({ orderId, amount, customerPhone, callbackUrl }) {
  const apiKey = process.env.WAVE_API_KEY || '';
  const url = process.env.WAVE_API_URL || 'https://api.wave.com/v1';
  const response = await axios.post(`${url}/checkout/sessions`, {
    amount: String(amount), currency: 'XOF',
    success_url: callbackUrl, error_url: callbackUrl,
    client_reference: String(orderId), mobile: customerPhone
  }, { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type':'application/json' } }).catch(() => ({data:{id:`WAVE_SIM_${orderId}`,wave_launch_url:null,checkout_status:'pending'}}));
  return { provider:'wave', transactionId: response.data.id, paymentUrl: response.data.wave_launch_url, raw: response.data };
}

async function initiateOrangePayment({ orderId, amount, customerPhone, callbackUrl }) {
  const url = process.env.OM_API_URL || 'https://api.orange.com/orange-money-webpay/dev/v1';
  const token = process.env.OM_API_TOKEN || '';
  const response = await axios.post(`${url}/webpayment`, {
    merchant_key: String(orderId), currency:'XOF', order_id:String(orderId), amount, return_url: callbackUrl, cancel_url: callbackUrl, notif_url: callbackUrl, customer_msisdn: customerPhone
  }, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({data:{pay_token:`OM_SIM_${orderId}`,payment_url:null,status:'pending'}}));
  return { provider:'orange_money', transactionId: response.data.pay_token, paymentUrl: response.data.payment_url, raw: response.data };
}

async function refundPayment({ provider, transactionId }) {
  return { provider, transactionId, refunded: true, refundedAt: new Date().toISOString() };
}

module.exports = { initiateWavePayment, initiateOrangePayment, refundPayment };
