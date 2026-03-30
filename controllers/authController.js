const bcrypt = require('bcrypt');
const { User } = require('../models');

async function showRegister(req, res) {
  res.render('auth/register', { error: null });
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.render('auth/register', { error: 'Tous les champs sont requis' });

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.render('auth/register', { error: 'Email déjà utilisé' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role: 'admin' });
    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.redirect('/admin/dashboard');
  } catch (err) {
    next(err);
  }
}

async function showLogin(req, res) {
  res.render('auth/login', { error: null });
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.render('auth/login', { error: 'Tous les champs sont requis' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.render('auth/login', { error: 'Veuillez vérifier vos identifiants' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.render('auth/login', { error: 'Veuillez vérifier vos identifiants' });

    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.redirect('/admin/dashboard');
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/');
  });
}

module.exports = { showRegister, register, showLogin, login, logout };