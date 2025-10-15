const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    // Get token from headers
    const token = req.headers.authorization?.split(" ")[1]; // "Bearer <token>"

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Attach user to request
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found, authorization denied" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("❌ Auth error:", err.message);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

module.exports = protect; // ✅ Export directly
