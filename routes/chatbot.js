const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// Page du chatbot
router.get('/', chatbotController.renderChatbotPage);

// API pour envoyer un message au chatbot
router.post('/message', chatbotController.handleChatMessage);

// API pour obtenir les intentions disponibles
router.get('/intents', chatbotController.getIntents);

module.exports = router;
