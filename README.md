# Application e-commerce Node.js (ecommerce_jim)

Back-end Express + MySQL, support FR/EN, envoi d'email de commande et paiements Wave / Orange Money (simulés). Le projet implémente les fonctionnalités demandées : consultation produits, panier/commande, gestion admin, catégorisation.

## Prérequis

- Node.js 18+
- MySQL

## Configuration

1. Créer la base MySQL :
   - `CREATE DATABASE ecommerce_jim CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`
2. Mettre à jour `.env` si besoin.

## Installation

```
cd c:\samba_cisse\projet_ecommerce
npm install
```

## Initialisation de la base

```
npm run migrate
```

## Lancer

```
npm start
```

## Pages et routes publiques

- GET `/` : page d'accueil (présentation, Top produits, catégories)
- GET `/products` : liste des produits
- GET `/products/:id` : détails produit + formulaire commande
- GET `/contact` : page de contact
- POST `/contact` : envoi du formulaire de contact
- POST `/orders` : création commande
- POST `/orders/pay/wave` : simulation paiement Wave
- POST `/orders/pay/orangemoney` : simulation paiement Orange Money

## Authentification

- GET `/auth/register` : page inscription admin
- POST `/auth/register` : création du compte (admin)
- GET `/auth/login` : page connexion
- POST `/auth/login` : connexion
- GET `/auth/logout` : déconnexion

## Endpoints admin

- POST `/admin/categories` : create category
- GET `/admin/categories` : list categories
- PUT `/admin/categories/:id` : update category
- DELETE `/admin/categories/:id` : delete category
- POST `/admin/products` : create product
- GET `/admin/products` : list products
- PUT `/admin/products/:id` : update product
- DELETE `/admin/products/:id` : delete product
- GET `/admin/orders` : list orders

## Email de notification

Envoyé à `ceesaysamba24@gmail.com` via la config SMTP du `.env`.

Variables obligatoires : `SMTP_USER`, `SMTP_PASS` (et facultatives `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `FROM_EMAIL`, `OWNER_EMAIL`).

## Paiement

- Wave et Orange Money sont simulés dans `/orders/pay/wave` et `/orders/pay/orangemoney`.

## Notes

- Pour un vrai déploiement, sécuriser l'authentification admin, valider les entrées, intégrer les APIs Wave/Orange Money officielles.
# jim
