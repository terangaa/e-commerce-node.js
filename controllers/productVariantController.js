const ProductVariant = require('../models/ProductVariant');
const Product = require('../models/Product');

class ProductVariantController {
  // Obtenir toutes les variantes d'un produit
  static async getProductVariants(req, res) {
    try {
      const { productId } = req.params;

      const variants = await ProductVariant.findAll({
        where: { productId, isActive: true },
        order: [['createdAt', 'ASC']]
      });

      res.json({ success: true, data: variants });
    } catch (error) {
      console.error('Erreur lors de la récupération des variantes:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Obtenir une variante par son ID
  static async getVariantById(req, res) {
    try {
      const { id } = req.params;

      const variant = await ProductVariant.findByPk(id, {
        include: [{ model: Product, attributes: ['id', 'name', 'price'] }]
      });

      if (!variant) {
        return res.status(404).json({ success: false, message: 'Variante non trouvée' });
      }

      res.json({ success: true, data: variant });
    } catch (error) {
      console.error('Erreur lors de la récupération de la variante:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Créer une nouvelle variante
  static async createVariant(req, res) {
    try {
      const { productId, name, sku, price, stock, attributes, imageUrl } = req.body;

      // Vérifier si le produit existe
      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Produit non trouvé' });
      }

      // Vérifier si le SKU est unique
      if (sku) {
        const existingSku = await ProductVariant.findOne({ where: { sku } });
        if (existingSku) {
          return res.status(400).json({ success: false, message: 'Ce SKU existe déjà' });
        }
      }

      const variant = await ProductVariant.create({
        productId,
        name,
        sku,
        price: price || product.price,
        stock: stock || 0,
        attributes: attributes || {},
        imageUrl,
        isActive: true
      });

      res.status(201).json({ success: true, data: variant });
    } catch (error) {
      console.error('Erreur lors de la création de la variante:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Mettre à jour une variante
  static async updateVariant(req, res) {
    try {
      const { id } = req.params;
      const { name, sku, price, stock, attributes, imageUrl, isActive } = req.body;

      const variant = await ProductVariant.findByPk(id);
      if (!variant) {
        return res.status(404).json({ success: false, message: 'Variante non trouvée' });
      }

      // Vérifier si le SKU est unique
      if (sku && sku !== variant.sku) {
        const existingSku = await ProductVariant.findOne({ where: { sku } });
        if (existingSku) {
          return res.status(400).json({ success: false, message: 'Ce SKU existe déjà' });
        }
      }

      await variant.update({
        name: name || variant.name,
        sku: sku || variant.sku,
        price: price !== undefined ? price : variant.price,
        stock: stock !== undefined ? stock : variant.stock,
        attributes: attributes || variant.attributes,
        imageUrl: imageUrl || variant.imageUrl,
        isActive: isActive !== undefined ? isActive : variant.isActive
      });

      res.json({ success: true, data: variant });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la variante:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Supprimer une variante
  static async deleteVariant(req, res) {
    try {
      const { id } = req.params;

      const variant = await ProductVariant.findByPk(id);
      if (!variant) {
        return res.status(404).json({ success: false, message: 'Variante non trouvée' });
      }

      await variant.destroy();

      res.json({ success: true, message: 'Variante supprimée' });
    } catch (error) {
      console.error('Erreur lors de la suppression de la variante:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Mettre à jour le stock d'une variante
  static async updateStock(req, res) {
    try {
      const { id } = req.params;
      const { quantity, operation } = req.body;

      const variant = await ProductVariant.findByPk(id);
      if (!variant) {
        return res.status(404).json({ success: false, message: 'Variante non trouvée' });
      }

      let newStock = variant.stock;
      if (operation === 'add') {
        newStock += quantity;
      } else if (operation === 'subtract') {
        newStock -= quantity;
      } else {
        newStock = quantity;
      }

      if (newStock < 0) {
        return res.status(400).json({ success: false, message: 'Le stock ne peut pas être négatif' });
      }

      await variant.update({ stock: newStock });

      res.json({ success: true, data: variant });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Obtenir les variantes par attribut (taille, couleur, etc.)
  static async getVariantsByAttribute(req, res) {
    try {
      const { productId } = req.params;
      const { attribute, value } = req.query;

      const variants = await ProductVariant.findAll({
        where: { productId, isActive: true }
      });

      // Filtrer par attribut
      const filteredVariants = variants.filter(variant => {
        if (!variant.attributes) return false;
        return variant.attributes[attribute] === value;
      });

      res.json({ success: true, data: filteredVariants });
    } catch (error) {
      console.error('Erreur lors de la récupération des variantes:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // Obtenir toutes les variantes d'un produit avec leurs attributs uniques
  static async getProductVariantAttributes(req, res) {
    try {
      const { productId } = req.params;

      const variants = await ProductVariant.findAll({
        where: { productId, isActive: true }
      });

      // Extraire les attributs uniques
      const attributes = {};
      variants.forEach(variant => {
        if (variant.attributes) {
          Object.keys(variant.attributes).forEach(key => {
            if (!attributes[key]) {
              attributes[key] = new Set();
            }
            attributes[key].add(variant.attributes[key]);
          });
        }
      });

      // Convertir les Sets en tableaux
      const result = {};
      Object.keys(attributes).forEach(key => {
        result[key] = Array.from(attributes[key]);
      });

      res.json({ success: true, data: { variants, attributes: result } });
    } catch (error) {
      console.error('Erreur lors de la récupération des attributs:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
}

module.exports = ProductVariantController;
