const ProductVariant = require('../models/ProductVariant');
const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

class ProductVariantController {

  /* ─────────────────────────────
     📦 GET ALL VARIANTS PRODUCT
  ───────────────────────────── */
  static async getProductVariants(req, res) {
    try {
      const { productId } = req.params;

      const variants = await ProductVariant.findAll({
        where: { productId, isActive: true },
        order: [['createdAt', 'ASC']]
      });

      return res.json({
        success: true,
        data: variants
      });

    } catch (error) {
      console.error("getProductVariants:", error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }

  /* ─────────────────────────────
     🔍 GET VARIANT BY ID
  ───────────────────────────── */
  static async getVariantById(req, res) {
    try {
      const { id } = req.params;

      const variant = await ProductVariant.findByPk(id, {
        include: [{
          model: Product,
          attributes: ['id', 'name', 'price', 'image']
        }]
      });

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: 'Variante non trouvée'
        });
      }

      return res.json({
        success: true,
        data: variant
      });

    } catch (error) {
      console.error("getVariantById:", error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }

  /* ─────────────────────────────
     ➕ CREATE VARIANT (CLOUDINARY)
  ───────────────────────────── */
  static async createVariant(req, res) {
    try {
      const { productId, name, sku, price, stock, attributes } = req.body;

      // 🔍 check product
      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      // 🔍 SKU unique
      if (sku) {
        const existingSku = await ProductVariant.findOne({ where: { sku } });
        if (existingSku) {
          return res.status(400).json({
            success: false,
            message: 'SKU déjà utilisé'
          });
        }
      }

      // 📸 IMAGE UPLOAD
      let imageUrl = product.image || null;

      if (req.file) {
        const uploadResult = await cloudinary.uploader.upload(
          `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
          { folder: "product_variants" }
        );

        imageUrl = uploadResult.secure_url;
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

      return res.status(201).json({
        success: true,
        data: variant
      });

    } catch (error) {
      console.error("createVariant:", error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }

  /* ─────────────────────────────
     ✏️ UPDATE VARIANT
  ───────────────────────────── */
  static async updateVariant(req, res) {
    try {
      const { id } = req.params;
      const { name, sku, price, stock, attributes, isActive } = req.body;

      const variant = await ProductVariant.findByPk(id);
      if (!variant) {
        return res.status(404).json({
          success: false,
          message: 'Variante non trouvée'
        });
      }

      // SKU unique check
      if (sku && sku !== variant.sku) {
        const existingSku = await ProductVariant.findOne({ where: { sku } });

        if (existingSku) {
          return res.status(400).json({
            success: false,
            message: 'SKU déjà utilisé'
          });
        }
      }

      await variant.update({
        name: name ?? variant.name,
        sku: sku ?? variant.sku,
        price: price ?? variant.price,
        stock: stock ?? variant.stock,
        attributes: attributes ?? variant.attributes,
        isActive: isActive ?? variant.isActive
      });

      return res.json({
        success: true,
        data: variant
      });

    } catch (error) {
      console.error("updateVariant:", error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }

  /* ─────────────────────────────
     🗑 DELETE VARIANT
  ───────────────────────────── */
  static async deleteVariant(req, res) {
    try {
      const { id } = req.params;

      const variant = await ProductVariant.findByPk(id);
      if (!variant) {
        return res.status(404).json({
          success: false,
          message: 'Variante non trouvée'
        });
      }

      await variant.destroy();

      return res.json({
        success: true,
        message: 'Variante supprimée'
      });

    } catch (error) {
      console.error("deleteVariant:", error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }

  /* ─────────────────────────────
     📦 STOCK MANAGEMENT
  ───────────────────────────── */
  static async updateStock(req, res) {
    try {
      const { id } = req.params;
      const { quantity, operation } = req.body;

      const variant = await ProductVariant.findByPk(id);
      if (!variant) {
        return res.status(404).json({
          success: false,
          message: 'Variante non trouvée'
        });
      }

      let newStock = variant.stock;

      if (operation === 'add') newStock += Number(quantity);
      else if (operation === 'subtract') newStock -= Number(quantity);
      else newStock = Number(quantity);

      if (newStock < 0) {
        return res.status(400).json({
          success: false,
          message: 'Stock invalide'
        });
      }

      await variant.update({ stock: newStock });

      return res.json({
        success: true,
        data: variant
      });

    } catch (error) {
      console.error("updateStock:", error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }

  /* ─────────────────────────────
     🎯 FILTER BY ATTRIBUTE
  ───────────────────────────── */
  static async getVariantsByAttribute(req, res) {
    try {
      const { productId } = req.params;
      const { attribute, value } = req.query;

      const variants = await ProductVariant.findAll({
        where: { productId, isActive: true }
      });

      const filtered = variants.filter(v =>
        v.attributes && v.attributes[attribute] === value
      );

      return res.json({
        success: true,
        data: filtered
      });

    } catch (error) {
      console.error("getVariantsByAttribute:", error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }

  /* ─────────────────────────────
     📊 ATTRIBUTES SUMMARY
  ───────────────────────────── */
  static async getProductVariantAttributes(req, res) {
    try {
      const { productId } = req.params;

      const variants = await ProductVariant.findAll({
        where: { productId, isActive: true }
      });

      const attributes = {};

      variants.forEach(v => {
        if (v.attributes) {
          Object.entries(v.attributes).forEach(([key, value]) => {
            if (!attributes[key]) attributes[key] = new Set();
            attributes[key].add(value);
          });
        }
      });

      const result = {};
      Object.keys(attributes).forEach(key => {
        result[key] = [...attributes[key]];
      });

      return res.json({
        success: true,
        data: {
          variants,
          attributes: result
        }
      });

    } catch (error) {
      console.error("getProductVariantAttributes:", error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
}

module.exports = ProductVariantController;