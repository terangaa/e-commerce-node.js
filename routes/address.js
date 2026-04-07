const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { authenticateToken } = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Obtenir toutes les adresses de l'utilisateur
router.get('/', addressController.getUserAddresses);

// Obtenir une adresse par son ID
router.get('/:id', addressController.getAddressById);

// Créer une nouvelle adresse
router.post('/', addressController.createAddress);

// Mettre à jour une adresse
router.put('/:id', addressController.updateAddress);

// Supprimer une adresse
router.delete('/:id', addressController.deleteAddress);

// Définir une adresse comme adresse par défaut
router.patch('/:id/default', addressController.setDefaultAddress);

module.exports = router;
