// ~/devshop/services/frontend/index.js

const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:3001";
const SERVICE_NAME = "frontend-service";

app.get("/health", (req, res) => {
  res.json({ service: SERVICE_NAME, status: "healthy" });
});

// Serve the main page
app.get("/", async (req, res) => {
  try {
    // Fetch products from API Gateway (server-side rendering)
    let products = [];
    try {
      const response = await fetch(`${API_GATEWAY_URL}/api/products`);
      products = await response.json();
    } catch (err) {
      console.error("Failed to fetch products:", err.message);
    }

    // Fetch orders
    let orders = [];
    try {
      const response = await fetch(`${API_GATEWAY_URL}/api/orders`);
      orders = await response.json();
    } catch (err) {
      console.error("Failed to fetch orders:", err.message);
    }

    // Render HTML
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>DevShop - Microservices Demo</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; }
          h1 { color: #38bdf8; margin-bottom: 10px; }
          h2 { color: #a78bfa; margin: 20px 0 10px; }
          .subtitle { color: #94a3b8; margin-bottom: 30px; }
          .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
          .card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; }
          .card h3 { color: #f1f5f9; margin-bottom: 8px; }
          .price { color: #4ade80; font-size: 1.3em; font-weight: bold; }
          .stock { color: #fbbf24; font-size: 0.9em; }
          .category { color: #94a3b8; font-size: 0.85em; background: #334155; padding: 2px 8px; border-radius: 4px; display: inline-block; }
          .status { padding: 4px 12px; border-radius: 20px; font-size: 0.85em; }
          .status-pending { background: #854d0e; color: #fbbf24; }
          .status-confirmed { background: #166534; color: #4ade80; }
          .architecture { background: #1e293b; border-radius: 12px; padding: 20px; margin-top: 30px; border: 1px solid #334155; }
          .architecture pre { color: #38bdf8; font-size: 0.85em; line-height: 1.5; }
          .pod-info { color: #94a3b8; font-size: 0.85em; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>🛒 DevShop</h1>
        <p class="subtitle">Microservices E-Commerce Platform | Powered by Kubernetes + Helm + CI/CD</p>

        <h2>📦 Products (${products.length})</h2>
        <div class="grid">
          ${products
            .map(
              (p) => `
            <div class="card">
              <h3>${p.name}</h3>
              <p>${p.description}</p>
              <span class="category">${p.category}</span>
              <p class="price">$${p.price}</p>
              <p class="stock">Stock: ${p.stock}</p>
            </div>
          `,
            )
            .join("")}
        </div>

        <h2>📋 Recent Orders (${orders.length})</h2>
        <div class="grid">
          ${orders.length === 0 ? '<p style="color:#94a3b8">No orders yet. Create one via the API!</p>' : ""}
          ${orders
            .map(
              (o) => `
            <div class="card">
              <h3>${o.customerName}</h3>
              <p>${o.customerEmail}</p>
              <p class="price">$${o.totalAmount}</p>
              <span class="status status-${o.status}">${o.status}</span>
              <p style="color:#94a3b8; font-size:0.85em; margin-top:8px">${o.items.length} item(s)</p>
            </div>
          `,
            )
            .join("")}
        </div>

        <div class="architecture">
          <h2>🏗️ Architecture</h2>
          <pre>
  User → Ingress → Frontend (this page)
                       ↓
                  API Gateway
                   ↓       ↓
            Products    Orders
            Service     Service
               ↓           ↓
            MongoDB     MongoDB
               ↓
             Redis (cache)
          </pre>
        </div>

        <p class="pod-info">
          Served by: ${process.env.HOSTNAME || "local"} |
          Environment: ${process.env.ENVIRONMENT || "development"}
        </p>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send(`<h1>Error</h1><pre>${err.message}</pre>`);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 ${SERVICE_NAME} running on port ${PORT}`);
  console.log(`   API Gateway → ${API_GATEWAY_URL}`);
});
