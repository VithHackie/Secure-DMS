import jwt from "jsonwebtoken";

/**
 * Middleware to authenticate JWT Bearer Token.
 * Attaches decoded user payload ({ id, email, role, badgeNumber }) to req.user.
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required. Bearer token missing." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_super_secret_jwt_key");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired access token." });
  }
};

/**
 * Optional authentication middleware.
 * Attaches req.user if a valid token is present, but does not block requests if unauthenticated.
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_super_secret_jwt_key");
    req.user = decoded;
  } catch {
    req.user = null;
  }
  next();
};

