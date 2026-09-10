const express = require("express");
const request = require("supertest");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    service: "api-gateway",
    status: "healthy",
  });
});

describe("Products Service", () => {
  test("GET /health return 200", async () => {
    const res = await request(app).get("/health");

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("healthy");
  });
});
