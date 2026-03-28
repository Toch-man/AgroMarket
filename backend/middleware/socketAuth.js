// middleware/socketAuth.js
const jwt = require("jsonwebtoken");
const User = require("../model/user");

module.exports = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("No token provided"));
    }

    // verify the token using your JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // find the user from the decoded token id
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new Error("User not found"));
    }

    // attach user to socket so every event handler can access socket.user
    socket.user = user;
    next();
  } catch (error) {
    // if token is invalid or expired, block the connection
    next(new Error("Invalid or expired token"));
  }
};
