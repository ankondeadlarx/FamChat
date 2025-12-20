import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  // Try to get token from cookie first, then fall back to Authorization header
  const token = req.cookies.token || 
    (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
