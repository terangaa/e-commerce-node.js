const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Wishlist', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'wishlists',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'productId']
      }
    ]
  });
};
