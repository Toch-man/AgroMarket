const express = require("express");
const orderController = require("../controllers/orderController");
const { verifyToken, isFarmer } = require("../middleware/auth");
const router = express.Router();

router.get("/stats", verifyToken, isFarmer, orderController.get_farmer_stats);
router.get("/my-orders", verifyToken, orderController.get_my_orders);
router.get(
  "/farmer-orders",
  verifyToken,
  isFarmer,
  orderController.get_farmer_orders
);

router.get("/:id", verifyToken, orderController.get_order);
router.post("/", verifyToken, orderController.place_order);
router.patch("/:id/ship", verifyToken, isFarmer, orderController.mark_shipped);
router.patch(
  "/:id/delivered",
  verifyToken,

  orderController.confirm_delivery
);
router.patch("/:id/cancel", verifyToken, orderController.cancel_order);
router.patch(
  "/:id/crypto-proof",
  verifyToken,

  orderController.submit_crypto_proof
);

module.exports = router;
