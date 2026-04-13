#!/usr/bin/env node

/**
 * 🏥 HEALTH CHECK - E-Commerce JIM
 * Vérifie que tous les systèmes essentiels sont opérationnels
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️ ${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ️ ${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}\n`)
};

let checks = 0;
let passed = 0;
let failed = 0;

/**
 * Check 1: Vérifier les fichiers essentiels
 */
function checkFiles() {
  log.title('📁 Vérification des Fichiers');
  
  const essential = [
    'app.js',
    'package.json',
    'views/auth/login.ejs',
    'controllers/authController.js',
    'controllers/adminController.js',
    'models/user.js',
    'public/css/site.css',
    'public/css/modern.css'
  ];
  
  essential.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      log.success(`${file}`);
      passed++;
    } else {
      log.error(`${file} - MANQUANT`);
      failed++;
    }
    checks++;
  });
}

/**
 * Check 2: Vérifier les dépendances
 */
function checkDependencies() {
  log.title('📦 Vérification des Dépendances');
  
  const required = [
    'express',
    'sequelize',
    'mysql2',
    'bcryptjs',
    'ejs',
    'express-session',
    'passport',
    'dotenv'
  ];
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    required.forEach(pkg => {
      if (deps[pkg]) {
        log.success(`${pkg} v${deps[pkg]}`);
        passed++;
      } else {
        log.error(`${pkg} - NON INSTALLÉ`);
        failed++;
      }
      checks++;
    });
  } catch (err) {
    log.error(`Erreur lecture package.json: ${err.message}`);
    checks++;
    failed++;
  }
}

/**
 * Check 3: Vérifier .env
 */
function checkEnv() {
  log.title('⚙️ Vérification de la Configuration');
  
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');
  
  if (fs.existsSync(envPath)) {
    log.success('.env existe');
    passed++;
    
    // Lire et vérifier les variables
    const env = fs.readFileSync(envPath, 'utf8');
    const required = ['DB_HOST', 'DB_USER', 'DB_NAME', 'SESSION_SECRET'];
    
    required.forEach(key => {
      if (env.includes(key)) {
        log.success(`  ${key} configuré`);
        passed++;
      } else {
        log.warning(`  ${key} manquant`);
        failed++;
      }
      checks++;
    });
  } else if (fs.existsSync(envExamplePath)) {
    log.warning('.env inexistant (utilisez .env.example)');
    failed++;
  } else {
    log.error('.env et .env.example manquants');
    failed++;
  }
  checks++;
}

/**
 * Check 4: Vérifier la structure des répertoires
 */
function checkDirectories() {
  log.title('📂 Vérification des Répertoires');
  
  const dirs = [
    'controllers/',
    'models/',
    'routes/',
    'views/',
    'public/',
    'public/css/',
    'public/uploads/',
    'scripts/',
    'middlewares/'
  ];
  
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
      log.success(`${dir}`);
      passed++;
    } else {
      log.warning(`${dir} - ABSENT`);
      // Ne pas compter comme failed, c'est créé dynamiquement
    }
    checks++;
  });
}

/**
 * Check 5: Vérifier les fichiers de correction
 */
function checkFixFiles() {
  log.title('📋 Vérification des Documentations');
  
  const docs = [
    'DEMARRAGE_RAPIDE.md',
    'GUIDE_COMPLET.md',
    'CORRECTIONS_AND_IMPROVEMENTS.md',
    'RESUME_MODIFICATIONS.md'
  ];
  
  docs.forEach(doc => {
    const docPath = path.join(__dirname, doc);
    if (fs.existsSync(docPath)) {
      log.success(`${doc}`);
      passed++;
    } else {
      log.warning(`${doc} - NON TROUVÉ`);
    }
    checks++;
  });
}

/**
 * Check 6: Vérifier les scripts utilitaires
 */
function checkScripts() {
  log.title('🔧 Vérification des Scripts');
  
  const scripts = [
    'scripts/create-admin.js'
  ];
  
  scripts.forEach(script => {
    const scriptPath = path.join(__dirname, script);
    if (fs.existsSync(scriptPath)) {
      log.success(`${script}`);
      passed++;
    } else {
      log.warning(`${script} - NON TROUVÉ`);
    }
    checks++;
  });
}

/**
 * Check 7: Vérifier les modifications de sécurité
 */
function checkSecurityFixes() {
  log.title('🔐 Vérification des Corrections de Sécurité');
  
  try {
    const appPath = path.join(__dirname, 'app.js');
    const appContent = fs.readFileSync(appPath, 'utf8');
    
    // Vérifier que httpOnly et sameSite sont présents
    if (appContent.includes('httpOnly: true')) {
      log.success('httpOnly flag configuré');
      passed++;
    } else {
      log.warning('httpOnly flag manquant');
      failed++;
    }
    checks++;
    
    if (appContent.includes('sameSite')) {
      log.success('sameSite flag configuré');
      passed++;
    } else {
      log.warning('sameSite flag manquant');
      failed++;
    }
    checks++;
    
  } catch (err) {
    log.error(`Erreur vérification app.js: ${err.message}`);
    failed++;
    checks += 2;
  }
}

/**
 * Afficher le résumé
 */
function printSummary() {
  log.title('📊 Résumé de la Vérification');
  
  const ratio = Math.round((passed / checks) * 100);
  const status = ratio >= 80 ? '✅ SAIN' : ratio >= 60 ? '⚠️  PARTIEL' : '❌ PROBLÈMES';
  
  console.log(`Total des vérifications: ${checks}`);
  console.log(`${colors.green}Réussies: ${passed}${colors.reset}`);
  console.log(`${colors.red}Échouées: ${failed}${colors.reset}`);
  console.log(`Score: ${ratio}% ${status}`);
  
  if (failed === 0) {
    log.success('\n🎉 Tous les checks sont passés! L\'application est prête à démarrer.');
    console.log(`\n  ${colors.bold}Commande:${colors.reset} npm start\n`);
  } else {
    log.warning(`\n⚠️  ${failed} problème(s) détecté(s). Consultez les logs ci-dessus.`);
  }
}

// Exécuter tous les checks
(async () => {
  console.log(`\n${colors.bold}${colors.blue}🏥 HEALTH CHECK - E-Commerce JIM${colors.reset}\n`);
  console.log('Vérification de l\'intégrité de l\'application...\n');
  
  checkFiles();
  checkDependencies();
  checkEnv();
  checkDirectories();
  checkFixFiles();
  checkScripts();
  checkSecurityFixes();
  
  printSummary();
  
  process.exit(failed > 0 ? 1 : 0);
})();
