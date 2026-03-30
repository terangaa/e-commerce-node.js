async function processWave(req, res) {
  const { orderId, amount } = req.body;
  // Simulation: replace with real Wave API integration
  return res.json({ status: 'success', provider: 'wave', orderId, amount, message: 'Paiement Wave simulé réussi' });
}

async function processOrangeMoney(req, res) {
  const { orderId, amount } = req.body;
  // Simulation: remplacer par intégration Orange Money réelle
  return res.json({ status: 'success', provider: 'orange_money', orderId, amount, message: 'Paiement Orange Money simulé réussi' });
}

module.exports = { processWave, processOrangeMoney };