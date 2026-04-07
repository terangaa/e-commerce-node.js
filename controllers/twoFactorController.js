const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

class TwoFactorController {
  // Générer un secret 2FA pour l'utilisateur
  static async generateSecret(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      }

      // Générer un secret unique
      const secret = speakeasy.generateSecret({
        name: `Ecommerce JIM (${user.email})`,
        issuer: 'Ecommerce JIM'
      });

      // Sauvegarder le secret temporairement (non activé)
      await user.update({
        twoFactorSecret: secret.base32,
        twoFactorEnabled: false
      });

      // Générer le QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      res.json({
        success: true,
        data: {
          secret: secret.base32,
          qrCode: qrCodeUrl,
          otpauthUrl: secret.otpauth_url
        }
      });
    } catch (error) {
      console.error('Erreur lors de la génération du secret 2FA:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Vérifier et activer le 2FA
  static async verifyAndEnable(req, res) {
    try {
      const userId = req.user.id;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ success: false, message: 'Code de vérification requis' });
      }

      const user = await User.findByPk(userId);

      if (!user || !user.twoFactorSecret) {
        return res.status(400).json({ success: false, message: 'Secret 2FA non trouvé' });
      }

      // Vérifier le token
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 1 // Permettre une marge de 30 secondes
      });

      if (!verified) {
        return res.status(400).json({ success: false, message: 'Code de vérification invalide' });
      }

      // Activer le 2FA
      await user.update({
        twoFactorEnabled: true
      });

      res.json({
        success: true,
        message: 'Authentification à deux facteurs activée avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la vérification 2FA:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Désactiver le 2FA
  static async disable(req, res) {
    try {
      const userId = req.user.id;
      const { password, token } = req.body;

      if (!password || !token) {
        return res.status(400).json({ success: false, message: 'Mot de passe et code de vérification requis' });
      }

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      }

      // Vérifier le mot de passe
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ success: false, message: 'Mot de passe incorrect' });
      }

      // Vérifier le token 2FA
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 1
      });

      if (!verified) {
        return res.status(400).json({ success: false, message: 'Code de vérification invalide' });
      }

      // Désactiver le 2FA
      await user.update({
        twoFactorEnabled: false,
        twoFactorSecret: null
      });

      res.json({
        success: true,
        message: 'Authentification à deux facteurs désactivée'
      });
    } catch (error) {
      console.error('Erreur lors de la désactivation 2FA:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Vérifier le token 2FA lors de la connexion
  static async verifyToken(req, res) {
    try {
      const { email, token } = req.body;

      if (!email || !token) {
        return res.status(400).json({ success: false, message: 'Email et code de vérification requis' });
      }

      const user = await User.findOne({ where: { email } });

      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        return res.status(400).json({ success: false, message: '2FA non activé pour cet utilisateur' });
      }

      // Vérifier le token
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 1
      });

      if (!verified) {
        return res.status(400).json({ success: false, message: 'Code de vérification invalide' });
      }

      res.json({
        success: true,
        message: 'Code de vérification valide'
      });
    } catch (error) {
      console.error('Erreur lors de la vérification du token 2FA:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Obtenir le statut 2FA de l'utilisateur
  static async getStatus(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId, {
        attributes: ['id', 'twoFactorEnabled']
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      }

      res.json({
        success: true,
        data: {
          twoFactorEnabled: user.twoFactorEnabled
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du statut 2FA:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
}

module.exports = TwoFactorController;
