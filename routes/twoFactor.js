const express = require('express');
const router = express.Router();
const twoFactorController = require('../controllers/twoFactorController');
const { authenticateToken } = require('../middleware/auth');

// Routes pour l'authentification à deux facteurs
router.post('/generate', authenticateToken, twoFactorController.generateSecret);
router.post('/verify', authenticateToken, twoFactorController.verifyAndEnable);
router.post('/disable', authenticateToken, twoFactorController.disable);
router.post('/verify-token', twoFactorController.verifyToken);
router.get('/status', authenticateToken, twoFactorController.getStatus);

module.exports = router;
