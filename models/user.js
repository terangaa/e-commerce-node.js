const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'customer'), allowNull: false, defaultValue: 'customer' },
    resetToken: { type: DataTypes.STRING(255), allowNull: true },
    resetTokenExpiry: { type: DataTypes.DATE, allowNull: true },
    emailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    emailVerificationToken: { type: DataTypes.STRING(255), allowNull: true },
    emailVerificationExpiry: { type: DataTypes.DATE, allowNull: true },
    twoFactorSecret: { type: DataTypes.STRING(255), allowNull: true },
    twoFactorEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, { tableName: 'users' });
};
