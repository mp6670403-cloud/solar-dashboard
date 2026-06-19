/**
 * JWT AUTHENTICATION MIDDLEWARE
 * =============================
 * Validates the Bearer token in the Authorization header.
 * If valid, attaches the decoded user object to `req.user` with:
 *   - id: user's database ID
 *   - username: login username
 *   - designation: role (Owner, HR, Sales, Operations)
 * 
 * USAGE: Add `authenticateToken` to any route that needs login protection.
 *   router.get('/secure-data', authenticateToken, (req, res) => { ... });
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me';

const authenticateToken = (req, res, next) => {
  // Expect header format: "Authorization: Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token. Please log in again.' });
    }
    // Attach decoded user payload to the request object
    req.user = user;
    next();
  });
};

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    const { designation } = req.user;
    if (allowedRoles.includes(designation) || designation === 'Owner') {
      return next();
    }
    return res.status(403).json({ error: `Forbidden: Restricted access. Required roles: ${allowedRoles.join(', ')}` });
  };
};

module.exports = { authenticateToken, checkRole, JWT_SECRET };
