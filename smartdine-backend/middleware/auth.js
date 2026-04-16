const jwt = require('jsonwebtoken');
const JWT_SECRET = 'super_secret_smartdine_key_123';

module.exports = function (req, res, next) {
  // Grab the token from the request header
  const token = req.header('Authorization');

  // If no token, deny access!
  if (!token) return res.status(401).json({ message: 'Access Denied. No token provided.' });

  try {
    // Verify the token is real (and remove the 'Bearer ' string if present)
    const actualToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    const verified = jwt.verify(actualToken, JWT_SECRET);
    
    req.user = verified; // Add the user info to the request
    next(); // Let them pass!
  } catch (err) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};