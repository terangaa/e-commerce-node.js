# Guide de Configuration SMS/WhatsApp avec Twilio

## Vue d'ensemble

Ce guide explique comment configurer les notifications SMS et WhatsApp pour votre application e-commerce en utilisant l'API Twilio.

## Pourquoi Twilio ?

Twilio est une plateforme de communication cloud qui permet d'envoyer :
- **SMS** : Messages texte vers plus de 180 pays
- **WhatsApp** : Messages WhatsApp via l'API WhatsApp Business

## Étape 1 : Créer un compte Twilio

1. Allez sur [twilio.com](https://www.twilio.com)
2. Cliquez sur **Sign up** pour créer un compte gratuit
3. Vérifiez votre numéro de téléphone
4. Notez vos identifiants dans le dashboard :
   - **Account SID** (commence par `AC`)
   - **Auth Token**

## Étape 2 : Obtenir un numéro de téléphone Twilio

1. Dans le dashboard Twilio, allez sur **Phone Numbers** → **Manage** → **Buy a number**
2. Choisissez un numéro qui supporte **SMS** et **Voice**
3. Notez ce numéro (format: `+1XXXXXXXXXX`)

## Étape 3 : Configurer WhatsApp (Optionnel)

### Option A : WhatsApp Sandbox (pour les tests)
1. Dans le dashboard, allez sur **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Suivez les instructions pour rejoindre le sandbox
3. Notez le numéro WhatsApp sandbox (format: `+14155238886`)

### Option B : WhatsApp Business API (pour la production)
1. Vous devez avoir un compte WhatsApp Business vérifié
2. Contactez Twilio pour activer l'API WhatsApp Business
3. Obtenez un numéro WhatsApp Business approuvé

## Étape 4 : Mettre à jour le fichier .env

Modifiez votre fichier `.env` avec les valeurs Twilio :

```env
# Configuration Twilio (SMS/WhatsApp)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=votre_auth_token_ici
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
TWILIO_WHATSAPP_NUMBER=+14155238886
```

**Remplacez :**
- `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` par votre Account SID
- `votre_auth_token_ici` par votre Auth Token
- `+1XXXXXXXXXX` par votre numéro Twilio
- `+14155238886` par votre numéro WhatsApp sandbox (ou Business)

## Étape 5 : Installer la dépendance Twilio

Exécutez dans le terminal :

```bash
npm install twilio
```

## Étape 6 : Redémarrer le serveur

```bash
node app.js
```

Vous devriez voir :
```
Client Twilio initialisé avec succès.
```

## Fonctionnalités Implémentées

### 1. Envoi de SMS
```javascript
const { sendSMS } = require('./services/smsService');
await sendSMS('+221XXXXXXXXX', 'Votre message ici');
```

### 2. Envoi de WhatsApp
```javascript
const { sendWhatsApp } = require('./services/smsService');
await sendWhatsApp('+221XXXXXXXXX', 'Votre message WhatsApp');
```

### 3. Notifications automatiques de commande
- **SMS** : Envoyé automatiquement au client lors de la création d'une commande
- **WhatsApp** : Envoyé automatiquement au client lors de la création d'une commande

### 4. Messages de test
```javascript
const { sendTestSMS, sendTestWhatsApp } = require('./services/smsService');
await sendTestSMS('+221XXXXXXXXX');
await sendTestWhatsApp('+221XXXXXXXXX');
```

## Format des numéros de téléphone

Les numéros doivent être au format international :
- **Sénégal** : `+221XXXXXXXXX`
- **France** : `+33XXXXXXXXX`
- **Côte d'Ivoire** : `+225XXXXXXXXX`

## Tarification Twilio (2024)

### SMS
- **USA/Canada** : $0.0079 par SMS
- **Europe** : $0.04-0.08 par SMS
- **Afrique** : $0.03-0.10 par SMS

### WhatsApp
- **Messages entrants** : Gratuit
- **Messages sortants** : $0.005-0.08 par message (selon le pays)

### Numéro de téléphone
- **Location-based** : $1.15/mois
- **Toll-free** : $2.15/mois

## Dépannage

### Erreur "Twilio non configuré"
- Vérifiez que `TWILIO_ACCOUNT_SID` et `TWILIO_AUTH_TOKEN` sont définis dans `.env`
- Redémarrez le serveur après modification

### Erreur "Invalid phone number"
- Vérifiez que le numéro est au format international (+pays numéro)
- Vérifiez que le numéro est actif dans votre compte Twilio

### Erreur "WhatsApp number not configured"
- Vérifiez que `TWILIO_WHATSAPP_NUMBER` est défini dans `.env`
- Pour le sandbox, assurez-vous d'avoir rejoint le sandbox WhatsApp

### Erreur "Insufficient funds"
- Rechargez votre compte Twilio
- Vérifiez votre solde dans le dashboard

## Sécurité

⚠️ **Ne jamais committer le fichier .env dans Git !**

Assurez-vous que `.env` est dans votre `.gitignore`.

## Limitations du Sandbox WhatsApp

- Le sandbox est partagé entre tous les utilisateurs
- Les messages expirent après 24h si non lus
- Vous ne pouvez envoyer qu'aux numéros qui ont rejoint le sandbox
- Pour la production, vous devez obtenir un compte WhatsApp Business

## Support

- Documentation Twilio : [twilio.com/docs](https://www.twilio.com/docs)
- Support WhatsApp : [twilio.com/whatsapp](https://www.twilio.com/whatsapp)
- Dashboard Twilio : [console.twilio.com](https://console.twilio.com)
