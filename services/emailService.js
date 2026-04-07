require('dotenv').config();
const nodemailer = require('nodemailer');

const ownerEmail = process.env.OWNER_EMAIL || 'ceesaysamba24@gmail.com';

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const smtpSecure = process.env.SMTP_SECURE === 'true';
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

let transporter = null;

if (!smtpUser || !smtpPass) {
  console.warn('SMTP_USER et/ou SMTP_PASS non configurés. Les notifications email sont désactivées.');
} else {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: { user: smtpUser, pass: smtpPass },
  });

  transporter.verify().then(() => {
    console.log('SMTP configuration OK, prêt à envoyer des emails.');
  }).catch((err) => {
    console.error('Échec de vérification SMTP. Vérifiez SMTP_USER, SMTP_PASS, SMTP_HOST, SMTP_PORT :', err.message || err);
  });
}

async function sendOrderNotification(order, items) {
  const productsList = items.map(i => `- ${i.Product.name} x${i.quantity} (${i.unitPrice} FCFA)`).join('\n');
  const total = order.totalAmount;

  if (!transporter) {
    throw new Error('SMTP non configuré : SMTP_USER et SMTP_PASS sont requis pour l’envoi d’email.');
  }

  const message = {
    from: process.env.FROM_EMAIL || 'no-reply@ecommerce-jim.local',
    to: ownerEmail,
    subject: `Nouvelle commande #${order.id}`,
    text: `Une nouvelle commande a été passée.\n\nNom: ${order.customerName}\nEmail: ${order.customerEmail}\nTéléphone: ${order.customerPhone}\nAdresse: ${order.customerAddress}\n\nProduits:\n${productsList}\n\nTotal: ${total} FCFA\n`,
  };

  try {
    return await transporter.sendMail(message);
  } catch (err) {
    throw new Error(`Échec envoi email propriétaire : ${err.message || err}`);
  }
}

async function sendCustomerNotification(order, items) {
  const productsList = items.map(i => `- ${i.Product.name} x${i.quantity} (${i.unitPrice} FCFA)`).join('\n');
  const total = order.totalAmount;

  if (!transporter) {
    throw new Error('SMTP non configuré : SMTP_USER et SMTP_PASS sont requis pour l’envoi d’email.');
  }

  const message = {
    from: process.env.FROM_EMAIL || 'no-reply@ecommerce-jim.local',
    to: order.customerEmail,
    subject: `Confirmation de commande #${order.id}`,
    text: `Bonjour ${order.customerName},\n\nVotre commande a bien été reçue.\n\nProduit(s) :\n${productsList}\n\nTotal : ${total} FCFA\n\nMerci pour votre confiance !\n`,
  };

  try {
    return await transporter.sendMail(message);
  } catch (err) {
    throw new Error(`Échec envoi email client : ${err.message || err}`);
  }
}

async function sendTestEmail() {
  if (!transporter) {
    throw new Error('SMTP non configuré : SMTP_USER et SMTP_PASS sont requis pour l’envoi d’email.');
  }

  const testMessage = {
    from: process.env.FROM_EMAIL || 'no-reply@ecommerce-jim.local',
    to: ownerEmail,
    subject: 'Test d’envoi email - Ecommerce JIM',
    text: `Bonjour, ceci est un email de test envoyé à ${new Date().toISOString()}. Si vous le recevez, la configuration SMTP est correcte.`,
  };

  try {
    return await transporter.sendMail(testMessage);
  } catch (err) {
    throw new Error(`Échec envoi test email : ${err.message || err}`);
  }
}

async function sendContactNotification(name, email, message) {
  if (!transporter) {
    console.warn('SMTP non configuré : notification contact non envoyée.');
    return null;
  }

  const mailMessage = {
    from: process.env.FROM_EMAIL || 'no-reply@ecommerce-jim.local',
    to: ownerEmail,
    subject: `Nouveau message de contact de ${name}`,
    text: `Un nouveau message de contact a été reçu.\n\nNom: ${name}\nEmail: ${email}\nMessage:\n${message}\n\nEnvoyé le: ${new Date().toLocaleString('fr-FR')}`,
    html: `
      <h2>Nouveau message de contact</h2>
      <p><strong>Nom:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p><small>Envoyé le: ${new Date().toLocaleString('fr-FR')}</small></p>
    `,
  };

  try {
    return await transporter.sendMail(mailMessage);
  } catch (err) {
    console.error('Échec envoi email contact:', err.message || err);
    throw new Error(`Échec envoi email contact : ${err.message || err}`);
  }
}

async function sendPasswordResetEmail(email, resetToken) {
  if (!transporter) {
    console.error('[EMAIL] SMTP non configuré : SMTP_USER et SMTP_PASS sont requis pour l\'envoi d\'email.');
    throw new Error('SMTP non configuré : SMTP_USER et SMTP_PASS sont requis pour l\'envoi d\'email.');
  }

  const resetUrl = `http://localhost:3000/auth/reset-password?token=${resetToken}`;

  const message = {
    from: process.env.FROM_EMAIL || 'no-reply@ecommerce-jim.local',
    to: email,
    subject: 'Réinitialisation de mot de passe - Ecommerce JIM',
    text: `Bonjour,\n\nVous avez demandé la réinitialisation de votre mot de passe.\n\nCliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :\n${resetUrl}\n\nCe lien expire dans 1 heure.\n\nSi vous n'avez pas demandé cette réinitialisation, ignorez cet email.\n\nCordialement,\nL'équipe Ecommerce JIM`,
    html: `
      <h2>Réinitialisation de mot de passe</h2>
      <p>Bonjour,</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
      <p><a href="${resetUrl}">Réinitialiser mon mot de passe</a></p>
      <p><strong>Ce lien expire dans 1 heure.</strong></p>
      <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
      <hr>
      <p><small>Cordialement, L'équipe Ecommerce JIM</small></p>
    `,
  };

  try {
    console.log(`[EMAIL] Tentative d'envoi d'email de réinitialisation à ${email}`);
    const result = await transporter.sendMail(message);
    console.log(`[EMAIL] Email de réinitialisation envoyé avec succès à ${email}`);
    return result;
  } catch (err) {
    console.error(`[EMAIL] Échec envoi email réinitialisation à ${email}:`, err.message || err);
    throw new Error(`Échec envoi email réinitialisation : ${err.message || err}`);
  }
}

async function sendVerificationEmail(email, verificationToken) {
  if (!transporter) {
    console.error('[EMAIL] SMTP non configuré : SMTP_USER et SMTP_PASS sont requis pour l\'envoi d\'email.');
    throw new Error('SMTP non configuré : SMTP_USER et SMTP_PASS sont requis pour l\'envoi d\'email.');
  }

  const verificationUrl = `http://localhost:3000/auth/verify-email?token=${verificationToken}`;

  const message = {
    from: process.env.FROM_EMAIL || 'no-reply@ecommerce-jim.local',
    to: email,
    subject: 'Vérification de votre email - Ecommerce JIM',
    text: `Bonjour,\n\nMerci pour votre inscription sur Ecommerce JIM.\n\nVeuillez cliquer sur le lien ci-dessous pour vérifier votre adresse email :\n${verificationUrl}\n\nCe lien expire dans 24 heures.\n\nSi vous n'avez pas créé de compte, ignorez cet email.\n\nCordialement,\nL'équipe Ecommerce JIM`,
    html: `
      <h2>Vérification de votre email</h2>
      <p>Bonjour,</p>
      <p>Merci pour votre inscription sur Ecommerce JIM.</p>
      <p>Veuillez cliquer sur le lien ci-dessous pour vérifier votre adresse email :</p>
      <p><a href="${verificationUrl}">Vérifier mon email</a></p>
      <p><strong>Ce lien expire dans 24 heures.</strong></p>
      <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
      <hr>
      <p><small>Cordialement, L'équipe Ecommerce JIM</small></p>
    `,
  };

  try {
    console.log(`[EMAIL] Tentative d'envoi d'email de vérification à ${email}`);
    const result = await transporter.sendMail(message);
    console.log(`[EMAIL] Email de vérification envoyé avec succès à ${email}`);
    return result;
  } catch (err) {
    console.error(`[EMAIL] Échec envoi email vérification à ${email}:`, err.message || err);
    throw new Error(`Échec envoi email vérification : ${err.message || err}`);
  }
}

module.exports = { sendOrderNotification, sendCustomerNotification, sendTestEmail, sendContactNotification, sendPasswordResetEmail, sendVerificationEmail };