const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const i18n = require('i18n');
const session = require('express-session');
const { sequelize } = require('./models');
const publicRoutes = require('./routes/public');
const { home, contactPage, contactSubmit } = require('./controllers/publicController');
const adminRoutes = require('./routes/admin');
const adminWebRoutes = require('./routes/adminWeb');
const orderRoutes = require('./routes/order');
const authRoutes = require('./routes/auth');
const chatbotRoutes = require('./routes/chatbot');
const reviewRoutes = require('./routes/review');
const wishlistRoutes = require('./routes/wishlist');
const couponRoutes = require('./routes/coupon');
const socialAuthRoutes = require('./routes/socialAuth');

const app = express();
const PORT = process.env.PORT || 3000;

// Internationalization configuration
i18n.configure({
  locales: ['en', 'fr'],
  defaultLocale: 'fr',
  queryParameter: 'lang',
  directory: path.join(__dirname, 'locales'),
  objectNotation: true,
  register: global,
});

app.use(i18n.init);
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'ecommerce_secret_123',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 3600 * 1000 },
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Sert tout le dossier public (y compris sous-dossiers)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Raccourcis directs vers les sous-dossiers uploads
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/uploads/valise', express.static(path.join(__dirname, 'public', 'uploads', 'valise')));
app.use('/uploads/drap', express.static(path.join(__dirname, 'public', 'uploads', 'drap')));
app.use('/uploads/jalabi', express.static(path.join(__dirname, 'public', 'uploads', 'jalabi')));

app.use((req, res, next) => {
  console.log('[REQ]', req.method, req.originalUrl);
  next();
});

app.use((req, res, next) => {
  res.locals.user = req.session && req.session.user ? req.session.user : null;
  res.locals.locale = (req.getLocale && req.getLocale()) ? req.getLocale() : 'fr';

  const cart = req.session && req.session.cart ? req.session.cart : [];
  res.locals.cartCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  next();
});

app.get('/', home);

app.use('/auth', authRoutes);
app.use('/products', publicRoutes);
app.use('/cart', publicRoutes); // alias vers la même logique panier/produit
app.get('/contact', contactPage);
app.post('/contact', contactSubmit);
app.use('/admin', adminWebRoutes);
app.use('/orders', orderRoutes);
app.use('/chatbot', chatbotRoutes);
app.use('/reviews', reviewRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/coupons', couponRoutes);
app.use('/auth', socialAuthRoutes);

// Raccourcis d'accès (e.g. /cart, /checkout) vers routes existantes
app.get('/cart', (req, res) => res.redirect('/products/cart'));
app.get('/checkout', (req, res) => res.redirect('/products/cart'));
app.post('/orders/submit', (req, res) => res.redirect(307, '/orders'));

// 404
app.use((req, res) => {
  res.status(404).json({ error: __('non trouve') });
});

// global error
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || __('erreur_interne'),
    stack: err.stack,
  });
});

async function start() {
  try {
    await sequelize.authenticate();
    console.log('la base de donnees est connectee.');

    await sequelize.sync();
    console.log('les tables de la base de donnees sont synchronisees.');

    app.listen(PORT, () => {
      console.log(`le serveur est demarre sur le port ${PORT}`);
      console.log(`Visit http://localhost:${PORT}?lang=fr or ?lang=en`);
    });
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

start();
