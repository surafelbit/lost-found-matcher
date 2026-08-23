import jwt from "jsonwebtoken";

/**
 * requireAuth — Express middleware.
 * Reads the JWT from the Authorization header, verifies it, and attaches
 * req.user = { userId, name, email } for downstream handlers.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ errors: ["Authentication required"] });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: payload.userId,
      name:   payload.name,
      email:  payload.email,
    };
    next();
  } catch {
    return res.status(401).json({ errors: ["Invalid or expired token"] });
  }
}
