const chatbotService = require('../services/chatbotService');

/**
 * Contrôleur pour le chatbot bilingue
 */

/**
 * Traite un message du chatbot
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function handleChatMessage(req, res) {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required / Le message est requis'
      });
    }
    
    const result = chatbotService.processMessage(message);
    
    res.json({
      success: true,
      data: {
        response: result.response,
        language: result.language,
        intention: result.intention
      }
    });
  } catch (error) {
    console.error('Erreur chatbot:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement du message / Error processing message'
    });
  }
}

/**
 * Obtient les intentions disponibles
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function getIntents(req, res) {
  try {
    const intents = chatbotService.getAvailableIntents();
    
    res.json({
      success: true,
      data: intents
    });
  } catch (error) {
    console.error('Erreur récupération intentions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des intentions / Error fetching intents'
    });
  }
}

/**
 * Affiche la page du chatbot
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
function renderChatbotPage(req, res) {
  const lang = req.query.lang || req.session?.lang || 'fr';
  res.render('chatbot', { lang, currentPage: 'chatbot', user: req.session?.user || null, locale: req.getLocale() });
}

module.exports = {
  handleChatMessage,
  getIntents,
  renderChatbotPage
};
