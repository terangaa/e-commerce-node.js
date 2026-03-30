const bcrypt = require('bcrypt');
const { sequelize, Category, Product, User } = require('../models');

async function seed() {
  await sequelize.sync({ force: true });
  
  const defaultPassword = await bcrypt.hash('admin1234', 10);
  await User.create({ name: 'Admin', email: 'admin@ecommerce.local', passwordHash: defaultPassword, role: 'admin' });

  const categories = await Category.bulkCreate([
    { name: 'Chaussures', description: 'Chaussures tendance et confortables' },
    { name: 'Drap', description: 'Draps doux et résistants' },
    { name: 'Lit', description: 'Lits et literie haut de gamme' },
    { name: 'Moto', description: 'Accessoires et pièces pour moto' },
    { name: 'Valises', description: 'Valises de différents modèles' },
  ]);

  const compto = {};
  categories.forEach(c => { compto[c.name] = c.id; });

  await Product.bulkCreate([
    { name: 'Valise UVS', description: 'Valise robuste pour voyage intensif', price: 25000, stock: 20, categoryId: compto['Valises'] },
    { name: 'Valise Original', description: 'Valise design original', price: 30000, stock: 20, categoryId: compto['Valises'] },
    { name: 'Valise petit modèle', description: 'Valise petite pratique', price: 18000, stock: 30, categoryId: compto['Valises'] },
    { name: 'Valise grand modèle', description: 'Valise grande capacité', price: 36000, stock: 10, categoryId: compto['Valises'] },
    { name: 'Basket sport', description: 'Chaussure de sport légère et résistante', price: 12000, stock: 25, categoryId: compto['Chaussures'] },
    { name: 'Sandales cuir', description: 'Sandales en cuir élégantes', price: 9500, stock: 30, categoryId: compto['Chaussures'] },
    { name: 'Drap en coton 2x2m', description: 'Drap doux et respirant', price: 7000, stock: 40, categoryId: compto['Drap'] },
    { name: 'Couette double', description: 'Couette chaude pour toutes saisons', price: 18000, stock: 15, categoryId: compto['Lit'] },
    { name: 'Matelas mousse 160x200', description: 'Matelas confortable à mémoire de forme', price: 45000, stock: 10, categoryId: compto['Lit'] },
    { name: 'Casque moto intégral', description: 'Casque sécurisé et confortable', price: 55000, stock: 12, categoryId: compto['Moto'] },
  ]);

  console.log('Seed completed!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});