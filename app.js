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

// ─── Internationalisation ───────────────────────────────────────────────────
i18n.configure({
  locales: ['en', 'fr'],
  defaultLocale: 'fr',
  queryParameter: 'lang',
  directory: path.join(__dirname, 'locales'),
  objectNotation: true,
  register: global,
});
app.use(i18n.init);

// ─── Middlewares de base ────────────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ─── Session ────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-super-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 3600 * 1000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  },
}));

app.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  res.locals.locale = req.getLocale?.() || 'fr';
  res.locals.ownerWhatsApp = process.env.OWNER_WHATSAPP || "221765957481";
  next();
});

// ─── Moteur de vues ─────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Fichiers statiques ─────────────────────────────────────────────────────
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/uploads/valise', express.static(path.join(__dirname, 'public', 'uploads', 'valise')));
app.use('/uploads/drap', express.static(path.join(__dirname, 'public', 'uploads', 'drap')));
app.use('/uploads/jalabi', express.static(path.join(__dirname, 'public', 'uploads', 'jalabi')));

// ─── Logger de requêtes ─────────────────────────────────────────────────────
app.use((req, res, next) => {
  console.log('[REQ]', req.method, req.originalUrl);
  next();
});

// ─── Variables locales globales ─────────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.user = req.session && req.session.user ? req.session.user : null;
  res.locals.locale = (req.getLocale && req.getLocale()) ? req.getLocale() : 'fr';
  const cart = req.session && req.session.cart ? req.session.cart : [];
  res.locals.cartCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  res.locals.ownerWhatsApp = global.ownerWhatsApp || '';
  next();
});

// ─── Routes ─────────────────────────────────────────────────────────────────
app.get('/', home);
app.get('/contact', contactPage);
app.post('/contact', contactSubmit);

// ✅ Auth : montage unique avec authRoutes ET socialAuthRoutes ensemble
app.use('/auth', authRoutes);
app.use('/auth', socialAuthRoutes);

app.use('/products', publicRoutes);
app.use('/admin', adminWebRoutes);
app.use('/orders', orderRoutes);
app.use('/chatbot', chatbotRoutes);
app.use('/reviews', reviewRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/coupons', couponRoutes);

// ─── Raccourcis ─────────────────────────────────────────────────────────────
app.get('/cart', (req, res) => res.redirect('/products/cart'));
app.get('/checkout', (req, res) => res.redirect('/products/cart'));
app.post('/orders/submit', (req, res) => res.redirect(307, '/orders'));

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  // Réponse JSON pour les API, page HTML pour le navigateur
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.status(404).json({ error: __('non trouve') });
  }
  res.status(404).send('<h1>404 – Page introuvable</h1><a href="/">Retour à l\'accueil</a>');
});

// ─── Gestionnaire d'erreurs global ✅ CORRIGÉ ────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERREUR]', err.message);
  console.error(err.stack);

  // Requête API → réponse JSON
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.status(err.status || 500).json({ error: err.message || __('erreur_interne') });
  }

  // Requête navigateur → page HTML lisible
  // Si vous avez une vue views/error.ejs, utilisez res.render :
  // return res.status(err.status || 500).render('error', { message: err.message, stack: err.stack, cartItems: [], totalAmount: 0, cartCount: 0 });

  res.status(err.status || 500).send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="UTF-8"><title>Erreur serveur</title>
    <style>
      body { font-family: sans-serif; padding: 2rem; }
      h1 { color: #c0392b; }
      pre { background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow: auto; }
      a { color: #2980b9; }
    </style>
    </head>
    <body>
      <h1>Erreur serveur</h1>
      <p>${err.message || 'Une erreur inattendue s\'est produite.'}</p>
      ${process.env.NODE_ENV !== 'production' ? `<pre>${err.stack}</pre>` : ''}
      <a href="/">← Retour à l'accueil</a>
    </body>
    </html>
  `);
});

// ─── Démarrage ───────────────────────────────────────────────────────────────
async function start() {
  try {
    console.log("DATABASE_URL =", process.env.DATABASE_URL);

    await sequelize.authenticate();
    console.log('✅ Base de données connectée.');

    // 🔥 IMPORTANT
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync();
    }

    app.listen(PORT, () => {
      console.log(`✅ Serveur démarré sur port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ Erreur au démarrage :', err);
    process.exit(1);
  }
}

start();