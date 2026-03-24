// model/product.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // links to your User model for .populate()
      required: true,
    },
    category: {
      type: String,
      enum: [
        "grains",
        "vegetables",
        "fruits",
        "livestock",
        "dairy",
        "tubers",
        "spices",
        "other",
      ],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      enum: ["kg", "tonnes", "bags", "litres", "crates", "pieces", "bundles"],
      required: true,
    },
    price_per_unit: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    min_order_quantity: {
      type: Number,
      default: 1,
    },
    location: {
      state: { type: String, required: true },
      lga: { type: String },
    },
    images: [
      {
        url: { type: String },
        public_id: { type: String }, // for cloudinary deletion later
      },
    ],
    grade: {
      type: String,
      enum: ["A", "B", "C", "ungraded"],
      default: "ungraded",
    },
    harvest_date: {
      type: Date, // for pre-order / future produce listings
    },
    is_pre_order: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["available", "sold_out", "suspended"],
      default: "available",
    },
    views: {
      type: Number,
      default: 0,
    },
    orders_count: {
      type: Number,
      default: 0,
    },
    accepted_payment_methods: {
      type: [String],
      enum: ["interswitch", "crypto", "pay_on_delivery"],
      default: ["interswitch"], // farmer decides what they accept
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// allows full-text search on name and description
ProductSchema.index({ name: "text", description: "text" });

// speeds up the common filter: category + state + status
ProductSchema.index({ "location.state": 1, category: 1, status: 1 });

module.exports = mongoose.model("Product", ProductSchema);
