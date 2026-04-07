const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database').development;

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging,
});

const Category = require('./category')(sequelize);
const Product = require('./product')(sequelize);
const Order = require('./order')(sequelize);
const OrderItem = require('./orderItem')(sequelize);
const User = require('./user')(sequelize);
const Review = require('./review')(sequelize);
const Wishlist = require('./wishlist')(sequelize);
const Coupon = require('./coupon')(sequelize);
const PaymentTransaction = require('./paymentTransaction')(sequelize);

Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });
Product.hasMany(OrderItem, { foreignKey: 'productId' });
Order.hasMany(PaymentTransaction, { foreignKey: 'orderId', onDelete: 'CASCADE' });
PaymentTransaction.belongsTo(Order, { foreignKey: 'orderId' });

// Associations pour les avis
Product.hasMany(Review, { foreignKey: 'productId', onDelete: 'CASCADE' });
Review.belongsTo(Product, { foreignKey: 'productId' });
User.hasMany(Review, { foreignKey: 'userId', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'userId' });

// Associations pour la liste de souhaits
User.hasMany(Wishlist, { foreignKey: 'userId', onDelete: 'CASCADE' });
Wishlist.belongsTo(User, { foreignKey: 'userId' });
Product.hasMany(Wishlist, { foreignKey: 'productId', onDelete: 'CASCADE' });
Wishlist.belongsTo(Product, { foreignKey: 'productId' });

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
