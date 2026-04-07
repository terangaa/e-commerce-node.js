const RecentlyViewed = require('../models/RecentlyViewed');
const Product = require('../models/Product');
const User = require('../models/User');

class RecentlyViewedController {
  // Obtenir les produits récemment consultés par l'utilisateur
  static async getRecentlyViewed(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 10;

      const recentlyViewed = await RecentlyViewed.findAll({
        where: { userId },
        include: [{
          model: Product,
          attributes: ['id', 'name', 'price', 'imageUrl', 'stock', 'status'],
          where: { status: 'available' }
        }],
        order: [['viewedAt', 'DESC']],
        limit: limit
      });

      const products = recentlyViewed.map(item => ({
        id: item.Product.id,
        name: item.Product.name,
        price: item.Product.price,
        imageUrl: item.Product.imageUrl,
        stock: item.Product.stock,
        viewedAt: item.viewedAt
      }));

      res.json({ success: true, data: products });
    } catch (error) {
      console.error('Erreur lors de la récupération des produits récemment consultés:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Ajouter un produit aux récemment consultés
  static async addToRecentlyViewed(req, res) {
    try {
      const userId = req.user.id;
      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({ success: false, message: 'ID du produit requis' });
      }

      // Vérifier si le produit existe
      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Produit non trouvé' });
      }

      // Vérifier si le produit est déjà dans les récemment consultés
      const existing = await RecentlyViewed.findOne({
        where: { userId, productId }
      });

      if (existing) {
        // Mettre à jour la date de consultation
        await existing.update({ viewedAt: new Date() });
      } else {
        // Ajouter le produit aux récemment consultés
        await RecentlyViewed.create({
          userId,
          productId,
          viewedAt: new Date()
        });

        // Limiter le nombre de produits récemment consultés à 20
        const count = await RecentlyViewed.count({ where: { userId } });
        if (count > 20) {
          const oldest = await RecentlyViewed.findOne({
            where: { userId },
            order: [['viewedAt', 'ASC']]
          });
          if (oldest) {
            await oldest.destroy();
          }
        }
      }

      res.json({ success: true, message: 'Produit ajouté aux récemment consultés' });
    } catch (error) {
      console.error('Erreur lors de l\'ajout aux récemment consultés:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Supprimer un produit des récemment consultés
  static async removeFromRecentlyViewed(req, res) {
    try {
      const userId = req.user.id;
      const { productId } = req.params;

      const recentlyViewed = await RecentlyViewed.findOne({
        where: { userId, productId }
      });

      if (!recentlyViewed) {
        return res.status(404).json({ success: false, message: 'Produit non trouvé dans les récemment consultés' });
      }

      await recentlyViewed.destroy();

      res.json({ success: true, message: 'Produit supprimé des récemment consultés' });
    } catch (error) {
      console.error('Erreur lors de la suppression des récemment consultés:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Vider tous les produits récemment consultés
  static async clearRecentlyViewed(req, res) {
    try {
      const userId = req.user.id;

      await RecentlyViewed.destroy({
        where: { userId }
      });

      res.json({ success: true, message: 'Historique des produits consultés vidé' });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'historique:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Obtenir les produits récemment consultés pour les utilisateurs non connectés (via session)
  static async getSessionRecentlyViewed(req, res) {
    try {
      const sessionProducts = req.session.recentlyViewed || [];
      const limit = parseInt(req.query.limit) || 10;

      if (sessionProducts.length === 0) {
        return res.json({ success: true, data: [] });
      }

      // Récupérer les détails des produits
      const products = await Product.findAll({
        where: {
          id: sessionProducts.map(p => p.productId),
          status: 'available'
        },
        attributes: ['id', 'name', 'price', 'imageUrl', 'stock']
      });

      // Fusionner avec les dates de consultation
      const result = products.map(product => {
        const sessionItem = sessionProducts.find(p => p.productId === product.id);
        return {
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          stock: product.stock,
          viewedAt: sessionItem ? sessionItem.viewedAt : new Date()
        };
      });

      // Trier par date de consultation
      result.sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));

      res.json({ success: true, data: result.slice(0, limit) });
    } catch (error) {
      console.error('Erreur lors de la récupération des produits récemment consultés (session):', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Ajouter un produit aux récemment consultés via session
  static async addToSessionRecentlyViewed(req, res) {
    try {
      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({ success: false, message: 'ID du produit requis' });
      }

      // Vérifier si le produit existe
      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Produit non trouvé' });
      }

      // Initialiser la session si nécessaire
      if (!req.session.recentlyViewed) {
        req.session.recentlyViewed = [];
      }

      // Vérifier si le produit est déjà dans les récemment consultés
      const existingIndex = req.session.recentlyViewed.findIndex(p => p.productId === productId);

      if (existingIndex !== -1) {
        // Mettre à jour la date de consultation
        req.session.recentlyViewed[existingIndex].viewedAt = new Date();
      } else {
        // Ajouter le produit aux récemment consultés
        req.session.recentlyViewed.push({
          productId,
          viewedAt: new Date()
        });

        // Limiter le nombre de produits récemment consultés à 20
        if (req.session.recentlyViewed.length > 20) {
          req.session.recentlyViewed.shift();
        }
      }

      res.json({ success: true, message: 'Produit ajouté aux récemment consultés' });
    } catch (error) {
      console.error('Erreur lors de l\'ajout aux récemment consultés (session):', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
}

module.exports = RecentlyViewedController;
