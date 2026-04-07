# Guide : Configurer Gmail App Password pour l'envoi d'emails

## Problème
Le mot de passe Gmail régulier ne fonctionne pas avec SMTP. Gmail bloque l'accès SMTP avec un mot de passe régulier pour des raisons de sécurité.

## Solution : Utiliser un App Password Gmail

### Étape 1 : Activer l'authentification à deux facteurs (2FA)
1. Allez sur [myaccount.google.com](https://myaccount.google.com)
2. Cliquez sur **Sécurité** dans le menu de gauche
3. Dans la section "Connexion à Google", cliquez sur **Authentification à deux facteurs**
4. Suivez les instructions pour activer le 2FA (par SMS ou application d'authentification)

### Étape 2 : Générer un App Password
1. Retournez sur [myaccount.google.com](https://myaccount.google.com)
2. Cliquez sur **Sécurité**
3. Dans la section "Connexion à Google", cliquez sur **Mots de passe des applications**
4. Vous devrez peut-être vous reconnecter
5. En bas de la page, cliquez sur **Sélectionner l'application** et choisissez **Autre (nom personnalisé)**
6. Entrez un nom comme "Ecommerce JIM" et cliquez sur **Générer**
7. Google va générer un mot de passe à 16 caractères (ex: `abcd efgh ijkl mnop`)
8. **Copiez ce mot de passe** (sans les espaces)

### Étape 3 : Mettre à jour le fichier .env
1. Ouvrez le fichier `.env` dans votre projet
2. Remplacez la valeur de `SMTP_PASS` par le mot de passe d'application généré :

```env
# Configuration Email
OWNER_EMAIL=ceesaysamba24@gmail.com
SMTP_USER=ceesaysamba24@gmail.com
SMTP_PASS=abcdefghijklmnop  # Remplacez par votre App Password (sans espaces)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
FROM_EMAIL=ceesaysamba24@gmail.com
```

3. Sauvegardez le fichier `.env`

### Étape 4 : Redémarrer le serveur
1. Arrêtez le serveur (Ctrl+C dans le terminal)
2. Redémarrez-le avec `npm start` ou `node app.js`

### Étape 5 : Tester l'envoi d'email
1. Allez sur la page de réinitialisation de mot de passe : `http://localhost:3000/auth/forgot-password`
2. Entrez votre email et soumettez le formulaire
3. Vérifiez votre boîte de réception (et le dossier spam)
4. Vous devriez recevoir un email avec un lien de réinitialisation

## Dépannage

### Vérifier les logs du serveur
Si l'email n'est toujours pas envoyé, vérifiez les logs du serveur dans le terminal. Vous devriez voir :
- `[EMAIL] Tentative d'envoi d'email de réinitialisation à [email]` si l'envoi est tenté
- `[EMAIL] Email de réinitialisation envoyé avec succès à [email]` si l'envoi réussit
- `[EMAIL] Échec envoi email réinitialisation à [email]: [erreur]` si l'envoi échoue

### Erreurs courantes

#### "Username and Password not accepted"
- Vérifiez que vous utilisez bien l'App Password (16 caractères) et non le mot de passe régulier
- Vérifiez que l'App Password n'a pas été révoqué dans les paramètres Google

#### "Less secure app access"
- Gmail ne permet plus l'accès aux applications moins sécurisées
- Vous devez utiliser un App Password (voir étapes ci-dessus)

#### "Connection timeout"
- Vérifiez que le port SMTP est correct (587 pour TLS, 465 pour SSL)
- Vérifiez que votre pare-feu ne bloque pas les connexions SMTP

## Référence
- [Guide officiel Google : App Passwords](https://support.google.com/accounts/answer/185833)
- [Guide officiel Google : Less secure apps](https://support.google.com/accounts/answer/6010255)
