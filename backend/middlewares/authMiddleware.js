import jwt from "jsonwebtoken";
import User from "../models/userSchema.js";

const authentication = async (req, res, next) => {
  try {
    //storing header
    const authHeader = req.headers.authorization;
    //check for header error
    {
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: "Authorization header is required ",
        });
      }

      if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Invalid Authorization header ",
        });
      }
    }

    //ganing the token only
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token not found",
      });
    }

    //verifying the token
    const decode = jwt.verify(token, process.env.JWT_SECRET);

    //To confirm the user really exist
    /*Even if a user provides a valid token, you must verify them against the database because a JSON Web Token (JWT) is stateless and self-contained. Once issued, it cannot be changed or instantly revoked from the server side until it expires naturally.Checking the database on every request prevents several critical security risks: */
    const user = await User.findById(decode.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "User has been blocked",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("Authorization error:", error);

    if (
      error.name == "TokenExpiredError" ||
      error.name == "JsonWebTokenError" ||
      error.name == "CastError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid token ",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Authentication Error",
    });
  }
};

export default authentication;
