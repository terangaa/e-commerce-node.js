#!/bin/bash
# 🚀 Setup Script pour E-Commerce JIM
# Usage: bash setup.sh

echo "╔════════════════════════════════════════════╗"
echo "║  E-Commerce JIM - Setup Automatique        ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé."
    echo "📥 Installez Node.js depuis https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Vérifier npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé."
    exit 1
fi

echo "✅ npm version: $(npm --version)"
echo ""

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de l'installation des dépendances"
    exit 1
fi

echo "✅ Dépendances installées"
echo ""

# Configurer les variables d'environnement
echo "⚙️  Configuration des variables d'environnement..."
if [ ! -f .env ]; then
    echo "Création du fichier .env..."
    cat > .env << 'EOF'
# ===== SERVER CONFIGURATION =====
NODE_ENV=development
PORT=3000

# ===== SESSION & SECURITY =====
SESSION_SECRET=your-super-secret-key-change-in-production

# ===== DATABASE =====
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ecommerce_jim
DB_DIALECT=mysql

# ===== EMAIL SERVICE =====
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password

# ===== CORS =====
CORS_ORIGIN=http://localhost:3000
EOF
    echo "✅ Fichier .env créé (modifiez les valeurs si nécessaire)"
else
    echo "✅ Fichier .env existe déjà"
fi

echo ""

# Créer l'administrateur
echo "👤 Création de l'administrateur..."
node scripts/create-admin.js

if [ $? -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════╗"
    echo "║  ✅ Setup Complété avec Succès!           ║"
    echo "╚════════════════════════════════════════════╝"
    echo ""
    echo "🚀 Pour démarrer l'application:"
    echo "   npm start"
    echo ""
    echo "🌐 L'application sera disponible à:"
    echo "   http://localhost:3000"
    echo ""
    echo "🔐 Connexion Admin:"
    echo "   Email: admin@ecommercejim.com"
    echo "   Mot de passe: admin123456"
    echo ""
else
    echo "❌ Erreur lors de la création de l'administrateur"
    exit 1
fi
