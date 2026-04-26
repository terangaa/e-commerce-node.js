const { Sequelize } = require('sequelize');

// ─────────────────────────────────────────────
// 🔥 CONFIG AUTOMATIQUE LOCAL + RENDER
// ─────────────────────────────────────────────

// 👉 PRODUCTION (Render / Railway / VPS)
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  })

  // 👉 LOCAL (ton PC)
  : new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'postgres',
      logging: false
    }
  );

// ─────────────────────────────────────────────
// 📦 MODELS
// ─────────────────────────────────────────────

const Category = require('./category')(sequelize);
const Product = require('./product')(sequelize);
const Order = require('./order')(sequelize);
const OrderItem = require('./orderItem')(sequelize);
const User = require('./user')(sequelize);
const Review = require('./review')(sequelize);
const Wishlist = require('./wishlist')(sequelize);
const Coupon = require('./coupon')(sequelize);
const PaymentTransaction = require('./paymentTransaction')(sequelize);

// ─────────────────────────────────────────────
// 🔗 ASSOCIATIONS
// ─────────────────────────────────────────────

// Categories → Products
Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

// Orders → Items
Order.hasMany(OrderItem, { foreignKey: 'orderId', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

// Products ↔ OrderItems
Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

// Orders → Payments
Order.hasMany(PaymentTransaction, { foreignKey: 'orderId', onDelete: 'CASCADE' });
PaymentTransaction.belongsTo(Order, { foreignKey: 'orderId' });

// Products → Reviews
Product.hasMany(Review, { foreignKey: 'productId', onDelete: 'CASCADE' });
Review.belongsTo(Product, { foreignKey: 'productId' });

// Users → Reviews
User.hasMany(Review, { foreignKey: 'userId', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'userId' });

// Users → Wishlist
User.hasMany(Wishlist, { foreignKey: 'userId', onDelete: 'CASCADE' });
Wishlist.belongsTo(User, { foreignKey: 'userId' });

// Products → Wishlist
Product.hasMany(Wishlist, { foreignKey: 'productId', onDelete: 'CASCADE' });
Wishlist.belongsTo(Product, { foreignKey: 'productId' });

// ─────────────────────────────────────────────
// 📤 EXPORT
// ─────────────────────────────────────────────

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
};