# 🛒 DevShop - Microservices E-Commerce Platform

A production-grade microservices application demonstrating modern DevOps practices with Docker, Kubernetes, Helm, and CI/CD.

## 🏗️ Architecture

                INTERNET
                   │
                   ▼
          ┌─────────────────┐
          │   INGRESS        │
          └────┬───────┬────┘
               │       │
      ┌────────┘       └────────┐
      ▼                         ▼

┌─────────┐ ┌─────────────┐
│FRONTEND │ │ API GATEWAY │
│(Node.js)│ │ (Node.js) │
└─────────┘ └──┬──────┬───┘
│ │
▼ ▼
┌────────┐ ┌────────┐
│PRODUCTS│ │ ORDERS │
│SERVICE │ │SERVICE │
└───┬────┘ └───┬────┘
│ │
▼ ▼
┌────────┐ ┌────────┐
│MongoDB │ │MongoDB │
└────────┘ └────────┘

                      ┌────────┐
                      │ Redis  │ (shared cache)
                      └────────┘

## 🚀 Services

| Service     | Port  | Description                            |
| ----------- | ----- | -------------------------------------- |
| frontend    | 3000  | Web UI (server-side rendered)          |
| api-gateway | 3001  | Single entry point, routes to services |
| products    | 3002  | Product catalog CRUD                   |
| orders      | 3003  | Order management                       |
| mongodb     | 27017 | Database                               |
| redis       | 6379  | Cache                                  |

## 🛠️ Tech Stack

- **Backend:** Node.js, Express, Mongoose
- **Databases:** MongoDB, Redis
- **Containers:** Docker, Docker Compose
- **Orchestration:** Kubernetes, Helm
- **CI/CD:** GitHub Actions
- **Registry:** GitHub Container Registry (GHCR)

## 🏃 Quick Start (Local)

```bash
# Start everything
docker compose up --build

# Access the app
open http://localhost:3000
```

## 📡 API Endpoints

### Products

- `GET  /api/products` - List all products
- `GET  /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT  /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders

- `GET  /api/orders` - List all orders
- `GET  /api/orders/:id` - Get single order
- `POST /api/orders` - Create order (verifies products exist)
- `PATCH /api/orders/:id/status` - Update order status

### Health

- `GET /health` - Service health (checks downstream services)

## 🧪 Test

```bash
# Create a product
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","price":99,"stock":10}'

# Create an order
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName":"John",
    "customerEmail":"john@test.com",
    "items":[{"productId":"PRODUCT_ID","quantity":1}]
  }'
```

## 🐳 Docker Images

Available on GitHub Container Registry:

```
ghcr.io/YOUR_USERNAME/devshop-frontend:latest
ghcr.io/YOUR_USERNAME/devshop-api-gateway:latest
ghcr.io/YOUR_USERNAME/devshop-products:latest
ghcr.io/YOUR_USERNAME/devshop-orders:latest
```

## 📝 License

MIT
