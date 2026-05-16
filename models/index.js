require('dotenv').config();
const { Sequelize } = require('sequelize');

// ─────────────────────────────
// 🌍 CONFIG DB (LOCAL + PROD)
// ─────────────────────────────
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      logging: false,
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
      }
    );

// ─────────────────────────────
// 📦 MODELS
// ─────────────────────────────
const Category = require('./category')(sequelize);
const Product = require('./product')(sequelize);
const Order = require('./order')(sequelize);
const OrderItem = require('./orderItem')(sequelize);
const User = require('./user')(sequelize);
const Review = require('./review')(sequelize);
const Wishlist = require('./wishlist')(sequelize);
const Coupon = require('./coupon')(sequelize);
const PaymentTransaction = require('./paymentTransaction')(sequelize);

// ─────────────────────────────
// 🔗 ASSOCIATIONS (IMPORTANT FIX)
// ─────────────────────────────

// ================= CATEGORY ↔ PRODUCT =================
Category.hasMany(Product, {
  foreignKey: 'categoryId',
  as: 'products',
  onDelete: 'CASCADE',
});

Product.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category',
});

// ================= ORDER ↔ ITEMS =================
Order.hasMany(OrderItem, {
  foreignKey: 'orderId',
  onDelete: 'CASCADE',
});

OrderItem.belongsTo(Order, {
  foreignKey: 'orderId',
});

// ================= PRODUCT ↔ ORDER ITEMS =================
Product.hasMany(OrderItem, {
  foreignKey: 'productId',
  onDelete: 'CASCADE',
});

OrderItem.belongsTo(Product, {
  foreignKey: 'productId',
});

// ================= ORDER ↔ PAYMENT =================
Order.hasMany(PaymentTransaction, {
  foreignKey: 'orderId',
  onDelete: 'CASCADE',
});

PaymentTransaction.belongsTo(Order, {
  foreignKey: 'orderId',
});

// ================= PRODUCT ↔ REVIEW =================
Product.hasMany(Review, {
  foreignKey: 'productId',
  onDelete: 'CASCADE',
});

Review.belongsTo(Product, {
  foreignKey: 'productId',
});

// ================= USER ↔ REVIEW =================
User.hasMany(Review, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});

Review.belongsTo(User, {
  foreignKey: 'userId',
});

// ================= USER ↔ WISHLIST =================
User.hasMany(Wishlist, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});

Wishlist.belongsTo(User, {
  foreignKey: 'userId',
});

// ================= PRODUCT ↔ WISHLIST =================
Product.hasMany(Wishlist, {
  foreignKey: 'productId',
  onDelete: 'CASCADE',
});

Wishlist.belongsTo(Product, {
  foreignKey: 'productId',
});

// ─────────────────────────────
// 🚀 SYNC HELPER (OPTIONNEL MAIS UTILE)
// ─────────────────────────────
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // ⚠️ en production utiliser { alter: true } ou migrations
    await sequelize.sync({ alter: true });

    console.log('✅ Models synchronized');
  } catch (error) {
    console.error('❌ DB Error:', error);
  }
};

// ─────────────────────────────
// 📤 EXPORT
// ─────────────────────────────
module.exports = {
  sequelize,
  Category,
  Product,
  Order,
  OrderItem,
  User,
  Review,
  Wishlist,
  Coupon,
  PaymentTransaction,
  syncDatabase,
};