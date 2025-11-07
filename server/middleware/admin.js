// Middleware to check if user is admin or moderator
const adminAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!req.user.roles || (!req.user.roles.includes('admin') && !req.user.roles.includes('moderator'))) {
    return res.status(403).json({ message: 'Access denied. Admin or moderator role required.' });
  }

  next();
};

module.exports = adminAuth;

