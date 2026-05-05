const Settings = sequelize.define('Settings', {
  shopName: DataTypes.STRING,
  shopAddress: DataTypes.STRING,
  contactEmail: DataTypes.STRING,
  contactPhone: DataTypes.STRING,
  ownerWhatsApp: DataTypes.STRING
});