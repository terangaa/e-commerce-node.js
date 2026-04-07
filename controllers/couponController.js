const { Coupon } = require('../models');

/**
 * Valider un code promo
 */
async function validateCoupon(req, res, next) {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Le code promo est requis' });
    }

    const coupon = await Coupon.findOne({ where: { code: code.toUpperCase() } });

    if (!coupon) {
      return res.status(404).json({ error: 'Code promo invalide' });
    }

    // Vérifier si le coupon est actif
    if (!coupon.isActive) {
      return res.status(400).json({ error: 'Ce code promo n\'est plus valide' });
    }

    // Vérifier les dates de validité
    const now = new Date();
    if (coupon.validFrom && now < new Date(coupon.validFrom)) {
      return res.status(400).json({ error: 'Ce code promo n\'est pas encore valide' });
    }
    if (coupon.validUntil && now > new Date(coupon.validUntil)) {
      return res.status(400).json({ error: 'Ce code promo a expiré' });
    }

    // Vérifier la limite d'utilisation
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ error: 'Ce code promo a atteint sa limite d\'utilisation' });
    }

    // Vérifier le montant minimum de commande
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ 
        error: `Le montant minimum de commande est de ${coupon.minOrderAmount} FCFA` 
      });
    }

    // Calculer la remise
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (orderAmount * coupon.discountValue) / 100;
      // Appliquer la remise maximale si définie
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = coupon.discountValue;
    }

    res.json({
      success: true,
      data: {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        },
        discount: Math.round(discount * 100) / 100,
        finalAmount: Math.round((orderAmount - discount) * 100) / 100,
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Créer un nouveau coupon (admin)
 */
async function createCoupon(req, res, next) {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      validFrom,
      validUntil,
    } = req.body;

    if (!code || !discountType || !discountValue) {
      return res.status(400).json({ error: 'Le code, le type de remise et la valeur sont requis' });
    }

    // Vérifier si le code existe déjà
    const existing = await Coupon.findOne({ where: { code: code.toUpperCase() } });
    if (existing) {
      return res.status(400).json({ error: 'Ce code promo existe déjà' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount: maxDiscountAmount || null,
      usageLimit: usageLimit || null,
      validFrom: validFrom || null,
      validUntil: validUntil || null,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Coupon créé avec succès',
      data: coupon,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Lister tous les coupons (admin)
 */
async function listCoupons(req, res, next) {
  try {
    const coupons = await Coupon.findAll({
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: coupons,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Mettre à jour un coupon (admin)
 */
async function updateCoupon(req, res, next) {
  try {
    const couponId = req.params.id;
    const updateData = req.body;

    const coupon = await Coupon.findByPk(couponId);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon introuvable' });
    }

    // Si le code est modifié, vérifier qu'il n'existe pas déjà
    if (updateData.code && updateData.code.toUpperCase() !== coupon.code) {
      const existing = await Coupon.findOne({ where: { code: updateData.code.toUpperCase() } });
      if (existing) {
        return res.status(400).json({ error: 'Ce code promo existe déjà' });
      }
      updateData.code = updateData.code.toUpperCase();
    }

    await coupon.update(updateData);

    res.json({
      success: true,
      message: 'Coupon mis à jour avec succès',
      data: coupon,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Supprimer un coupon (admin)
 */
async function deleteCoupon(req, res, next) {
  try {
    const couponId = req.params.id;

    const coupon = await Coupon.findByPk(couponId);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon introuvable' });
    }

    await coupon.destroy();

    res.json({
      success: true,
      message: 'Coupon supprimé avec succès',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Activer/Désactiver un coupon (admin)
 */
async function toggleCouponStatus(req, res, next) {
  try {
    const couponId = req.params.id;

    const coupon = await Coupon.findByPk(couponId);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon introuvable' });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({
      success: true,
      message: `Coupon ${coupon.isActive ? 'activé' : 'désactivé'} avec succès`,
      data: coupon,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Incrémenter le compteur d'utilisation d'un coupon
 */
async function incrementUsage(couponId) {
  try {
    const coupon = await Coupon.findByPk(couponId);
    if (coupon) {
      coupon.usedCount += 1;
      await coupon.save();
    }
  } catch (err) {
    console.error('Erreur incrémentation usage coupon:', err);
  }
}

module.exports = {
  validateCoupon,
  createCoupon,
  listCoupons,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  incrementUsage,
};
