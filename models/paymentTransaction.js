
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('PaymentTransaction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderId: { type: DataTypes.INTEGER, allowNull: false },
  provider: { type: DataTypes.STRING(50), allowNull: false },
  transactionId: { type: DataTypes.STRING(150) },
  amount: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { type: DataTypes.STRING(50), defaultValue: 'pending' },
  rawResponse: { type: DataTypes.TEXT('long') },
}, { tableName: 'payment_transactions' });
