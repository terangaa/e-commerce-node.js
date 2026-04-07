# Guide de Configuration SMTP Gmail

## Problème Identifié

L'erreur `535-5.7.8 Username and Password not accepted` signifie que Gmail rejette vos identifiants SMTP.

## Solution : Utiliser un Mot de Passe d'Application Gmail

### Étape 1 : Activer l'Authentification à Deux Facteurs

1. Allez sur [myaccount.google.com](https://myaccount.google.com)
2. Cliquez sur **Sécurité** dans le menu latéral
3. Dans la section "Connexion à Google", cliquez sur **Authentification à deux facteurs**
4. Suivez les instructions pour l'activer (par SMS ou application d'authentification)

### Étape 2 : Générer un Mot de Passe d'Application

1. Retournez sur [myaccount.google.com](https://myaccount.google.com)
2. Cliquez sur **Sécurité**
3. Dans la section "Connexion à Google", cliquez sur **Mots de passe des applications**
4. Sélectionnez **Autre (nom personnalisé)** dans le menu déroulant
5. Entrez un nom comme `Ecommerce JIM SMTP`
6. Cliquez sur **Générer**
7. **Copiez le mot de passe généré** (16 caractères sans espaces)

### Étape 3 : Mettre à jour le fichier .env

Remplacez le contenu de votre fichier `.env` par :

```env
# Base de données
DB_HOST=127.0.0.1
DB_NAME=ecommerce_jim
DB_USER=root
DB_PASSWORD=mbaye2005

# Configuration Email
OWNER_EMAIL=ceesaysamba24@gmail.com
SMTP_USER=ceesaysamba24@gmail.com
SMTP_PASS=votre_mot_de_passe_application_ici
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
FROM_EMAIL=ceesaysamba24@gmail.com
```

**Important :**
- `SMTP_USER` doit être votre adresse Gmail complète
- `SMTP_PASS` doit être le mot de passe d'application généré à l'étape 2 (pas votre mot de passe Gmail normal)
- `FROM_EMAIL` doit être identique à `SMTP_USER`

### Étape 4 : Redémarrer le Serveur

Après avoir modifié le fichier `.env`, redémarrez votre serveur Node.js :

```bash
# Arrêtez le serveur avec Ctrl+C, puis relancez-le
node app.js
```

## Vérification

Après la configuration, vous devriez voir dans la console :
```
SMTP configuration OK, prêt à envoyer des emails.
```

## Dépannage

### Erreur "Username and Password not accepted"
- Vérifiez que vous utilisez un **mot de passe d'application** et non votre mot de passe Gmail
- Vérifiez que l'authentification à deux facteurs est activée
- Vérifiez que `SMTP_USER` est correct (votre adresse Gmail complète)

### Erreur "Connection timeout"
- Vérifiez que `SMTP_PORT=587` (port TLS)
- Vérifiez que votre pare-feu autorise les connexions sortantes sur le port 587

### Erreur "Invalid credentials"
- Régénérez un nouveau mot de passe d'application
- Assurez-vous de copier le mot de passe sans espaces

## Alternative : Utiliser un Autre Service SMTP

Si vous ne voulez pas utiliser Gmail, vous pouvez utiliser d'autres services SMTP gratuits :

### Mailtrap (pour les tests)
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=votre_username_mailtrap
SMTP_PASS=votre_password_mailtrap
```

### SendGrid (gratuit jusqu'à 100 emails/jour)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=votre_cle_api_sendgrid
```

## Sécurité

⚠️ **Ne jamais committer le fichier .env dans Git !**

Assurez-vous que `.env` est dans votre `.gitignore` :
```
.env
```
