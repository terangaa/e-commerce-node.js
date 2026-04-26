const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const i18n = require('i18n');
const session = require('express-session');
const { sequelize } = require('./models');

const publicRoutes = require('./routes/public');
const { home, contactPage, contactSubmit } = require('./controllers/publicController');
const adminWebRoutes = require('./routes/adminWeb');
const orderRoutes = require('./routes/order');
const authRoutes = require('./routes/auth');
const socialAuthRoutes = require('./routes/socialAuth');
const chatbotRoutes = require('./routes/chatbot');
const reviewRoutes = require('./routes/review');
const wishlistRoutes = require('./routes/wishlist');
const couponRoutes = require('./routes/coupon');

const app = express();
const PORT = process.env.PORT || 3000;

/* ─────────────────────────────
   🌍 Internationalisation
───────────────────────────── */
i18n.configure({
  locales: ['en', 'fr'],
  defaultLocale: 'fr',
  queryParameter: 'lang',
  directory: path.join(__dirname, 'locales'),
  objectNotation: true,
  register: global,
});
app.use(i18n.init);

/* ─────────────────────────────
   ⚙️ Middlewares
───────────────────────────── */
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/* ─────────────────────────────
   🔐 Session
───────────────────────────── */
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 3600 * 1000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  },
}));

/* ─────────────────────────────
   🧠 Global locals
───────────────────────────── */
app.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  res.locals.locale = req.getLocale?.() || 'fr';
  res.locals.ownerWhatsApp = process.env.OWNER_WHATSAPP || "221765957481";

  const cart = req.session?.cart || [];
  res.locals.cartCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  next();
});

/* ─────────────────────────────
   🎨 View engine
───────────────────────────── */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ─────────────────────────────
   📁 STATIC FILES (FIX IMPORTANT)
───────────────────────────── */

/* ✅ UNIQUEMENT CETTE VERSION (PROPRE + PRODUCTION SAFE) */
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

/* optionnel si tu utilises /public */
app.use('/public', express.static(path.join(__dirname, 'public')));

/* ─────────────────────────────
   📊 Logger
───────────────────────────── */
app.use((req, res, next) => {
  console.log('[REQ]', req.method, req.originalUrl);
  next();
});

/* ─────────────────────────────
   🧭 Routes principales
───────────────────────────── */
app.get('/', home);
app.get('/contact', contactPage);
app.post('/contact', contactSubmit);

/* Auth */
app.use('/auth', authRoutes);
app.use('/auth', socialAuthRoutes);

/* App modules */
app.use('/products', publicRoutes);
app.use('/admin', adminWebRoutes);
app.use('/orders', orderRoutes);
app.use('/chatbot', chatbotRoutes);
app.use('/reviews', reviewRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/coupons', couponRoutes);

/* ─────────────────────────────
   🔁 Redirects
───────────────────────────── */
app.get('/cart', (req, res) => res.redirect('/products/cart'));
app.get('/checkout', (req, res) => res.redirect('/products/cart'));
app.post('/orders/submit', (req, res) => res.redirect(307, '/orders'));

/* ─────────────────────────────
   ❌ 404 handler
───────────────────────────── */
app.use((req, res) => {
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(404).json({ error: __('non trouve') });
  }

  res.status(404).send(`
    <h1>404 - Page introuvable</h1>
    <a href="/">Retour accueil</a>
  `);
});

/* ─────────────────────────────
   ⚠️ Error handler
───────────────────────────── */
app.use((err, req, res, next) => {
  console.error('[ERREUR]', err);

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(err.status || 500).json({
      error: err.message || __('erreur_interne')
    });
  }

  res.status(err.status || 500).send(`
    <h1>Erreur serveur</h1>
    <p>${err.message}</p>
  `);
});

/* ─────────────────────────────
   🚀 START SERVER
───────────────────────────── */
async function start() {
  try {
    console.log("DATABASE_URL =", process.env.DATABASE_URL);

    await sequelize.authenticate();
    console.log('✅ DB connectée');

    await sequelize.sync({ alter: true });

    app.listen(PORT, () => {
      console.log(`🚀 Serveur lancé sur port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ Erreur serveur:', err);
    process.exit(1);
  }
}

start();