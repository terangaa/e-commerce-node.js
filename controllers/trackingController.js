const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const User = require('../models/User');
const sequelize = require('../config/database');

class TrackingController {
  // Obtenir le statut de suivi d'une commande
  static async getOrderTracking(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;

      const order = await Order.findOne({
        where: { 
          id: orderId,
          ...(userId && { userId })
        },
        include: [
          {
            model: OrderItem,
            include: [{ model: Product, attributes: ['name', 'price', 'image'] }]
          }
        ]
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Commande non trouvée' });
      }

      // Calculer le pourcentage de progression basé sur le statut
      const statusProgress = {
        'pending': 10,
        'confirmed': 25,
        'processing': 50,
        'shipped': 75,
        'delivered': 100,
        'cancelled': 0
      };

      const trackingInfo = {
        orderId: order.id,
        status: order.status,
        progress: statusProgress[order.status] || 0,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        estimatedDelivery: order.estimatedDelivery,
        trackingNumber: order.trackingNumber,
        carrier: order.carrier,
        items: order.OrderItems.map(item => ({
          id: item.id,
          productName: item.Product.name,
          quantity: item.quantity,
          price: item.price,
          image: item.Product.image
        })),
        total: order.total,
        shippingAddress: order.shippingAddress,
        statusHistory: order.statusHistory || []
      };

      res.json({ success: true, data: trackingInfo });
    } catch (error) {
      console.error('Erreur lors de la récupération du suivi:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Mettre à jour le statut d'une commande (admin)
  static async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { status, trackingNumber, carrier, estimatedDelivery } = req.body;

      const order = await Order.findByPk(orderId);

      if (!order) {
        return res.status(404).json({ success: false, message: 'Commande non trouvée' });
      }

      // Valider le statut
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Statut invalide' });
      }

      // Mettre à jour l'historique des statuts
      const statusHistory = order.statusHistory || [];
      statusHistory.push({
        status: order.status,
        timestamp: order.updatedAt,
        note: `Statut changé de ${order.status} à ${status}`
      });

      // Mettre à jour la commande
      await order.update({
        status,
        trackingNumber: trackingNumber || order.trackingNumber,
        carrier: carrier || order.carrier,
        estimatedDelivery: estimatedDelivery || order.estimatedDelivery,
        statusHistory
      });

      res.json({ 
        success: true, 
        message: 'Statut de la commande mis à jour',
        data: {
          orderId: order.id,
          status: order.status,
          trackingNumber: order.trackingNumber,
          carrier: order.carrier,
          estimatedDelivery: order.estimatedDelivery
        }
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Obtenir toutes les commandes avec suivi (admin)
  static async getAllOrdersWithTracking(req, res) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (status) {
        whereClause.status = status;
      }

      const { count, rows: orders } = await Order.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email']
          },
          {
            model: OrderItem,
            include: [{ model: Product, attributes: ['name', 'price'] }]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const statusProgress = {
        'pending': 10,
        'confirmed': 25,
        'processing': 50,
        'shipped': 75,
        'delivered': 100,
        'cancelled': 0
      };

      const ordersWithProgress = orders.map(order => ({
        id: order.id,
        customerName: order.User?.name || 'Client',
        customerEmail: order.User?.email || '',
        status: order.status,
        progress: statusProgress[order.status] || 0,
        total: order.total,
        itemCount: order.OrderItems.length,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        trackingNumber: order.trackingNumber,
        carrier: order.carrier,
        estimatedDelivery: order.estimatedDelivery
      }));

      res.json({
        success: true,
        data: {
          orders: ordersWithProgress,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Obtenir les statistiques de suivi
  static async getTrackingStats(req, res) {
    try {
      const stats = await Order.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      });

      const statusLabels = {
        'pending': 'En attente',
        'confirmed': 'Confirmée',
        'processing': 'En préparation',
        'shipped': 'Expédiée',
        'delivered': 'Livrée',
        'cancelled': 'Annulée'
      };

      const formattedStats = stats.map(stat => ({
        status: stat.status,
        label: statusLabels[stat.status] || stat.status,
        count: parseInt(stat.dataValues.count)
      }));

      res.json({ success: true, data: formattedStats });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
}

module.exports = TrackingController;
