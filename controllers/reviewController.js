const { Review, Product, User } = require('../models');

/**
 * Obtenir tous les avis d'un produit
 */
async function getProductReviews(req, res, next) {
  try {
    const productId = req.params.productId;
    const reviews = await Review.findAll({
      where: { productId },
      include: [{ model: User, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });

    const averageRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        reviews,
        averageRating: parseFloat(averageRating),
        totalReviews: reviews.length
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Créer un nouvel avis
 */
async function createReview(req, res, next) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Vous devez être connecté pour laisser un avis' });
    }

    const { productId, rating, comment } = req.body;
    const userId = req.session.user.id;

    // Validation
    if (!productId || !rating) {
      return res.status(400).json({ error: 'Le produit et la note sont requis' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'La note doit être entre 1 et 5' });
    }

    // Vérifier si le produit existe
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: 'Produit introuvable' });
    }

    // Vérifier si l'utilisateur a déjà laissé un avis pour ce produit
    const existingReview = await Review.findOne({
      where: { productId, userId }
    });

    if (existingReview) {
      return res.status(400).json({ error: 'Vous avez déjà laissé un avis pour ce produit' });
    }

    // Créer l'avis
    const review = await Review.create({
      productId,
      userId,
      rating,
      comment: comment || null
    });

    // Récupérer l'avis avec les informations de l'utilisateur
    const reviewWithUser = await Review.findByPk(review.id, {
      include: [{ model: User, attributes: ['id', 'name'] }]
    });

    res.status(201).json({
      success: true,
      message: 'Avis ajouté avec succès',
      data: reviewWithUser
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Mettre à jour un avis
 */
async function updateReview(req, res, next) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Vous devez être connecté' });
    }

    const reviewId = req.params.id;
    const { rating, comment } = req.body;
    const userId = req.session.user.id;

    // Validation
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'La note doit être entre 1 et 5' });
    }

    // Trouver l'avis
    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Avis introuvable' });
    }

    // Vérifier que l'utilisateur est le propriétaire de l'avis
    if (review.userId !== userId) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres avis' });
    }

    // Mettre à jour
    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    await review.save();

    // Récupérer l'avis mis à jour avec les informations de l'utilisateur
    const updatedReview = await Review.findByPk(reviewId, {
      include: [{ model: User, attributes: ['id', 'name'] }]
    });

    res.json({
      success: true,
      message: 'Avis mis à jour avec succès',
      data: updatedReview
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Supprimer un avis
 */
async function deleteReview(req, res, next) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Vous devez être connecté' });
    }

    const reviewId = req.params.id;
    const userId = req.session.user.id;
    const userRole = req.session.user.role;

    // Trouver l'avis
    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Avis introuvable' });
    }

    // Vérifier que l'utilisateur est le propriétaire ou un admin
    if (review.userId !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres avis' });
    }

    // Supprimer
    await review.destroy();

    res.json({
      success: true,
      message: 'Avis supprimé avec succès'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Obtenir les avis de l'utilisateur connecté
 */
async function getUserReviews(req, res, next) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Vous devez être connecté' });
    }

    const userId = req.session.user.id;
    const reviews = await Review.findAll({
      where: { userId },
      include: [{ model: Product, attributes: ['id', 'name', 'imageUrl'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: reviews
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Obtenir les statistiques des avis pour un produit
 */
async function getReviewStats(req, res, next) {
  try {
    const productId = req.params.productId;
    const reviews = await Review.findAll({ where: { productId } });

    const stats = {
      total: reviews.length,
      average: reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0,
      distribution: {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getUserReviews,
  getReviewStats
};
