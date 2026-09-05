const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3003;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/devshop_orders";
const PRODUCTS_SERVICE_URL =
  process.env.PRODUCTS_SERVICE_URL || "http://localhost:3002";
const SERVICE_NAME = "orders-service";

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  items: [
    {
      productId: String,
      productName: String,
      quantity: Number,
      price: Number,
    },
  ],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

const Order = new mongoose.model("Order", orderSchema);

app.get("/health", (req, res) => {
  res.json({
    service: SERVICE_NAME,
    status: "healthy",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.get("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.post("/orders", async (req, res) => {
  try {
    const { customerName, customerEmail, items } = req.body;

    if (!items || items.length == 0) {
      return res
        .status(400)
        .json({ error: "Order must have at least one item" });
    }

    let totalAmount = 0;
    const verifiedItems = [];

    for (const item of items) {
      try {
        const response = await fetch(
          `${PRODUCTS_SERVICE_URL}/products/${item.productId}`,
        );
        if (!response.ok) {
          return res
            .status(400)
            .json({ error: `Product ${item.productId} not found` });
        }

        const product = await response.json();

        if (product.stock < item.quantity) {
          return res.status(400).json({
            error: `Not enough stock for ${product.name}`,
          });
        }

        verifiedItems.push({
          productId: product._id,
          productName: product.name,
          quantity: item.quantity,
          price: product.price,
        });

        totalAmount += product.price * item.quantity;
      } catch (error) {
        return res
          .status(500)
          .json({ error: `Failed to verify product: ${error.message}` });
      }
    }

    const order = await Order.create({
      customerName,
      customerEmail,
      items: verifiedItems,
      totalAmount,
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.patch("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      {
        new: true,
      },
    );
    if (!order)
      return res.status(404).json({
        error: "Order not found",
      });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`🚀 ${SERVICE_NAME} running on port ${PORT}`);
    });
  } catch (error) {
    console.log("Failed to start: ", error);
    process.exit(1);
  }
}

start();
