require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
const server = http.createServer(app);

// ALLOWED ORIGINS

const allowed_origins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

// SOCKET.IO

const io = new Server(server, {
  cors: {
    origin: allowed_origins,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
});

// MIDDLEWARE

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// CORS for REST API
app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server or mobile apps
      if (!origin) return callback(null, true);

      if (allowed_origins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Blocked by CORS policy"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ROUTES

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));

// HEALTH CHECK

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "AgroMarket API is running" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// SOCKET INIT

try {
  require("./config/socket")(io);
} catch (err) {
  console.error("Socket init failed:", err);
}

// DATABASE CONNECTION

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// GLOBAL 404 HANDLER
// This works with new path-to-regexp
app.use("*splat", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// START SERVER
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
