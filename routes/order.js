const express = require('express');
const { createOrder, getOrder } = require('../controllers/orderController');
const { processWave, processOrangeMoney, paymentCallback, refund, history, receipt } = require('../controllers/paymentController');

const router = express.Router();

router.post('/', createOrder);
router.get('/', async (req, res) => {
  return res.status(200).json({ message: 'Use POST /orders to créer commande ou /orders/:id pour consulter.' });
});
router.get('/:id', getOrder);

router.post('/pay/wave', processWave);
router.post('/pay/orangemoney', processOrangeMoney);
router.post('/pay/callback/:provider', paymentCallback);
router.get('/pay/callback/:provider', paymentCallback);

module.exports = router;

router.post('/pay/refund', refund);
router.get('/:orderId/payments', history);
router.get('/:orderId/receipt', receipt);
