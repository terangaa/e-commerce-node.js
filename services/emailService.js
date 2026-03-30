require('dotenv').config();
const nodemailer = require('nodemailer');

const ownerEmail = process.env.OWNER_EMAIL || 'ceesaysamba24@gmail.com';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'i.mbaye5@isepat.edu.sn',
    pass: process.env.SMTP_PASS || 'mbayebeuz',
  },
});

async function sendOrderNotification(order, items) {
  const productsList = items.map(i => `- ${i.Product.name} x${i.quantity} (${i.unitPrice} FCFA)`).join('\n');
  const total = order.totalAmount;

  const message = {
    from: process.env.FROM_EMAIL || 'no-reply@ecommerce-jim.local',
    to: ownerEmail,
    subject: `Nouvelle commande #${order.id}`,
    text: `Une nouvelle commande a été passée.\n\nNom: ${order.customerName}\nEmail: ${order.customerEmail}\nTéléphone: ${order.customerPhone}\nAdresse: ${order.customerAddress}\n\nProduits:\n${productsList}\n\nTotal: ${total} FCFA\n`,
  };

  return transporter.sendMail(message);
}

async function sendCustomerNotification(order, items) {
  const productsList = items.map(i => `- ${i.Product.name} x${i.quantity} (${i.unitPrice} FCFA)`).join('\n');
  const total = order.totalAmount;

  const message = {
    from: process.env.FROM_EMAIL || 'no-reply@ecommerce-jim.local',
    to: order.customerEmail,
    subject: `Confirmation de commande #${order.id}`,
    text: `Bonjour ${order.customerName},\n\nVotre commande a bien été reçue.\n\nProduit(s) :\n${productsList}\n\nTotal : ${total} FCFA\n\nMerci pour votre confiance !\n`,
  };

  return transporter.sendMail(message);
}

module.exports = { sendOrderNotification, sendCustomerNotification };