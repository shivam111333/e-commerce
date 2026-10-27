import jwt from "jsonwebtoken";
import User from "../models/userSchema.js";

const authentication = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        code: "NO_TOKEN",
        message: "Authorization header with Bearer token is required",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        code: "NO_TOKEN",
        message: "Token not found",
      });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);

    // A valid JWT can't be revoked before it expires, so confirm against the DB
    const user = await User.findById(decode.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "User not found",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        code: "USER_BLOCKED",
        message: "User has been blocked",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        code: "TOKEN_EXPIRED",
        message: "Session expired",
      });
    }

    if (error.name === "JsonWebTokenError" || error.name === "CastError") {
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message: "Invalid token",
      });
    }

    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      code: "AUTH_ERROR",
      message: "Authentication error",
    });
  }
};

export default authentication;