
# Paiement réel intégré
Variables `.env`:
- WAVE_API_KEY
- WAVE_API_URL=https://api.wave.com/v1
- OM_API_TOKEN
- OM_API_URL=https://api.orange.com/orange-money-webpay/dev/v1

Routes:
- POST /orders/pay/wave
- POST /orders/pay/orangemoney
- POST/GET /orders/pay/callback/:provider
- POST /orders/pay/refund
- GET /orders/:orderId/payments
- GET /orders/:orderId/receipt
