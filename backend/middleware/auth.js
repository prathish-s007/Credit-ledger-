import jwt from 'jsonwebtoken';
import ShopOwner from '../models/ShopOwner.js';
import Customer from '../models/Customer.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized. No token provided.',
    });
  }

  try {
    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user based on decoded role
    let user;
    if (decoded.role === 'shop_owner') {
      user = await ShopOwner.findById(decoded.id).select('-password');
    } else if (decoded.role === 'customer') {
      user = await Customer.findById(decoded.id).select('-password');
    }

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized. Invalid or expired token.',
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `User role '${req.user?.role || 'unknown'}' is not authorized to access this route.`,
      });
    }
    next();
  };
};
