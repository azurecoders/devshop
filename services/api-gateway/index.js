const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3001;
const PRODUCTS_URL =
  process.env.PRODUCTS_SERVICE_URL || "http://localhost:3002";
const ORDERS_URL = process.env.ORDERS_SERVICE_URL || "http://localhost:3003";
const SERVICE_NAME = "api-gateway";

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`,
    );
  });
  next();
});

app.get("/health", async (req, res) => {
  // Check all downstream services
  const checks = {};

  try {
    const r = await fetch(`${PRODUCTS_URL}/health`);
    checks.products = r.ok ? "healthy" : "unhealthy";
  } catch {
    checks.products = "unreachable";
  }

  try {
    const r = await fetch(`${ORDERS_URL}/health`);
    checks.orders = r.ok ? "healthy" : "unhealthy";
  } catch {
    checks.orders = "unreachable";
  }

  res.json({
    service: SERVICE_NAME,
    status: "healthy",
    downstream: checks,
    timestamp: new Date().toISOString(),
  });
});

app.use(
  createProxyMiddleware({
    target: PRODUCTS_URL,
    changeOrigin: true,
    pathFilter: "/api/products",
    pathRewrite: {
      "^/api/products": "/products",
    },
  }),
);

// ─── ORDERS ───
app.use(
  createProxyMiddleware({
    target: ORDERS_URL,
    changeOrigin: true,
    pathFilter: "/api/orders",
    pathRewrite: {
      "^/api/orders": "/orders",
    },
  }),
);

// ─── CATCH-ALL ───
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `No service handles ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      "GET  /health",
      "GET  /api/products",
      "POST /api/products",
      "GET  /api/products/:id",
      "GET  /api/orders",
      "POST /api/orders",
      "GET  /api/orders/:id",
    ],
  });
});

// ─── START ───
async function start() {
  app.listen(PORT, () => {
    console.log(`🚀 ${SERVICE_NAME} running on port ${PORT}`);
    console.log(`   Products → ${PRODUCTS_URL}`);
    console.log(`   Orders   → ${ORDERS_URL}`);
  });
}

start();
