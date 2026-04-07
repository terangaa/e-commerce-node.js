const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendOrderEmail({ to, customerName, orderNumber, totalAmount }) {
  try {
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `Confirmation commande #${orderNumber}`,
      text: `Bonjour ${customerName}, votre commande #${orderNumber} de ${totalAmount} FCFA a été confirmée.`,
      html: `
        <h2>Commande confirmée</h2>
        <p>Bonjour <b>${customerName}</b>,</p>
        <p>Votre commande <b>#${orderNumber}</b> a bien été confirmée.</p>
        <p>Total : <b>${totalAmount} FCFA</b></p>
      `
    };

    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error("SendGrid error:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendOrderEmail };