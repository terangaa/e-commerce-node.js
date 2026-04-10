function ensureAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/auth/login');
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).send('Accès refusé ❌ (Admin uniquement)');
  }
  next();
}

function authenticateToken(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Non authentifié' });
  }
  req.user = req.session.user; // rend l'utilisateur accessible dans les routes
  next();
}

module.exports = { ensureAdmin, authenticateToken }; // ← les deux exportés