const express = require("express");
const mongoose = require("mongoose");
const { createClient } = require("redis");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3002;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/devshop_products";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const SERVICE_NAME = "products-service";

const productsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: String,
  stock: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Product = new mongoose.model("Product", productsSchema);

let redisClient;

async function connectRedis() {
  try {
    redisClient = await createClient({ url: REDIS_URL });
    redisClient.on("error", (err) => console.log("Redis error: ", err));
    await redisClient.connect();
  } catch (error) {
    console.error(`Failed to connect to redis: `, error);
  }
}

app.get("/health", (req, res) => {
  res.json({
    service: SERVICE_NAME,
    status: "healthy",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    cache: redisClient?.isReady ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

app.get("/products", async (req, res) => {
  try {
    if (redisClient?.isReady) {
      const cached = await redisClient.get("all_products");
      if (cached) {
        console.log("Cache Hit");
        return res.json(JSON.parse(cached));
      }
    }

    console.log("Cache Miss - Fetching from MongoDB");
    const products = await Product.find({}).sort({ createdAt: -1 });

    if (redisClient?.isReady) {
      await redisClient.setEx("all_products", 30, JSON.stringify(products));
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.post("/products", async (req, res) => {
  try {
    const product = await Product.create(req.body);
    if (redisClient?.isReady) await redisClient.del("all_products");
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.put("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!product)
      return res.status(404).json({
        error: "Product not found",
      });
    if (redisClient?.isReady) await redisClient.del("all_products");
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (redisClient?.isReady) await redisClient.del("all_products");
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB Connected");

    await connectRedis();

    const count = await Product.countDocuments();

    if (count == 0) {
      await Product.insertMany([
        {
          name: "Laptop Pro",
          description: "High-performance laptop",
          price: 1299,
          category: "electronics",
          stock: 50,
        },
        {
          name: "Wireless Mouse",
          description: "Ergonomic wireless mouse",
          price: 29,
          category: "electronics",
          stock: 200,
        },
        {
          name: "Mechanical Keyboard",
          description: "RGB mechanical keyboard",
          price: 89,
          category: "electronics",
          stock: 100,
        },
        {
          name: "USB-C Hub",
          description: "7-in-1 USB-C hub",
          price: 45,
          category: "accessories",
          stock: 150,
        },
        {
          name: 'Monitor 27"',
          description: "4K IPS monitor",
          price: 399,
          category: "electronics",
          stock: 30,
        },
      ]);
      console.log("🌱 Seeded 5 products");
    }

    app.listen(PORT, () => {
      console.log(`🚀 ${SERVICE_NAME} running on port ${PORT}`);
    });
  } catch (error) {
    console.log("Failed to start: ", error);
    process.exit(1);
  }
}

start();
