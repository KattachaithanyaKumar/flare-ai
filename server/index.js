import "dotenv/config";
import express from "express";
import cors from "cors";

import { requireAuth } from "./middleware/requireAuth.js";

const PORT = process.env.PORT ?? 3000;

const allowedOrigins = (process.env.CLIENT_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello world");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.user.sub,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

app.listen(PORT, () => {
  console.log(`server started with http://localhost:${PORT}`);
});
