const express = require('express');
const router = express.Router();
const socialAuthController = require('../controllers/socialAuthController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Routes pour l'authentification sociale
router.get('/social', socialAuthController.showSocialLogin);

// Routes Google OAuth
router.get('/google', socialAuthController.googleAuth);
router.get('/google/callback', socialAuthController.googleCallback);

// Routes Facebook OAuth
router.get('/facebook', socialAuthController.facebookAuth);
router.get('/facebook/callback', socialAuthController.facebookCallback);

// Routes pour gérer les comptes liés
router.post('/link', authenticateToken, socialAuthController.linkAccount);
router.post('/unlink', authenticateToken, socialAuthController.unlinkAccount);

// Route de déconnexion
router.get('/logout', socialAuthController.logout);

module.exports = router;
