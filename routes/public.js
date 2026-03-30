const express = require('express');
const { listProducts, productDetails } = require('../controllers/publicController');
const router = express.Router();

router.get('/', listProducts);
router.get('/:id', productDetails);

module.exports = router;
