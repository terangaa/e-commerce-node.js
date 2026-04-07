/**
 * Service de chatbot bilingue (anglais/français)
 * Fournit des réponses automatiques pour les questions fréquentes
 */

// Base de connaissances du chatbot
const knowledgeBase = {
  fr: {
    greetings: ['bonjour', 'salut', 'hello', 'hey', 'coucou', 'bonsoir'],
    farewell: ['au revoir', 'bye', 'à bientôt', 'salut', 'bonne journée'],
    thanks: ['merci', 'thanks', 'thank you', 'remerciements'],
    order: ['commande', 'order', 'suivi', 'tracking', 'livraison', 'delivery'],
    payment: ['paiement', 'payment', 'payer', 'wave', 'orange money', 'carte'],
    products: ['produit', 'product', 'article', 'item', 'catalogue', 'catalog'],
    account: ['compte', 'account', 'profil', 'profile', 'inscription', 'register'],
    contact: ['contact', 'email', 'téléphone', 'phone', 'aide', 'help', 'support'],
    shipping: ['livraison', 'shipping', 'expédition', 'délai', 'delivery time'],
    return: ['retour', 'return', 'remboursement', 'refund', 'échange', 'exchange'],
    price: ['prix', 'price', 'coût', 'cost', 'tarif', 'rate'],
    availability: ['disponible', 'available', 'stock', 'rupture', 'out of stock'],
  },
  en: {
    greetings: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
    farewell: ['goodbye', 'bye', 'see you', 'take care', 'have a good day'],
    thanks: ['thank you', 'thanks', 'appreciate', 'grateful'],
    order: ['order', 'tracking', 'delivery', 'shipment', 'status'],
    payment: ['payment', 'pay', 'wave', 'orange money', 'card', 'credit card'],
    products: ['product', 'item', 'catalog', 'catalogue', 'browse'],
    account: ['account', 'profile', 'register', 'sign up', 'login'],
    contact: ['contact', 'email', 'phone', 'help', 'support', 'assistance'],
    shipping: ['shipping', 'delivery', 'dispatch', 'delivery time', 'when'],
    return: ['return', 'refund', 'exchange', 'send back'],
    price: ['price', 'cost', 'rate', 'how much', 'pricing'],
    availability: ['available', 'stock', 'in stock', 'out of stock', 'availability'],
  }
};

// Réponses du chatbot
const responses = {
  fr: {
    greetings: [
      'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
      'Salut ! Que puis-je faire pour vous ?',
      'Bonjour ! Bienvenue sur notre boutique. Comment puis-je vous assister ?'
    ],
    farewell: [
      'Au revoir ! N\'hésitez pas à revenir si vous avez d\'autres questions.',
      'À bientôt ! Merci de votre visite.',
      'Bonne journée ! À bientôt sur notre boutique.'
    ],
    thanks: [
      'De rien ! C\'est un plaisir de vous aider.',
      'Je vous en prie ! N\'hésitez pas si vous avez d\'autres questions.',
      'Avec plaisir ! Je suis là pour vous.'
    ],
    order: [
      'Pour suivre votre commande, connectez-vous à votre compte et consultez votre historique de commandes. Vous pouvez également nous contacter avec votre numéro de commande.',
      'Vous pouvez suivre votre commande dans la section "Mes commandes" de votre compte. Besoin d\'aide supplémentaire ?'
    ],
    payment: [
      'Nous acceptons les paiements via Wave et Orange Money. Vous pouvez également payer par carte bancaire lors du checkout.',
      'Nos options de paiement incluent Wave, Orange Money et les cartes bancaires. Toutes les transactions sont sécurisées.'
    ],
    products: [
      'Parcourez notre catalogue dans la section "Produits". Vous pouvez filtrer par catégorie et rechercher des articles spécifiques.',
      'Tous nos produits sont disponibles dans la section "Produits". Utilisez les filtres pour trouver ce que vous cherchez.'
    ],
    account: [
      'Pour créer un compte, cliquez sur "S\'inscrire" en haut à droite. Vous pourrez ensuite suivre vos commandes et gérer vos informations.',
      'Votre compte vous permet de suivre vos commandes, sauvegarder vos adresses et accéder à votre historique d\'achats.'
    ],
    contact: [
      'Vous pouvez nous contacter par email à l\'adresse indiquée dans la page Contact, ou via le formulaire de contact sur notre site.',
      'Notre équipe support est disponible par email. Consultez la page Contact pour plus d\'informations.'
    ],
    shipping: [
      'Les délais de livraison varient selon votre localisation. Généralement, comptez 2-5 jours ouvrables pour les livraisons locales.',
      'Nous livrons dans tout le pays. Les frais et délais de livraison sont calculés lors du checkout.'
    ],
    return: [
      'Pour retourner un produit, contactez-nous dans les 7 jours suivant la réception. Nous vous guiderons pour le processus de retour.',
      'Les retours sont acceptés sous 7 jours. Le produit doit être dans son emballage d\'origine.'
    ],
    price: [
      'Tous nos prix sont affichés en FCFA. Les frais de livraison sont calculés séparément lors du checkout.',
      'Les prix sont indiqués en FCFA sur chaque produit. Des promotions régulières sont disponibles.'
    ],
    availability: [
      'La disponibilité des produits est mise à jour en temps réel. Si un produit est en rupture, vous pouvez être notifié quand il revient en stock.',
      'Vérifiez la disponibilité directement sur la page du produit. Nous mettons à jour nos stocks régulièrement.'
    ],
    default: [
      'Je ne suis pas sûr de comprendre votre question. Pouvez-vous reformuler ou choisir parmi ces sujets : commandes, paiements, produits, livraison, retours ?',
      'Désolé, je n\'ai pas bien compris. Essayez de poser une question sur les commandes, paiements, produits ou la livraison.',
      'Je peux vous aider avec les commandes, paiements, produits, livraison et retours. Que souhaitez-vous savoir ?'
    ]
  },
  en: {
    greetings: [
      'Hello! How can I help you today?',
      'Hi there! What can I do for you?',
      'Hello! Welcome to our store. How can I assist you?'
    ],
    farewell: [
      'Goodbye! Feel free to come back if you have more questions.',
      'See you! Thanks for visiting.',
      'Have a great day! See you soon at our store.'
    ],
    thanks: [
      'You\'re welcome! Happy to help.',
      'My pleasure! Don\'t hesitate if you have more questions.',
      'Glad to help! I\'m here for you.'
    ],
    order: [
      'To track your order, log into your account and check your order history. You can also contact us with your order number.',
      'You can track your order in the "My Orders" section of your account. Need additional help?'
    ],
    payment: [
      'We accept payments via Wave and Orange Money. You can also pay by credit card during checkout.',
      'Our payment options include Wave, Orange Money, and credit cards. All transactions are secure.'
    ],
    products: [
      'Browse our catalog in the "Products" section. You can filter by category and search for specific items.',
      'All our products are available in the "Products" section. Use filters to find what you\'re looking for.'
    ],
    account: [
      'To create an account, click "Register" at the top right. You\'ll then be able to track orders and manage your information.',
      'Your account allows you to track orders, save addresses, and access your purchase history.'
    ],
    contact: [
      'You can contact us via email at the address shown on the Contact page, or through the contact form on our website.',
      'Our support team is available by email. Check the Contact page for more information.'
    ],
    shipping: [
      'Delivery times vary by location. Generally, allow 2-5 business days for local deliveries.',
      'We deliver nationwide. Shipping fees and delivery times are calculated during checkout.'
    ],
    return: [
      'To return a product, contact us within 7 days of receipt. We\'ll guide you through the return process.',
      'Returns are accepted within 7 days. The product must be in its original packaging.'
    ],
    price: [
      'All our prices are displayed in FCFA. Shipping fees are calculated separately during checkout.',
      'Prices are shown in FCFA on each product. Regular promotions are available.'
    ],
    availability: [
      'Product availability is updated in real-time. If a product is out of stock, you can be notified when it\'s back.',
      'Check availability directly on the product page. We update our stock regularly.'
    ],
    default: [
      'I\'m not sure I understand your question. Could you rephrase or choose from these topics: orders, payments, products, shipping, returns?',
      'Sorry, I didn\'t quite get that. Try asking about orders, payments, products, or shipping.',
      'I can help with orders, payments, products, shipping, and returns. What would you like to know?'
    ]
  }
};

/**
 * Détecte la langue du message
 * @param {string} message - Message de l'utilisateur
 * @returns {string} - Code de langue ('fr' ou 'en')
 */
function detectLanguage(message) {
  const lowerMessage = message.toLowerCase();
  
  // Mots-clés français spécifiques
  const frenchKeywords = ['bonjour', 'salut', 'merci', 'au revoir', 'commande', 'paiement', 'produit', 'livraison', 'retour', 'prix', 'disponible', 'comment', 'pourquoi', 'quand', 'où', 'quel', 'quelle'];
  
  // Mots-clés anglais spécifiques
  const englishKeywords = ['hello', 'hi', 'thanks', 'goodbye', 'order', 'payment', 'product', 'shipping', 'return', 'price', 'available', 'how', 'why', 'when', 'where', 'which'];
  
  let frenchScore = 0;
  let englishScore = 0;
  
  frenchKeywords.forEach(keyword => {
    if (lowerMessage.includes(keyword)) frenchScore++;
  });
  
  englishKeywords.forEach(keyword => {
    if (lowerMessage.includes(keyword)) englishScore++;
  });
  
  // Par défaut, retourner français si égalité ou aucun mot-clé détecté
  return frenchScore >= englishScore ? 'fr' : 'en';
}

/**
 * Identifie l'intention de l'utilisateur
 * @param {string} message - Message de l'utilisateur
 * @param {string} language - Langue détectée
 * @returns {string} - Intention identifiée
 */
function identifyIntent(message, language) {
  const lowerMessage = message.toLowerCase();
  const keywords = knowledgeBase[language];
  
  for (const [intent, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (lowerMessage.includes(word)) {
        return intent;
      }
    }
  }
  
  return 'default';
}

/**
 * Génère une réponse basée sur l'intention
 * @param {string} intention - Intention identifiée
 * @param {string} language - Langue détectée
 * @returns {string} - Réponse du chatbot
 */
function generateResponse(intention, language) {
  const responseList = responses[language][intention] || responses[language].default;
  const randomIndex = Math.floor(Math.random() * responseList.length);
  return responseList[randomIndex];
}

/**
 * Traite un message utilisateur et retourne une réponse
 * @param {string} userMessage - Message de l'utilisateur
 * @returns {Object} - Objet contenant la réponse et la langue détectée
 */
function processMessage(userMessage) {
  if (!userMessage || userMessage.trim() === '') {
    return {
      response: 'Veuillez entrer un message. / Please enter a message.',
      language: 'fr',
      intention: 'empty'
    };
  }
  
  const language = detectLanguage(userMessage);
  const intention = identifyIntent(userMessage, language);
  const response = generateResponse(intention, language);
  
  return {
    response: response,
    language: language,
    intention: intention
  };
}

/**
 * Obtient la liste des intentions disponibles
 * @returns {Object} - Intentions disponibles par langue
 */
function getAvailableIntents() {
  return {
    fr: Object.keys(knowledgeBase.fr),
    en: Object.keys(knowledgeBase.en)
  };
}

module.exports = {
  processMessage,
  getAvailableIntents,
  detectLanguage,
  identifyIntent
};
