const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customerName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    customerEmail: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    customerPhone: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    customerAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'pending',
    },
    deliveryMethod: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'standard',
    },
    deliveryStatus: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'not_assigned',
    },
    deliveryLat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    deliveryLng: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    deliveryDriver: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'cash',
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0,
    },
  }, {
    tableName: 'orders',
  });
};
