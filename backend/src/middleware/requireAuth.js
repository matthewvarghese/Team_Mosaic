import { verifyJwt } from "../auth/jwt.js";

export function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing bearer token" });

  const claims = verifyJwt(token);
  if (!claims) return res.status(401).json({ error: "Invalid token" });

  req.user = { email: claims.sub, scope: claims.scope };
  next();
}
