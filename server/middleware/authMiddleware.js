const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/apiResponse');

const authenticateJwt = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'Authentication token missing or invalid format');
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'neosoft_jwt_super_secret_key_2026_change_in_production';

    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id);
    if (!user) {
      return errorResponse(res, 401, 'User account no longer exists');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Your session has expired. Please log in again.');
    }
    return errorResponse(res, 401, 'Invalid authentication token');
  }
};

module.exports = {
  authenticateJwt
};
