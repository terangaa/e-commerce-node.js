const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Review = require('../models/Review');
const sequelize = require('../config/database');

class RecommendationController {
  // Obtenir des produits recommandés basés sur la catégorie
  static async getRelatedProducts(req, res) {
    try {
      const { productId } = req.params;
      const limit = parseInt(req.query.limit) || 4;

      // Trouver le produit actuel
      const currentProduct = await Product.findByPk(productId, {
        include: [{ model: Category }]
      });

      if (!currentProduct) {
        return res.status(404).json({ success: false, message: 'Produit non trouvé' });
      }

      // Trouver des produits de la même catégorie
      const relatedProducts = await Product.findAll({
        where: {
          categoryId: currentProduct.categoryId,
          id: { [sequelize.Op.ne]: productId }
        },
        include: [
          { model: Category, attributes: ['name'] },
          { 
            model: Review, 
            attributes: ['rating'],
            required: false
          }
        ],
        limit: limit
      });

      // Calculer la note moyenne pour chaque produit
      const productsWithRating = relatedProducts.map(product => {
        const reviews = product.Reviews || [];
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
          : 0;
        
        return {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.Category.name,
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length
        };
      });

      res.json({ success: true, data: productsWithRating });
    } catch (error) {
      console.error('Erreur lors de la récupération des produits associés:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Obtenir les produits les plus vendus
  static async getBestSellers(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 8;

      const bestSellers = await Order.findAll({
        attributes: [
          'productId',
          [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSold']
        ],
        include: [{
          model: Product,
          attributes: ['id', 'name', 'price', 'image'],
          include: [{ model: Category, attributes: ['name'] }]
        }],
        group: ['productId'],
        order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
        limit: limit
      });

      const products = bestSellers.map(item => ({
        id: item.Product.id,
        name: item.Product.name,
        price: item.Product.price,
        image: item.Product.image,
        category: item.Product.Category.name,
        totalSold: parseInt(item.dataValues.totalSold)
      }));

      res.json({ success: true, data: products });
    } catch (error) {
      console.error('Erreur lors de la récupération des meilleures ventes:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Obtenir les produits les mieux notés
  static async getTopRated(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 8;

      const topRated = await Product.findAll({
        include: [
          { model: Category, attributes: ['name'] },
          { 
            model: Review, 
            attributes: ['rating'],
            required: false
          }
        ]
      });

      // Calculer la note moyenne pour chaque produit
      const productsWithRating = topRated.map(product => {
        const reviews = product.Reviews || [];
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
          : 0;
        
        return {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.Category.name,
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length
        };
      });

      // Filtrer les produits avec au moins un avis et trier par note
      const filteredProducts = productsWithRating
        .filter(p => p.reviewCount > 0)
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, limit);

      res.json({ success: true, data: filteredProducts });
    } catch (error) {
      console.error('Erreur lors de la récupération des produits les mieux notés:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Obtenir les produits récemment ajoutés
  static async getRecentProducts(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 8;

      const recentProducts = await Product.findAll({
        include: [
          { model: Category, attributes: ['name'] },
          { 
            model: Review, 
            attributes: ['rating'],
            required: false
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: limit
      });

      const products = recentProducts.map(product => {
        const reviews = product.Reviews || [];
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
          : 0;
        
        return {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.Category.name,
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length
        };
      });

      res.json({ success: true, data: products });
    } catch (error) {
      console.error('Erreur lors de la récupération des produits récents:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Obtenir des recommandations personnalisées basées sur l'historique
  static async getPersonalizedRecommendations(req, res) {
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit) || 8;

      if (!userId) {
        // Si pas connecté, retourner les meilleures ventes
        return RecommendationController.getBestSellers(req, res);
      }

      // Trouver les catégories préférées de l'utilisateur
      const userOrders = await Order.findAll({
        where: { userId },
        include: [{
          model: Product,
          attributes: ['categoryId'],
          include: [{ model: Category, attributes: ['name'] }]
        }]
      });

      // Compter les achats par catégorie
      const categoryCount = {};
      userOrders.forEach(order => {
        const categoryId = order.Product.categoryId;
        categoryCount[categoryId] = (categoryCount[categoryId] || 0) + order.quantity;
      });

      // Trouver les catégories les plus achetées
      const topCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([categoryId]) => parseInt(categoryId));

      if (topCategories.length === 0) {
        return RecommendationController.getBestSellers(req, res);
      }

      // Trouver les produits des catégories préférées
      const recommendedProducts = await Product.findAll({
        where: {
          categoryId: { [sequelize.Op.in]: topCategories }
        },
        include: [
          { model: Category, attributes: ['name'] },
          { 
            model: Review, 
            attributes: ['rating'],
            required: false
          }
        ],
        limit: limit
      });

      const products = recommendedProducts.map(product => {
        const reviews = product.Reviews || [];
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
          : 0;
        
        return {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.Category.name,
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length
        };
      });

      res.json({ success: true, data: products });
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
}

module.exports = RecommendationController;
