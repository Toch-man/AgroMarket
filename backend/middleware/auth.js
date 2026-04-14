const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
        expired: true,
      });
    }

    return res.status(403).json({
      success: false,
      message: "Invalid token",
    });
  }
};

exports.isFarmer = (req, res, next) => {
  if (req.user.role === "seller") {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Seller access required",
  });
};
