const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minLength: 3,
    maxLength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
  },
  first_name: { type: String, trim: true },
  last_name: { type: String, trim: true },
  phone: { type: String },
  role: {
    type: String,
    enum: ["buyer", "seller"],
    required: false,
  },

  wallet: {
    balance: { type: Number, default: 0, min: 0 },
    escrow_balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "Naira" },
  },

  crypto_wallets: {
    ethereum: { type: String, default: null },
    usdt: { type: String, default: null },
  },

  is_verified: { type: Boolean, default: false },
  refreshToken: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

UserSchema.virtual("full_name").get(function () {
  if (this.first_name && this.last_name) {
    return `${this.first_name} ${this.last_name}`;
  }
  return this.username;
});

UserSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("User", UserSchema);
