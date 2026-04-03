const express = require("express");
const paymentController = require("../controllers/paymentController");
const { verifyToken, isBuyer } = require("../middleware/auth");
const router = express.Router();

// interswitch
router.post("/initialize", verifyToken, paymentController.initialize_payment);
router.get(
  "/verify/:transaction_reference",
  verifyToken,
  paymentController.verify_payment
);

// crypto
router.post(
  "/crypto-proof",
  verifyToken,
  paymentController.submit_crypto_proof
);

// check payment status
router.get(
  "/status/:order_id",
  verifyToken,
  paymentController.get_payment_status
);

module.exports = router;
