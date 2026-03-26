const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fromUsername: { type: String },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // private chat

  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    default: null,
  }, // order chat ← new
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ["private", "order"], // ← add order
    required: true,
  },
  delivered: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

// speeds up fetching order chat history
MessageSchema.index({ orderId: 1, type: 1 });
// speeds up fetching private chat history
MessageSchema.index({ from: 1, to: 1 });

module.exports = mongoose.model("Message", MessageSchema);
