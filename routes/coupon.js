const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');

// Routes publiques
router.post('/validate', couponController.validateCoupon);

// Routes admin (protégées)
router.post('/', couponController.createCoupon);
router.get('/', couponController.listCoupons);
router.put('/:id', couponController.updateCoupon);
router.delete('/:id', couponController.deleteCoupon);
router.patch('/:id/toggle', couponController.toggleCouponStatus);

module.exports = router;
