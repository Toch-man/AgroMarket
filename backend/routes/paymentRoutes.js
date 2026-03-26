const express = require("express");
const paymentController = require("../controllers/paymentController");
const { verifyToken } = require("../middleware/auth");
const router = express.Router();

// buyer hits this after placing order to get payment URL
router.post(
  "/initialize",
  verifyToken,
  isBuyer,
  paymentController.initialize_payment
);

// called after Interswitch redirects buyer back to your app
router.get(
  "/verify/:transaction_reference",
  verifyToken,
  paymentController.verify_payment
);

module.exports = router;
