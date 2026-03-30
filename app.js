const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const i18n = require('i18n');
const session = require('express-session');
const { sequelize } = require('./models');
const publicRoutes = require('./routes/public');
const { home } = require('./controllers/publicController');
const adminRoutes = require('./routes/admin');
const adminWebRoutes = require('./routes/adminWeb');
const orderRoutes = require('./routes/order');
const authRoutes = require('./routes/auth');

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

app.use('/public', express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.locals.user = req.session && req.session.user ? req.session.user : null;
  res.locals.locale = (req.getLocale && req.getLocale()) ? req.getLocale() : 'fr';
  next();
});

app.get('/', home);

app.use('/auth', authRoutes);
app.use('/products', publicRoutes);
app.use('/admin', adminRoutes);
app.use('/admin', adminWebRoutes);
app.use('/orders', orderRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: __('not_found') });
});

// global error
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || __('internal_error'),
    stack: err.stack,
  });
});

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connection successful.');

    await sequelize.sync({ alter: true });
    console.log('Database synchronized.');

    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
      console.log(`Visit http://localhost:${PORT}?lang=fr or ?lang=en`);
    });
  } catch (err) {
    console.error('Unable to start server:', err);
    process.exit(1);
  }
}

start();
