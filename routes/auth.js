const express = require('express');
const { showRegister, register, showLogin, login, logout, showProfile, updateProfile, showOrderHistory, showForgotPassword, forgotPassword, showResetPassword, resetPassword, verifyEmail, resendVerificationEmail, showVerifyEmail, showTwoFactorSetup, setupTwoFactor, verifyTwoFactor, disableTwoFactor, showTwoFactorVerify, verifyTwoFactorLogin } = require('../controllers/authController');
const router = express.Router();

router.get('/register', showRegister);
router.post('/register', register);
router.get('/login', showLogin);
router.post('/login', login);
router.get('/logout', logout);
router.get('/profile', showProfile);
router.post('/profile', updateProfile);
router.get('/orders', showOrderHistory);
router.get('/forgot-password', showForgotPassword);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password', showResetPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.get('/verify-email-page', showVerifyEmail);

// Routes pour l'authentification à deux facteurs
router.get('/2fa/setup', showTwoFactorSetup);
router.post('/2fa/setup', setupTwoFactor);
router.post('/2fa/verify', verifyTwoFactor);
router.post('/2fa/disable', disableTwoFactor);
router.get('/2fa/verify-login', showTwoFactorVerify);
router.post('/2fa/verify-login', verifyTwoFactorLogin);

module.exports = router;
