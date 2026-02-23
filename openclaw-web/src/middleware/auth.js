/**
 * Authentication Middleware
 */

export function authMiddleware(req, res, next) {
  // Check if user is authenticated via session
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }

  // Attach user info to request
  req.userId = req.session.userId;
  req.userRole = req.session.userRole;
  req.username = req.session.username;

  next();
}

export function adminOnly(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

export function optionalAuth(req, res, next) {
  if (req.session && req.session.userId) {
    req.userId = req.session.userId;
    req.userRole = req.session.userRole;
    req.username = req.session.username;
  }
  next();
}
