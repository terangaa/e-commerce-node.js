const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User } = require('../models');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Helper pour obtenir les données du panier
async function getCartData(req) {
  const { Product, Category } = require('../models');
  const cart = req.session.cart || [];
  const productIds = cart.map(i => i.productId);
  const products = productIds.length ? await Product.findAll({ where: { id: productIds }, include: Category }) : [];

  const cartItems = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      product,
      quantity: item.quantity,
      total: product ? Number(product.price) * Number(item.quantity) : 0,
    };
  });

  const totalAmount = cartItems.reduce((sum, item) => sum + item.total, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return { cartItems, totalAmount, cartCount };
}

// Afficher l'inscription
async function showRegister(req, res) {
  const { cartItems, totalAmount, cartCount } = await getCartData(req);
  res.render('auth/register', { error: null, success: null, name: '', email: '', cartItems, totalAmount, cartCount });
}

// Enregistrer un utilisateur
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      const { cartItems, totalAmount, cartCount } = await getCartData(req);
      return res.render('auth/register', { error: 'Tous les champs sont requis', success: null, name, email, cartItems, totalAmount, cartCount });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      const { cartItems, totalAmount, cartCount } = await getCartData(req);
      return res.render('auth/register', { error: 'Email déjà utilisé', success: null, name, email, cartItems, totalAmount, cartCount });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'customer',
      emailVerified: true
    });

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.redirect('/');

  } catch (err) {
    next(err);
  }
}

// Afficher la page de connexion
async function showLogin(req, res) {
  const { cartItems, totalAmount, cartCount } = await getCartData(req);
  res.render('auth/login', { error: null, success: null, email: '', cartItems, totalAmount, cartCount });
}

// ✅ Connexion avec logs de debug et redirections correctes
async function login(req, res, next) {
  try {
    console.log('STEP 1 - body recu:', req.body);
    const { email, password } = req.body;
    console.log('STEP 2 - email:', email, '| password:', password ? '***' : 'VIDE');

    if (!email || !password) {
      console.log('STEP 3 - champs manquants');
      const { cartItems, totalAmount, cartCount } = await getCartData(req);
      return res.render('auth/login', {
        error: 'Veuillez fournir un email et un mot de passe',
        success: null,
        email,
        cartItems,
        totalAmount,
        cartCount
      });
    }

    console.log('STEP 4 - recherche user en base...');
    const user = await User.findOne({ where: { email } });
    console.log('STEP 5 - user trouve:', user ? user.email : 'AUCUN');

    if (!user) {
      const { cartItems, totalAmount, cartCount } = await getCartData(req);
      return res.render('auth/login', {
        error: 'Email ou mot de passe incorrect',
        success: null,
        email,
        cartItems,
        totalAmount,
        cartCount
      });
    }

    console.log('STEP 6 - verification mot de passe...');
    const valid = await bcrypt.compare(password, user.passwordHash);
    console.log('STEP 7 - mot de passe valide:', valid);

    if (!valid) {
      const { cartItems, totalAmount, cartCount } = await getCartData(req);
      return res.render('auth/login', {
        error: 'Email ou mot de passe incorrect',
        success: null,
        email,
        cartItems,
        totalAmount,
        cartCount
      });
    }

    console.log('STEP 8 - creation session...');
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    console.log('STEP 9 - role:', user.role, '| redirection...');
    
    // Redirection selon le rôle
    if (user.role === 'admin') {
      console.log('STEP 10 - Redirection admin vers /admin/dashboard');
      return res.redirect('/admin/dashboard');
    } else {
      console.log('STEP 10 - Redirection customer vers /');
      return res.redirect('/');
    }

  } catch (err) {
    console.error('ERREUR LOGIN:', err.message);
    console.error(err.stack);
    const { cartItems, totalAmount, cartCount } = await getCartData(req);
    return res.render('auth/login', {
      error: 'Une erreur serveur est survenue. Veuillez réessayer.',
      success: null,
      email: req.body.email || '',
      cartItems,
      totalAmount,
      cartCount
    });
  }
}

// Déconnexion
async function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/');
  });
}

// Profil
async function showProfile(req, res) {
  if (!req.session.user) return res.redirect('/auth/login');
  const { cartItems, totalAmount, cartCount } = await getCartData(req);
  res.render('auth/profile', { user: req.session.user, cartItems, totalAmount, cartCount, error: null, success: null });
}

async function updateProfile(req, res, next) {
  try {
    if (!req.session.user) return res.redirect('/auth/login');

    const { cartItems, totalAmount, cartCount } = await getCartData(req);
    const { name, email, newPassword, confirmPassword } = req.body;
    const userId = req.session.user.id;

    if (!name || !email) {
      return res.render('auth/profile', { user: req.session.user, cartItems, totalAmount, cartCount, error: 'Le nom et l\'email sont requis', success: null });
    }

    const existingUser = await User.findOne({ where: { email, id: { [require('sequelize').Op.ne]: userId } } });
    if (existingUser) {
      return res.render('auth/profile', { user: req.session.user, cartItems, totalAmount, cartCount, error: 'Cet email est déjà utilisé par un autre compte', success: null });
    }

    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword)
        return res.render('auth/profile', { user: req.session.user, cartItems, totalAmount, cartCount, error: 'Les mots de passe ne correspondent pas', success: null });
      if (newPassword.length < 6)
        return res.render('auth/profile', { user: req.session.user, cartItems, totalAmount, cartCount, error: 'Le mot de passe doit contenir au moins 6 caractères', success: null });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.render('auth/profile', { user: req.session.user, cartItems, totalAmount, cartCount, error: 'Utilisateur introuvable', success: null });

    user.name = name;
    user.email = email;
    if (newPassword) user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };

    res.render('auth/profile', { user: req.session.user, cartItems, totalAmount, cartCount, error: null, success: 'Profil mis à jour avec succès' });
  } catch (err) {
    next(err);
  }
}

// Historique des commandes
async function showOrderHistory(req, res, next) {
  try {
    if (!req.session.user) return res.redirect('/auth/login');

    const { cartItems, totalAmount, cartCount } = await getCartData(req);
    const { Order, OrderItem, Product } = require('../models');
    const orders = await Order.findAll({
      where: { customerEmail: req.session.user.email },
      include: [{ model: OrderItem, include: [Product] }],
      order: [['createdAt', 'DESC']],
    });

    res.render('auth/orderHistory', { user: req.session.user, cartItems, totalAmount, cartCount, orders, error: null, success: null });
  } catch (err) {
    next(err);
  }
}

// Mot de passe oublié
async function showForgotPassword(req, res) {
  const { cartItems, totalAmount, cartCount } = await getCartData(req);
  res.render('auth/forgotPassword', { cartItems, totalAmount, cartCount, error: null, success: null });
}

async function forgotPassword(req, res, next) {
  try {
    const { cartItems, totalAmount, cartCount } = await getCartData(req);
    const { email } = req.body;
    if (!email) return res.render('auth/forgotPassword', { cartItems, totalAmount, cartCount, error: 'L\'email est requis', success: null });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.render('auth/forgotPassword', { cartItems, totalAmount, cartCount, error: null, success: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    const { sendPasswordResetEmail } = require('../services/emailService');
    try { await sendPasswordResetEmail(user.email, resetToken); } catch (e) { console.error(e.message); }

    res.render('auth/forgotPassword', { cartItems, totalAmount, cartCount, error: null, success: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' });
  } catch (err) {
    next(err);
  }
}

// Réinitialisation mot de passe
async function showResetPassword(req, res) {
  const { token } = req.query;
  if (!token) return res.redirect('/auth/forgot-password');
  res.render('auth/resetPassword', { token, error: null, success: null });
}

async function resetPassword(req, res, next) {
  try {
    const { token, password, confirmPassword } = req.body;
    if (!token || !password || !confirmPassword) return res.render('auth/resetPassword', { token, error: 'Tous les champs sont requis', success: null });
    if (password !== confirmPassword) return res.render('auth/resetPassword', { token, error: 'Les mots de passe ne correspondent pas', success: null });
    if (password.length < 6) return res.render('auth/resetPassword', { token, error: 'Le mot de passe doit contenir au moins 6 caractères', success: null });

    const user = await User.findOne({
      where: { resetToken: token, resetTokenExpiry: { [require('sequelize').Op.gt]: new Date() } }
    });

    if (!user) return res.render('auth/resetPassword', { token, error: 'Token invalide ou expiré', success: null });

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.render('auth/resetPassword', { token: null, error: null, success: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.' });
  } catch (err) {
    next(err);
  }
}

// Email verification désactivée
async function verifyEmail(req, res, next) { res.redirect('/auth/login'); }
async function resendVerificationEmail(req, res, next) { res.redirect('/auth/login'); }
async function showVerifyEmail(req, res) { res.redirect('/auth/login'); }

// 2FA
async function showTwoFactorSetup(req, res) {
  if (!req.session.user) return res.redirect('/auth/login');
  const { cartItems, totalAmount, cartCount } = await getCartData(req);
  const user = await User.findByPk(req.session.user.id);
  res.render('auth/twoFactorSetup', { user: req.session.user, cartItems, totalAmount, cartCount, error: null, success: null, qrCode: null, secret: null });
}

async function setupTwoFactor(req, res, next) {
  try {
    if (!req.session.user) return res.redirect('/auth/login');
    const { cartItems, totalAmount, cartCount } = await getCartData(req);
    const secret = speakeasy.generateSecret({ name: `EcommerceJIM (${req.session.user.email})` });
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    req.session.twoFactorSecret = secret.base32;
    res.render('auth/twoFactorSetup', { user: req.session.user, cartItems, totalAmount, cartCount, error: null, success: null, qrCode, secret: secret.base32 });
  } catch (err) {
    next(err);
  }
}

async function verifyTwoFactor(req, res, next) {
  try {
    if (!req.session.user) return res.redirect('/auth/login');
    const { cartItems, totalAmount, cartCount } = await getCartData(req);
    const { token } = req.body;
    const secret = req.session.twoFactorSecret;
    if (!secret) return res.render('auth/twoFactorSetup', { user: req.session.user, cartItems, totalAmount, cartCount, error: 'Session expirée', success: null, qrCode: null, secret: null });

    const verified = speakeasy.totp.verify({ secret, encoding: 'base32', token });
    if (!verified) return res.render('auth/twoFactorSetup', { user: req.session.user, cartItems, totalAmount, cartCount, error: 'Code invalide', success: null, qrCode: null, secret: null });

    const user = await User.findByPk(req.session.user.id);
    user.twoFactorSecret = secret;
    user.twoFactorEnabled = true;
    await user.save();
    delete req.session.twoFactorSecret;

    res.render('auth/twoFactorSetup', { user: req.session.user, cartItems, totalAmount, cartCount, error: null, success: '2FA activé avec succès', qrCode: null, secret: null });
  } catch (err) {
    next(err);
  }
}

async function disableTwoFactor(req, res, next) {
  try {
    if (!req.session.user) return res.redirect('/auth/login');
    const user = await User.findByPk(req.session.user.id);
    user.twoFactorSecret = null;
    user.twoFactorEnabled = false;
    await user.save();
    res.redirect('/auth/profile');
  } catch (err) {
    next(err);
  }
}

async function showTwoFactorVerify(req, res) {
  if (!req.session.twoFactorUserId) return res.redirect('/auth/login');
  res.render('auth/twoFactorVerify', { error: null });
}

async function verifyTwoFactorLogin(req, res, next) {
  try {
    const userId = req.session.twoFactorUserId;
    if (!userId) return res.redirect('/auth/login');

    const { token } = req.body;
    const user = await User.findByPk(userId);
    if (!user) return res.redirect('/auth/login');

    const verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token });
    if (!verified) return res.render('auth/twoFactorVerify', { error: 'Code invalide' });

    delete req.session.twoFactorUserId;
    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };

    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    } else {
      return res.redirect('/');
    }
  } catch (err) {
    next(err);
  }
}

module.exports = {
  showRegister, register, showLogin, login, logout,
  showProfile, updateProfile, showOrderHistory,
  showForgotPassword, forgotPassword, showResetPassword, resetPassword,
  verifyEmail, resendVerificationEmail, showVerifyEmail,
  showTwoFactorSetup, setupTwoFactor, verifyTwoFactor, disableTwoFactor,
  showTwoFactorVerify, verifyTwoFactorLogin
};