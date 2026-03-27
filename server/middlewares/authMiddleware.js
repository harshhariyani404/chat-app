import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const auth = (req, res, next) => {
  const authorizationHeader = req.headers.authorization || "";
  const token = authorizationHeader.startsWith("Bearer ")
    ? authorizationHeader.slice(7)
    : authorizationHeader;

  if (!token) {
    return res.status(401).json({ message: "Authentication token is required" });
  }

  if (!env.jwtSecret) {
    return res.status(500).json({ message: "JWT configuration is missing" });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired authentication token" });
  }
};

export default auth;
