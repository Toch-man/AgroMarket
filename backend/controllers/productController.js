// controllers/productController.js
const { validationResult } = require("express-validator");
const Product = require("../model/product");

exports.upload = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const {
      name,
      category,
      description,
      quantity,
      unit,
      price_per_unit,
      min_order_quantity,
      location,
      grade,
      is_negotiable,
      harvest_date,
      is_pre_order,
    } = req.body;

    // owner comes from the verified JWT token, not req.body
    const product = new Product({
      name,
      owner: req.user.id,
      category,
      description,
      quantity,
      unit,
      price_per_unit,
      min_order_quantity,
      location,
      grade,
      is_negotiable,
      harvest_date,
      is_pre_order,
      images: req.files
        ? req.files.map((f) => ({ url: f.path, public_id: f.filename }))
        : [],
    });

    await product.save();

    return res.status(201).json({
      success: true,
      message: "Product listed successfully",
      product,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during upload, try again",
      error: error.message,
    });
  }
};

// GET /products
exports.get_all_products = async (req, res) => {
  try {
    const {
      category,
      state,
      min_price,
      max_price,
      grade,
      is_pre_order,
      search,
      page = 1,
      limit = 20,
      sort = "createdAt",
    } = req.query;

    const filter = { status: "available" };

    if (category) filter.category = category;
    if (state) filter["location.state"] = state;
    if (grade) filter.grade = grade;
    if (is_pre_order !== undefined)
      filter.is_pre_order = is_pre_order === "true";
    if (min_price || max_price) {
      filter.price_per_unit = {};
      if (min_price) filter.price_per_unit.$gte = Number(min_price);
      if (max_price) filter.price_per_unit.$lte = Number(max_price);
    }
    if (search) {
      filter.$text = { $search: search };
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      price_asc: { price_per_unit: 1 },
      price_desc: { price_per_unit: -1 },
      popular: { orders_count: -1 },
    };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("owner", "name phone location avatar")
        .sort(sortOptions[sort] || { createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      products,
    });
  } catch (error) {
    console.error("Fetch products error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch products",
      error: error.message,
    });
  }
};

// GET /products/:id
exports.get_product = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "owner",
      "name phone location avatar rating_score"
    );

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Increment view count silently
    Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec();

    return res.status(200).json({ success: true, product });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not fetch product",
      error: error.message,
    });
  }
};

// PATCH /products/:id  — farmer edits their own listing
exports.update_product = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (product.owner.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const allowed = [
      "name",
      "description",
      "quantity",
      "price_per_unit",
      "min_order_quantity",
      "grade",
      "is_negotiable",
      "harvest_date",
      "status",
      "category",
      "unit",
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    });

    await product.save();

    return res
      .status(200)
      .json({ success: true, message: "Product updated", product });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not update product",
      error: error.message,
    });
  }
};

// DELETE /products/:id
exports.delete_product = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (product.owner.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await product.deleteOne();

    return res.status(200).json({ success: true, message: "Product removed" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not delete product",
      error: error.message,
    });
  }
};

// GET /products/farmer/:farmerId  — all listings by a specific farmer
exports.get_farmer_products = async (req, res) => {
  try {
    const products = await Product.find({ owner: req.params.farmerId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ success: true, products });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not fetch farmer products",
      error: error.message,
    });
  }
};
