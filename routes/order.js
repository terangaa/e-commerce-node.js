const express = require('express');
const { createOrder, getOrder } = require('../controllers/orderController');
const { processWave, processOrangeMoney } = require('../controllers/paymentController');

const router = express.Router();

router.post('/', createOrder);
router.get('/:id', getOrder);

router.post('/pay/wave', processWave);
router.post('/pay/orangemoney', processOrangeMoney);

module.exports = router;
