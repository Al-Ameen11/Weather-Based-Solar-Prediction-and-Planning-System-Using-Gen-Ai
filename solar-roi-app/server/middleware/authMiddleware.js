const { verify } = require('../utils/authToken');

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  req.user = verify(token);
  next();
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const user = verify(token);
  if (!user) return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  req.user = user;
  return next();
}

module.exports = { optionalAuth, requireAuth };
