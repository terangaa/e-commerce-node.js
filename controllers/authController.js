const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User } = require('../models');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Afficher l'inscription
async function showRegister(req, res) {
  res.render('auth/register', { error: null });
}

// Enregistrer un utilisateur (email verification désactivée)
async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role)
      return res.render('auth/register', { error: 'Tous les champs sont requis' });

    if (!['admin', 'customer'].includes(role))
      return res.render('auth/register', { error: 'Rôle invalide' });

    const existing = await User.findOne({ where: { email } });
    if (existing)
      return res.render('auth/register', { error: 'Email déjà utilisé' });

    const passwordHash = await bcrypt.hash(password, 10);

    // Créer l'utilisateur directement comme "vérifié"
    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      emailVerified: true, // ✅ email considéré comme vérifié
      emailVerificationToken: null,
      emailVerificationExpiry: null
    });

    // Connecter l'utilisateur
    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };

    // Rediriger selon le rôle
    if (user.role === 'admin') {
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/');
    }

  } catch (err) {
    next(err);
  }
}

// Afficher la page de connexion
async function showLogin(req, res) {
  res.render('auth/login', { error: null });
}

// Connexion
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.render('auth/login', { error: 'Tous les champs sont requis' });

    const user = await User.findOne({ where: { email } });
    if (!user)
      return res.render('auth/login', { error: 'Veuillez vérifier vos identifiants' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
      return res.render('auth/login', { error: 'Veuillez vérifier vos identifiants' });

    // ❌ Pas de blocage si email non vérifié

    // Vérifier si 2FA est activé
    if (user.twoFactorEnabled) {
      req.session.twoFactorUserId = user.id;
      return res.redirect('/auth/2fa/verify-login');
    }

    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };

    if (user.role === 'admin') {
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/');
    }
  } catch (err) {
    next(err);
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
  res.render('auth/profile', { user: req.session.user, error: null, success: null });
}

async function updateProfile(req, res, next) {
  try {
    if (!req.session.user) return res.redirect('/auth/login');

    const { name, email, newPassword, confirmPassword } = req.body;
    const userId = req.session.user.id;

    if (!name || !email) {
      return res.render('auth/profile', { user: req.session.user, error: 'Le nom et l\'email sont requis', success: null });
    }

    const existingUser = await User.findOne({ where: { email, id: { [require('sequelize').Op.ne]: userId } } });
    if (existingUser) {
      return res.render('auth/profile', { user: req.session.user, error: 'Cet email est déjà utilisé par un autre compte', success: null });
    }

    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword)
        return res.render('auth/profile', { user: req.session.user, error: 'Les mots de passe ne correspondent pas', success: null });
      if (newPassword.length < 6)
        return res.render('auth/profile', { user: req.session.user, error: 'Le mot de passe doit contenir au moins 6 caractères', success: null });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.render('auth/profile', { user: req.session.user, error: 'Utilisateur introuvable', success: null });

    user.name = name;
    user.email = email;
    if (newPassword) user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };

    res.render('auth/profile', { user: req.session.user, error: null, success: 'Profil mis à jour avec succès' });
  } catch (err) {
    next(err);
  }
}

// Historique des commandes
async function showOrderHistory(req, res, next) {
  try {
    if (!req.session.user) return res.redirect('/auth/login');

    const { Order, OrderItem, Product } = require('../models');
    const orders = await Order.findAll({
      where: { customerEmail: req.session.user.email },
      include: [{ model: OrderItem, include: [Product] }],
      order: [['createdAt', 'DESC']],
    });

    res.render('auth/orderHistory', { user: req.session.user, orders, error: null, success: null });
  } catch (err) {
    next(err);
  }
}

// Mot de passe oublié
async function showForgotPassword(req, res) {
  res.render('auth/forgotPassword', { error: null, success: null });
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.render('auth/forgotPassword', { error: 'L\'email est requis', success: null });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.render('auth/forgotPassword', { error: null, success: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 heure

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    const { sendPasswordResetEmail } = require('../services/emailService');
    try { await sendPasswordResetEmail(user.email, resetToken); } catch (e) { console.error(e.message); }

    res.render('auth/forgotPassword', { error: null, success: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' });
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

// ❌ Email verification désactivée : plus besoin de ces fonctions
async function verifyEmail(req, res, next) { res.redirect('/auth/login'); }
async function resendVerificationEmail(req, res, next) { res.redirect('/auth/login'); }
async function showVerifyEmail(req, res) { res.redirect('/auth/login'); }

// Fonctions 2FA (restent inchangées)
async function showTwoFactorSetup(req, res) { /* ... reste inchangé ... */ }
async function setupTwoFactor(req, res, next) { /* ... reste inchangé ... */ }
async function verifyTwoFactor(req, res, next) { /* ... reste inchangé ... */ }
async function disableTwoFactor(req, res, next) { /* ... reste inchangé ... */ }
async function showTwoFactorVerify(req, res) { /* ... reste inchangé ... */ }
async function verifyTwoFactorLogin(req, res, next) { /* ... reste inchangé ... */ }

module.exports = {
  showRegister, register, showLogin, login, logout,
  showProfile, updateProfile, showOrderHistory,
  showForgotPassword, forgotPassword, showResetPassword, resetPassword,
  verifyEmail, resendVerificationEmail, showVerifyEmail,
  showTwoFactorSetup, setupTwoFactor, verifyTwoFactor, disableTwoFactor, showTwoFactorVerify, verifyTwoFactorLogin
};