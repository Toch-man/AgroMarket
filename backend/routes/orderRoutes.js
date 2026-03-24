// routes/orderRoutes.js
const express = require("express");
const orderController = require("../controllers/orderController");
const { verifyToken, isBuyer, isFarmer } = require("../middleware/auth");
const router = express.Router();

router.post("/", verifyToken, isBuyer, orderController.place_order);
router.get("/my-orders", verifyToken, isBuyer, orderController.get_my_orders);
router.get(
  "/farmer-orders",
  verifyToken,
  isFarmer,
  orderController.get_farmer_orders
);
router.patch("/:id/ship", verifyToken, isFarmer, orderController.mark_shipped);
router.patch(
  "/:id/delivered",
  verifyToken,
  isBuyer,
  orderController.confirm_delivery
);
router.patch("/:id/cancel", verifyToken, orderController.cancel_order);
router.patch(
  "/:id/crypto-proof",
  verifyToken,
  isBuyer,
  orderController.submit_crypto_proof
);

module.exports = router;
