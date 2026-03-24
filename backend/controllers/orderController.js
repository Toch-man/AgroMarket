// controllers/orderController.js
const { validationResult } = require("express-validator");
const Order = require("../model/order");
const Product = require("../model/product");
const User = require("../model/user");

// POST /orders
exports.place_order = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { product_id, quantity, delivery_address, payment_method } = req.body;

    const product = await Product.findById(product_id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (product.status !== "available") {
      return res
        .status(400)
        .json({ success: false, message: "Product is not available" });
    }

    if (quantity < product.min_order_quantity) {
      return res.status(400).json({
        success: false,
        message: `Minimum order is ${product.min_order_quantity} ${product.unit}`,
      });
    }

    if (quantity > product.quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.quantity} ${product.unit} available`,
      });
    }

    // check farmer accepts this payment method
    if (!product.accepted_payment_methods.includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message: `Farmer does not accept ${payment_method}. Accepted: ${product.accepted_payment_methods.join(
          ", "
        )}`,
      });
    }

    // if crypto, grab farmer's wallet address
    let crypto_wallet_address = null;
    if (payment_method === "crypto") {
      const farmer = await User.findById(product.owner).select(
        "crypto_wallets"
      );
      if (!farmer.crypto_wallets?.ethereum) {
        return res.status(400).json({
          success: false,
          message: "Farmer has not set a crypto wallet address",
        });
      }
      crypto_wallet_address = farmer.crypto_wallets.ethereum;
    }

    const total_amount = quantity * product.price_per_unit;

    const order = new Order({
      product: product._id,
      buyer: req.user.id,
      farmer: product.owner,
      quantity,
      price_per_unit: product.price_per_unit,
      total_amount,
      delivery_address,
      payment_method,
      crypto_wallet_address,
    });

    await order.save();

    // deduct quantity from product
    product.quantity -= quantity;
    product.orders_count += 1;
    if (product.quantity === 0) product.status = "sold_out";
    await product.save();

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("Place order error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error placing order",
      error: error.message,
    });
  }
};

// GET /orders/my-orders — buyer
exports.get_my_orders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate("product", "name images unit")
      .populate("farmer", "name phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not fetch orders",
      error: error.message,
    });
  }
};

// GET /orders/farmer-orders — farmer
exports.get_farmer_orders = async (req, res) => {
  try {
    const orders = await Order.find({ farmer: req.user.id })
      .populate("product", "name images unit")
      .populate("buyer", "name phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not fetch farmer orders",
      error: error.message,
    });
  }
};

// PATCH /orders/:id/ship — farmer marks shipped
exports.mark_shipped = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.farmer.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    if (order.delivery_status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "Order already processed" });
    }

    order.delivery_status = "shipped";
    await order.save();

    return res
      .status(200)
      .json({ success: true, message: "Order marked as shipped", order });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not update order",
      error: error.message,
    });
  }
};

// PATCH /orders/:id/delivered — buyer confirms delivery, releases escrow
exports.confirm_delivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.buyer.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    if (order.delivery_status !== "shipped") {
      return res.status(400).json({
        success: false,
        message: "Order has not been shipped yet",
      });
    }

    order.delivery_status = "delivered";
    order.escrow_status = "released";
    order.payment_status = "paid";
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Delivery confirmed, payment released to farmer",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not confirm delivery",
      error: error.message,
    });
  }
};

// PATCH /orders/:id/cancel
exports.cancel_order = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const isOwner =
      order.buyer.toString() === req.user.id ||
      order.farmer.toString() === req.user.id;

    if (!isOwner) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    if (order.delivery_status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel an order that is already shipped",
      });
    }

    order.delivery_status = "cancelled";
    order.escrow_status = "refunded";
    order.payment_status = "refunded";
    await order.save();

    // restore product quantity
    await Product.findByIdAndUpdate(order.product, {
      $inc: { quantity: order.quantity, orders_count: -1 },
      status: "available",
    });

    return res
      .status(200)
      .json({ success: true, message: "Order cancelled", order });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not cancel order",
      error: error.message,
    });
  }
};

// PATCH /orders/:id/crypto-proof — buyer submits tx hash
exports.submit_crypto_proof = async (req, res) => {
  try {
    const { tx_hash } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.buyer.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    if (order.payment_method !== "crypto") {
      return res
        .status(400)
        .json({ success: false, message: "This order is not a crypto order" });
    }

    order.crypto_tx_hash = tx_hash;
    order.payment_status = "paid";
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Transaction hash submitted, farmer will verify",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not submit proof",
      error: error.message,
    });
  }
};
