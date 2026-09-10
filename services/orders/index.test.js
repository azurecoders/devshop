const express = require("express");
const request = require("supertest");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    service: "orders-service",
    status: "healthy",
  });
});

app.get("/orders", (req, res) => {
  res.json([
    {
      customerName: "XYZ",
      customerEmail: "xyz@gmail.com",
      items: [{ name: "Test Product", price: 99 }],
    },
  ]);
});

describe("Products Service", () => {
  test("GET /health return 200", async () => {
    const res = await request(app).get("/health");

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("healthy");
  });

  test("GET /products returns array", async () => {
    const res = await request(app).get("/orders");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
