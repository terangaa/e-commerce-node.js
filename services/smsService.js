require('dotenv').config();
const twilio = require('twilio');

// Activation via .env
const ENABLE_SMS = process.env.ENABLE_SMS === "true";
const ENABLE_WHATSAPP = process.env.ENABLE_WHATSAPP === "true";

// Configuration Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

let twilioClient = null;

// Initialisation conditionnelle
if ((ENABLE_SMS || ENABLE_WHATSAPP) && accountSid && authToken) {
  try {
    twilioClient = twilio(accountSid, authToken);
    console.log("✅ Client Twilio initialisé");
  } catch (err) {
    console.warn("❌ Erreur init Twilio:", err.message);
  }
} else {
  console.log("⚠️ Twilio désactivé (mode développement)");
}

/**
 * 📩 Envoi SMS
 */
async function sendSMS(to, message) {
  if (!ENABLE_SMS) {
    console.log("📴 SMS désactivé");
    return null;
  }

  if (!twilioClient || !twilioPhoneNumber) {
    console.log("⚠️ Config SMS manquante");
    return null;
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to,
    });

    console.log(`✅ SMS envoyé: ${result.sid}`);
    return result;
  } catch (err) {
    console.error("❌ Erreur SMS:", err.message);
    return null;
  }
}

/**
 * 💬 Envoi WhatsApp
 */
async function sendWhatsApp(to, message) {
  if (!ENABLE_WHATSAPP) {
    console.log("📴 WhatsApp désactivé");
    return null;
  }

  if (!twilioClient || !twilioWhatsAppNumber) {
    console.log("⚠️ Config WhatsApp manquante");
    return null;
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: `whatsapp:${twilioWhatsAppNumber}`,
      to: `whatsapp:${to}`,
    });

    console.log(`✅ WhatsApp envoyé: ${result.sid}`);
    return result;
  } catch (err) {
    console.error("❌ Erreur WhatsApp:", err.message);
    return null;
  }
}

/**
 * 📦 Notification commande (SMS)
 */
async function sendOrderNotificationSMS(order, items) {
  if (!ENABLE_SMS) return null;

  const productsList = items
    .map(i => `- ${i.Product.name} x${i.quantity}`)
    .join('\n');

  const message = `
Bonjour ${order.customerName},

Votre commande #${order.id} a été reçue.

Produits:
${productsList}

Total: ${order.totalAmount} FCFA

Merci pour votre confiance !
`;

  return await sendSMS(order.customerPhone, message);
}

/**
 * 📦 Notification commande (WhatsApp)
 */
async function sendOrderNotificationWhatsApp(order, items) {
  if (!ENABLE_WHATSAPP) return null;

  const productsList = items
    .map(i => `- ${i.Product.name} x${i.quantity}`)
    .join('\n');

  const message = `
Bonjour ${order.customerName},

Votre commande #${order.id} a été reçue.

Produits:
${productsList}

Total: ${order.totalAmount} FCFA

Merci pour votre confiance !
`;

  return await sendWhatsApp(order.customerPhone, message);
}

/**
 * 🧪 Test SMS
 */
async function sendTestSMS(to) {
  return await sendSMS(
    to,
    `Test SMS - ${new Date().toISOString()}`
  );
}

/**
 * 🧪 Test WhatsApp
 */
async function sendTestWhatsApp(to) {
  return await sendWhatsApp(
    to,
    `Test WhatsApp - ${new Date().toISOString()}`
  );
}

module.exports = {
  sendSMS,
  sendWhatsApp,
  sendOrderNotificationSMS,
  sendOrderNotificationWhatsApp,
  sendTestSMS,
  sendTestWhatsApp,
};