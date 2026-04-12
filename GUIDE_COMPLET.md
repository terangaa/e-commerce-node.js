# 📘 Guide Complet - E-Commerce JIM

## 📑 Table des Matières
1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Connexion Admin](#connexion-admin)
4. [Utilisation Admin](#utilisation-admin)
5. [Gestion des Produits](#gestion-des-produits)
6. [Dépannage](#dépannage)
7. [FAQ](#faq)

---

## 🔧 Installation

### **Prérequis**
- ✅ Node.js v14+ ([Download](https://nodejs.org))
- ✅ npm v6+ (inclus avec Node.js)
- ✅ MySQL 5.7+ ou MariaDB
- ✅ Un éditeur de code (VS Code recommandé)

### **Étape 1: Cloner le Projet**
```bash
# Via HTTPS
git clone https://github.com/votre-repo/e-commerce-node.js.git
cd e-commerce-node.js-main

# Ou via SSH
git clone git@github.com:votre-repo/e-commerce-node.js.git
cd e-commerce-node.js-main
```

### **Étape 2: Installer les Dépendances**
```bash
npm install
```

**Packages installés:**
- express × Node.js framework
- sequelize × ORM pour MySQL
- bcryptjs × Chiffrement sécurisé des mots de passe
- passport × Authentification
- express-session × Gestion des sessions
- ejs × Moteur de templates
- dotenv × Variables d'environnement
- cors × Gestion des requêtes cross-origin
- Et plus...

### **Étape 3: Configurer la Base de Données**

#### **Créer la Base de Données MySQL**
```sql
-- Via MySQL
CREATE DATABASE ecommerce_jim;
USE ecommerce_jim;
```

#### **Ou via une GUI (phpMyAdmin)**
1. Ouvrez http://localhost:8080/phpmyadmin
2. Cliquez sur "Nouvelle base de données"
3. Entrez le nom: `ecommerce_jim`
4. Cliquez sur "Créer"

---

## ⚙️ Configuration

### **Fichier .env**
Créez un fichier `.env` à la racine du projet:

```bash
# Copie rapide du fichier exemple
cp .env.example .env
```

**Contenu du .env:**
```env
# ===== SERVER =====
NODE_ENV=development
PORT=3000

# ===== SESSION =====
SESSION_SECRET=change-me-in-production-123456789

# ===== DATABASE =====
DB_HOST=localhost
DB_USER=root              # Changez si votre user MySQL est différent
DB_PASSWORD=              # Vide par défaut (laissez vide si pas de password)
DB_NAME=ecommerce_jim
DB_DIALECT=mysql

# ===== EMAIL (Optional) =====
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=app-specific-password

# ===== CORS =====
CORS_ORIGIN=http://localhost:3000
```

### **Initialiser la Base de Données**
```bash
# Crée les tables
npm run init-db

# Ou manuelle via MySQL
mysql -u root ecommerce_jim < init-database.sql
```

### **Vérifier la Connexion à MySQL**
```bash
# Testez votre connection
mysql -u root -p

# Puis vérifiez les bases de données
SHOW DATABASES;

# Vérifiez les tables
USE ecommerce_jim;
SHOW TABLES;
```

---

## 🔐 Connexion Admin

### **Créer un Administrateur**

#### **Option A: Via Script Node (Recommandé)**
```bash
node scripts/create-admin.js
```

**Sortie attendue:**
```
✅ Connexion à la base de données établie

✅✅✅ ADMIN CRÉÉ AVEC SUCCÈS! ✅✅✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email:     admin@ecommercejim.com
🔐 Mot de passe: admin123456
👤 Nom:        Admin JIM
🔓 Rôle:       ADMIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 Accédez à: http://localhost:3000/auth/login
🎯 Après connexion → Dashboard: http://localhost:3000/admin/dashboard
```

#### **Option B: Via MySQL Directement**
```bash
# Se connecter à MySQL
mysql -u root ecommerce_jim

# Exécuter
INSERT INTO users (name, email, passwordHash, role, emailVerified, createdAt, updatedAt) 
VALUES (
  'Admin JIM',
  'admin@ecommercejim.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36gBUSEm',
  'admin',
  true,
  NOW(),
  NOW()
);
```

#### **Option C: Via Seed Script**
```bash
npm run seed-admin
```

### **Se Connecter en tant qu'Admin**

1. **Démarrer l'application:**
   ```bash
   npm start
   ```

2. **Aller à la page de connexion:**
   - Ouvrez http://localhost:3000/auth/login

3. **Entrer les identifiants:**
   - Email: `admin@ecommercejim.com`
   - Mot de passe: `admin123456`

4. **Cliquer sur "Se connecter"**

5. **Redirection automatique au dashboard:**
   - http://localhost:3000/admin/dashboard

---

## 👨‍💼 Utilisation Admin

### **Dashboard Principal**
Le dashboard admin affiche:
- 📊 Statistiques globales
- 📈 Graphiques de ventes
- 📦 Dernières commandes
- 👥 Derniers utilisateurs
- 🎯 Taux de conversion

### **Menu Admin**
```
├── Dashboard
├── Utilisateurs
│   ├── Liste des utilisateurs
│   ├── Ajouter un utilisateur
│   └── Modifier un utilisateur
├── Produits
│   ├── Liste des produits
│   ├── Ajouter un produit
│   └── Modifier un produit
├── Catégories
│   ├── CHAUSSURES
│   ├── VALISES
│   ├── DRAPS
│   └── ACCESSOIRES MOTO
├── Commandes
│   ├── Toutes les commandes
│   ├── En attente
│   ├── Confirmées
│   └── Livrées
├── Analyses
│   ├── Revenus
│   ├── Ventes par catégorie
│   ├── Clients actifs
│   └── Produits populaires
├── Coupons
│   ├── Créer un coupon
│   └── Gérer les coupons
├── Paramètres
│   ├── Profil
│   ├── Sécurité
│   └── Notifications
└── Déconnexion
```

---

## 📦 Gestion des Produits

### **Ajouter un Produit**

1. Allez dans Admin → Produits → Ajouter
2. Remplissez le formulaire:
   - **Nom du produit** (obligatoire)
   - **Description** (texte long)
   - **Catégorie** (choisissez une catégorie)
   - **Prix** (en FCFA)
   - **Stock** (quantité disponible)
   - **Image** (format: JPG, PNG)
   - **Métadonnées** (SEO)

3. Cliquez sur **Créer le produit**

**Exemple de données:**
```
Nom: Valise de voyage 20 pouces
Prix: 25000 FCFA
Catégorie: Valises
Stock: 50
Description: Valise rigide, légère, avec 4 roues...
```

### **Modifier un Produit**

1. Allez dans Admin → Produits
2. Cliquez sur le produit à modifier
3. Modifiez les champs
4. Cliquez sur **Sauvegarder**

### **Supprimer un Produit**

1. Allez dans Admin → Produits
2. Cochez la case du produit
3. Cliquez sur **Supprimer**
4. Confirmez la suppression

---

## 👥 Gestion des Utilisateurs

### **Ajouter un Utilisateur**

1. Admin → Utilisateurs → Ajouter un utilisateur
2. Remplissez:
   - Nom complet
   - Email
   - Mot de passe (généré automatiquement ou personnalisé)
   - Rôle (Admin ou Client)

3. Cliquez sur **Créer l'utilisateur**

### **Modifier un Utilisateur**

1. Admin → Utilisateurs → Cliquez sur l'utilisateur
2. Modifiez les champs
3. Cliquez sur **Mettre à jour**

### **Bloquer/Débloquer un Utilisateur**

1. Admin → Utilisateurs
2. Cochez l'utilisateur
3. Cliquez sur **Bloquer** ou **Débloquer**

---

## 📊 Gestion des Commandes

### **Voir une Commande**

1. Admin → Commandes
2. Cliquez sur une commande pour voir les détails:
   - Articles commandés
   - Adresse de livraison
   - Statut
   - Montant total
   - Date de commande

### **Changer le Statut d'une Commande**

1. Ouvrez la commande
2. Changez le statut:
   - En attente
   - Confirmée
   - Expédiée
   - Livrée

3. Cliquez sur **Mettre à jour**

### **Générer un Reçu**

1. Ouvrez la commande
2. Cliquez sur **Imprimer/PDF**
3. Le reçu s'affichera

---

## 🎟️ Gestion des Coupons

### **Créer un Coupon**

1. Admin → Coupons → Créer un coupon
2. Remplissez les détails:
   - **Code du coupon** (ex: PROMO2024)
   - **Réduction** (montant ou pourcentage)
   - **Date d'expiration**
   - **Nombre d'utilisations maximum**
   - **Montant minimum de panier**

3. Cliquez sur **Créer le coupon**

### **Exemple:**
```
Code: WELCOME50
Réduction: 50% de réduction
Minimum: 50000 FCFA
Valide jusqu'au: 31/12/2024
Utilisations max: 100
```

---

## 📈 Analyses et Statistiques

### **Tableau de Bord Analytique**

Consultez:
- **Revenus totaux** (derniers 30 jours)
- **Nombre de commandes**
- **Nombre de clients nouveaux**
- **Taux de conversion**
- **Produits populaires**
- **Catégories les plus vendues**
- **Clients VIP**
- **Produits faibles en stock**

---

## 🐛 Dépannage

### **Problème: Impossible de se connecter**

**Solution 1: Vérifier l'email**
```bash
# Via MySQL
mysql -u root ecommerce_jim
SELECT * FROM users WHERE role='admin';
```

**Solution 2: Réinitialiser le mot de passe**
```bash
# Exécutez le script de réinitialisation
node scripts/reset-admin-password.js
```

**Solution 3: Recréer l'admin**
```bash
# Supprimez l'admin existant
mysql -u root ecommerce_jim
DELETE FROM users WHERE email='admin@ecommercejim.com';

# Puis recréez-le
node scripts/create-admin.js
```

### **Problème: Erreur de base de données "ECONNREFUSED"**

**Solution:**
1. Vérifiez que MySQL est démarré
   ```bash
   # Windows
   mysql --version
   
   # Linux/Mac
   brew services list
   ```

2. Vérifiez vos identifiants MySQL dans `.env`
3. Testez votre connexion:
   ```bash
   mysql -u root -p ecommerce_jim
   ```

### **Problème: L'application ne démarre pas**

**Solution 1: Supprimer node_modules**
```bash
rm -rf node_modules
npm install
npm start
```

**Solution 2: Port 3000 déjà utilisé**
```bash
# Changez le port dans .env
PORT=3001

# Ou tuez le processus (Linux/Mac)
kill -9 $(lsof -t -i:3000)
```

### **Problème: Les images ne s'affichent pas**

**Solution:**
```bash
# Vérifiez le chemin des images
# Les images doivent être dans public/uploads/

# Créez les dossiers s'ils n'existent pas
mkdir -p public/uploads/{drap,jalabi,valise}

# Assurez-vous que les permissions sont correctes
chmod -R 755 public/uploads/
```

---

## ❓ FAQ

### **Q: Comment changer le mot de passe admin?**
**R:** 
1. Connectez-vous en tant qu'admin
2. Allez dans Paramètres → Profil
3. Cliquez sur "Changer le mot de passe"
4. Entrez l'ancien et le nouveau mot de passe

### **Q: Puis-je avoir plusieurs administrateurs?**
**R:** Oui! Lors de la création d'un utilisateur, sélectionnez le rôle "Admin".

### **Q: Comment supprimer un administrateur?**
**R:** 
```bash
# Via MySQL
DELETE FROM users WHERE email='admin@ecommercejim.com' AND role='admin';
```

### **Q: Comment sauvegarder ma base de données?**
**R:**
```bash
# Sauvegarde complète
mysqldump -u root ecommerce_jim > backup.sql

# Sauvegarde avec password
mysqldump -u root -p ecommerce_jim > backup.sql

# Restaurer une sauvegarde
mysql -u root ecommerce_jim < backup.sql
```

### **Q: Comment ajouter une nouvelle catégorie de produits?**
**R:** 
1. Admin → Catégories
2. Cliquez sur "Ajouter une catégorie"
3. Entrez le nom et la description
4. Cliquez sur "Créer"

### **Q: Les e-mails de confirmation fonctionnent?**
**R:** Oui, configurez vos identifiants Gmail dans `.env`:
```env
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password
```

### **Q: Comment activer le mode production?**
**R:**
```env
NODE_ENV=production
SESSION_SECRET=change-this-to-a-long-random-string
DB_HOST=your-production-db-host
```

### **Q: Puis-je utiliser une autre base de données que MySQL?**
**R:** Oui! Modifiez `config/database.js` pour PostgreSQL, SQLite, etc.

---

## 🚀 Commandes Utiles

```bash
# Démarrer l'application
npm start

# Mode développement avec auto-reload
npm run dev

# Initialiser la base de données
npm run init-db

# Créer un administrateur
node scripts/create-admin.js

# Vider la base de données (⚠️ ATTENTION)
node scripts/reset-db.js

# Tests (si disponibles)
npm test

# Build pour production
npm run build
```

---

## 📞 Support

Contactez-nous:
- 📧 Email: support@ecommercejim.com
- 💬 Chat: http://localhost:3000/chatbot
- 📞 Téléphone: +221 77 XXX XXXX
- 🐛 Issues: GitHub Issues

---

**Dernière mise à jour:** April 12, 2026
**Version:** 2.0
**Auteur**: E-Commerce JIM Team

Bon shopping! 🛍️
