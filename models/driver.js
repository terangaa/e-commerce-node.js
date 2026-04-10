// Exemple Sequelize
const Driver = sequelize.define('Driver', {
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    isAvailable: { type: DataTypes.BOOLEAN, defaultValue: true },
    currentLat: { type: DataTypes.FLOAT },
    currentLng: { type: DataTypes.FLOAT },
});