const { Wishlist, Product, Category } = require('../models');

/**
 * Obtenir la liste de souhaits de l'utilisateur
 */
async function getWishlist(req, res, next) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Vous devez être connecté' });
    }

    const userId = req.session.user.id;
    const wishlistItems = await Wishlist.findAll({
      where: { userId },
      include: [{ 
        model: Product, 
        include: [Category],
        attributes: ['id', 'name', 'price', 'imageUrl', 'stock', 'status']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: wishlistItems
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Ajouter un produit à la liste de souhaits
 */
async function addToWishlist(req, res, next) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Vous devez être connecté' });
    }

    const { productId } = req.body;
    const userId = req.session.user.id;

    if (!productId) {
      return res.status(400).json({ error: 'Le produit est requis' });
    }

    // Vérifier si le produit existe
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: 'Produit introuvable' });
    }

    // Vérifier si le produit est déjà dans la liste de souhaits
    const existing = await Wishlist.findOne({
      where: { userId, productId }
    });

    if (existing) {
      return res.status(400).json({ error: 'Ce produit est déjà dans votre liste de souhaits' });
    }

    // Ajouter à la liste de souhaits
    await Wishlist.create({ userId, productId });

    res.status(201).json({
      success: true,
      message: 'Produit ajouté à la liste de souhaits'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Supprimer un produit de la liste de souhaits
 */
async function removeFromWishlist(req, res, next) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Vous devez être connecté' });
    }

    const productId = req.params.productId;
    const userId = req.session.user.id;

    const wishlistItem = await Wishlist.findOne({
      where: { userId, productId }
    });

    if (!wishlistItem) {
      return res.status(404).json({ error: 'Produit non trouvé dans la liste de souhaits' });
    }

    await wishlistItem.destroy();

    res.json({
      success: true,
      message: 'Produit retiré de la liste de souhaits'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Vérifier si un produit est dans la liste de souhaits
 */
async function checkWishlist(req, res, next) {
  try {
    if (!req.session.user) {
      return res.json({ success: true, data: { inWishlist: false } });
    }

    const productId = req.params.productId;
    const userId = req.session.user.id;

    const wishlistItem = await Wishlist.findOne({
      where: { userId, productId }
    });

    res.json({
      success: true,
      data: { inWishlist: !!wishlistItem }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Obtenir le nombre d'articles dans la liste de souhaits
 */
async function getWishlistCount(req, res, next) {
  try {
    if (!req.session.user) {
      return res.json({ success: true, data: { count: 0 } });
    }

    const userId = req.session.user.id;
    const count = await Wishlist.count({ where: { userId } });

    res.json({
      success: true,
      data: { count }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Afficher la page de la liste de souhaits
 */
async function wishlistPage(req, res, next) {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    res.render('wishlist', {
      user: req.session.user,
      locale: req.getLocale(),
      currentPage: 'wishlist'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
  getWishlistCount,
  wishlistPage
};
