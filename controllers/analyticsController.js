const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Review = require('../models/Review');
const sequelize = require('../config/database');

class AnalyticsController {
  // Obtenir les statistiques générales
  static async getDashboardStats(req, res) {
    try {
      const totalOrders = await Order.count();
      const totalProducts = await Product.count();
      const totalUsers = await User.count();
      const totalReviews = await Review.count();

      // Calculer le revenu total
      const orders = await Order.findAll({
        where: { status: 'completed' },
        attributes: ['total']
      });
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);

      // Commandes par statut
      const ordersByStatus = await Order.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      });

      // Top 5 produits les plus vendus
      const topProducts = await Order.findAll({
        attributes: [
          'productId',
          [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSold']
        ],
        include: [{ model: Product, attributes: ['name', 'price'] }],
        group: ['productId'],
        order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
        limit: 5
      });

      // Commandes des 7 derniers jours
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentOrders = await Order.findAll({
        where: {
          createdAt: {
            [sequelize.Op.gte]: sevenDaysAgo
          }
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('total')), 'revenue']
        ],
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
      });

      // Nouveaux utilisateurs des 7 derniers jours
      const newUsers = await User.findAll({
        where: {
          createdAt: {
            [sequelize.Op.gte]: sevenDaysAgo
          }
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
      });

      res.json({
        success: true,
        data: {
          overview: {
            totalOrders,
            totalProducts,
            totalUsers,
            totalReviews,
            totalRevenue: totalRevenue.toFixed(2)
          },
          ordersByStatus,
          topProducts,
          recentOrders,
          newUsers
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Obtenir les ventes par période
  static async getSalesByPeriod(req, res) {
    try {
      const { period = 'week' } = req.query;
      let dateFormat, groupBy;
      
      switch (period) {
        case 'day':
          dateFormat = '%Y-%m-%d %H:00:00';
          groupBy = sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m-%d %H:00:00');
          break;
        case 'week':
          dateFormat = '%Y-%m-%d';
          groupBy = sequelize.fn('DATE', sequelize.col('createdAt'));
          break;
        case 'month':
          dateFormat = '%Y-%m-%d';
          groupBy = sequelize.fn('DATE', sequelize.col('createdAt'));
          break;
        case 'year':
          dateFormat = '%Y-%m';
          groupBy = sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m');
          break;
        default:
          dateFormat = '%Y-%m-%d';
          groupBy = sequelize.fn('DATE', sequelize.col('createdAt'));
      }

      const sales = await Order.findAll({
        where: { status: 'completed' },
        attributes: [
          [groupBy, 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'orders'],
          [sequelize.fn('SUM', sequelize.col('total')), 'revenue']
        ],
        group: [groupBy],
        order: [[groupBy, 'ASC']]
      });

      res.json({ success: true, data: sales });
    } catch (error) {
      console.error('Erreur lors de la récupération des ventes:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Obtenir les catégories les plus populaires
  static async getTopCategories(req, res) {
    try {
      const topCategories = await Order.findAll({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSold']
        ],
        include: [{
          model: Product,
          attributes: ['category'],
          required: true
        }],
        group: ['Product.category'],
        order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
        limit: 10
      });

      res.json({ success: true, data: topCategories });
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Obtenir les avis récents
  static async getRecentReviews(req, res) {
    try {
      const recentReviews = await Review.findAll({
        include: [
          { model: User, attributes: ['name', 'email'] },
          { model: Product, attributes: ['name'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      res.json({ success: true, data: recentReviews });
    } catch (error) {
      console.error('Erreur lors de la récupération des avis:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
}

module.exports = AnalyticsController;
