// routes/productRoutes.js
const express = require("express");
const productController = require("../controllers/productController");
const { verifyToken, isFarmer } = require("../middleware/auth");
const { upload } = require("../config/cloudinary"); // import upload middleware
const router = express.Router();
const { body } = require("express-validator");

const uploadProductValidator = [
  body("name").trim().notEmpty().withMessage("Product name is required"),
  body("category")
    .isIn([
      "grains",
      "vegetables",
      "fruits",
      "livestock",
      "dairy",
      "tubers",
      "spices",
      "other",
    ])
    .withMessage("Invalid category"),
  body("quantity")
    .isNumeric({ min: 0 })
    .withMessage("Quantity must be a number"),
  body("unit")
    .isIn(["kg", "tonnes", "bags", "litres", "crates", "pieces", "bundles"])
    .withMessage("Invalid unit"),
  body("price_per_unit")
    .isNumeric({ min: 0 })
    .withMessage("Price must be a number"),
  body("location.state").notEmpty().withMessage("State is required"),
];

// Public routes

router.get("/", productController.get_all_products);
router.get("/farmer/:farmerId", productController.get_farmer_products);
router.get("/:id", productController.get_product);

// Farmer-only routes
// farmer routes — upload.array("images", 5) allows up to 5 images
router.post(
  "/upload",
  verifyToken,
  isFarmer,
  upload.array("images", 5),
  productController.upload
);
router.patch("/:id", verifyToken, isFarmer, productController.update_product);
router.delete("/:id", verifyToken, isFarmer, productController.delete_product);

module.exports = router;
