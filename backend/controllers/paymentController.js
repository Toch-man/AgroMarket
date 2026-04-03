const Order = require("../model/order");

const CLIENT_ID = process.env.INTERSWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.INTERSWITCH_CLIENT_SECRET;
const PASSPORT_URL = process.env.INTERSWITCH_PASSPORT_URL;
const PAYMENT_URL = process.env.INTERSWITCH_PAYMENT_URL;
const REDIRECT_URL = process.env.INTERSWITCH_REDIRECT_URL;

// GET ACCESS TOKEN FROM INTERSWITCH

const get_access_token = async () => {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
    "base64"
  );

  const response = await fetch(PASSPORT_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to get Interswitch access token");
  }

  const data = await response.json();
  return data.access_token;
};

// INITIALIZE INTERSWITCH PAYMENT

exports.initialize_payment = async (req, res) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await Order.findById(order_id).populate(
      "buyer",
      "email name"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.buyer._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (order.payment_status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid",
      });
    }

    if (order.payment_method !== "interswitch") {
      return res.status(400).json({
        success: false,
        message: "This order is not an Interswitch order",
      });
    }

    // generate unique reference for this transaction
    const transaction_reference = `AGRO-${order._id}-${Date.now()}`;

    const access_token = await get_access_token();

    // amount must be in kobo — multiply naira by 100
    const amount_in_kobo = order.total_amount * 100;

    const payment_payload = {
      merchantCode: process.env.INTERSWITCH_MERCHANT_CODE,
      payableCode: process.env.INTERSWITCH_PAYABLE_CODE,
      amount: amount_in_kobo,
      redirectUrl: REDIRECT_URL,
      currencyCode: "566", // 566 is NGN naira
      customerId: order.buyer._id,
      customerName: order.buyer.name,
      customerEmail: order.buyer.email,
      transactionReference: transaction_reference,
    };

    const response = await fetch(PAYMENT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payment_payload),
    });

    const payment_data = await response.json();

    if (!response.ok) {
      return res.status(400).json({
        success: false,
        message: "Could not initialize payment",
        error: payment_data,
      });
    }

    // save reference to order so we can verify later
    order.transaction_reference = transaction_reference;
    await order.save();

    return res.status(200).json({
      success: true,
      payment_url: payment_data.redirectUrl,
      transaction_reference,
    });
  } catch (error) {
    console.error("Payment init error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error initializing payment",
      error: error.message,
    });
  }
};

// VERIFY INTERSWITCH PAYMENT AFTER REDIRECT

exports.verify_payment = async (req, res) => {
  try {
    const { transaction_reference } = req.params;

    const access_token = await get_access_token();

    const response = await fetch(
      `${process.env.INTERSWITCH_QUERY_URL}/${transaction_reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const payment_data = await response.json();

    // "00" means successful in Interswitch sandbox and live
    if (payment_data.responseCode !== "00") {
      return res.status(400).json({
        success: false,
        message: "Payment was not successful",
        responseCode: payment_data.responseCode,
      });
    }

    const order = await Order.findOne({ transaction_reference });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found for this transaction",
      });
    }

    // update order payment and escrow status
    order.payment_status = "paid";
    order.escrow_status = "holding"; // funds held until delivery confirmed
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully. Funds held in escrow",
      order,
    });
  } catch (error) {
    console.error("Verify payment error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error verifying payment",
      error: error.message,
    });
  }
};

// SUBMIT CRYPTO PAYMENT PROOF

exports.submit_crypto_proof = async (req, res) => {
  try {
    const { order_id, tx_hash, crypto_type } = req.body;

    if (!order_id || !tx_hash) {
      return res.status(400).json({
        success: false,
        message: "Order ID and transaction hash are required",
      });
    }

    const order = await Order.findById(order_id).populate(
      "farmer",
      "name email"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.buyer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (order.payment_method !== "crypto") {
      return res.status(400).json({
        success: false,
        message: "This order is not a crypto payment order",
      });
    }

    if (order.payment_status === "paid") {
      return res.status(400).json({
        success: false,
        message: "This order has already been marked as paid",
      });
    }

    // save the tx hash — farmer verifies manually via order chat
    order.crypto_tx_hash = tx_hash;
    order.payment_status = "paid";
    order.escrow_status = "holding";
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Crypto payment proof submitted. Farmer will verify your ${
        crypto_type || "crypto"
      } transaction in the order chat`,
      order,
      wallet_used: order.crypto_wallet_address,
      tx_hash,
    });
  } catch (error) {
    console.error("Crypto proof error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error submitting crypto proof",
      error: error.message,
    });
  }
};

// GET PAYMENT STATUS OF AN ORDER

exports.get_payment_status = async (req, res) => {
  try {
    const order = await Order.findById(req.params.order_id).select(
      "payment_status payment_method escrow_status transaction_reference crypto_tx_hash total_amount"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      escrow_status: order.escrow_status,
      total_amount: order.total_amount,
      transaction_reference: order.transaction_reference || null,
      crypto_tx_hash: order.crypto_tx_hash || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not fetch payment status",
      error: error.message,
    });
  }
};
