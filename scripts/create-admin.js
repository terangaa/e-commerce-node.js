const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { sequelize } = require('../models');

async function createAdmin() {
  try {
    // Vérifier la connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');
    
    const email = 'admin@ecommercejim.com';
    const password = 'admin123456';
    const name = 'Admin JIM';
    
    // Vérifier si l'admin existe déjà
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log('⚠️  Admin existe déjà!');
      console.log(`📧 Email: ${existing.email}`);
      console.log(`👤 Nom: ${existing.name}`);
      console.log(`🔓 Rôle: ${existing.role}`);
      process.exit(0);
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Créer l'admin
    const admin = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      role: 'admin',
      emailVerified: true
    });
    
    console.log('\n✅✅✅ ADMIN CRÉÉ AVEC SUCCÈS! ✅✅✅');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email:     ${admin.email}`);
    console.log(`🔐 Mot de passe: ${password}`);
    console.log(`👤 Nom:        ${admin.name}`);
    console.log(`🔓 Rôle:       ${admin.role.toUpperCase()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔗 Accédez à: http://localhost:3000/auth/login');
    console.log('🎯 Après connexion → Dashboard: http://localhost:3000/admin/dashboard\n');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    console.error(err);
    process.exit(1);
  }
}

// Lancer le script
console.log('\n🚀 Création d\'un administrateur...\n');
createAdmin();
