const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OrderSchema = new Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price_per_unit: {
      type: Number,
      required: true,
    },
    total_amount: {
      type: Number,
      required: true,
    },

    //payment
    payment_method: {
      type: String,
      enum: ["interswitch", "crypto", "pay_on_delivery"],
      required: true, // buyer picks this at checkout based on what farmer allows
    },
    payment_status: {
      type: String,
      enum: ["unpaid", "paid", "refunded", "failed"],
      default: "unpaid",
    },
    crypto_wallet_address: {
      type: String,
      default: null, // farmer's wallet address, copied from their profile at order time
    },
    crypto_tx_hash: {
      type: String,
      default: null, // buyer submits this after sending crypto as proof
    },
    transaction_reference: {
      type: String,
      default: null, // interswitch ref or any payment ref
    },

    // escrow
    escrow_status: {
      type: String,
      enum: ["holding", "released", "refunded"],
      default: "holding",
    },

    // delivery
    delivery_status: {
      type: String,
      enum: ["pending", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    delivery_address: {
      state: { type: String },
      lga: { type: String },
      address: { type: String },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
