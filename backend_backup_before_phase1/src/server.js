
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import { connectDatabase } from "./config/database.js";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 5000;

// Security headers
app.use(helmet());

// CORS configuration for development
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
  })
);

// Request logging
app.use(morgan("dev"));

// Request body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Root API
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to HCDF Backend API Sucessfully",
    version: "1.0.0"
  });
});

// Health check
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    application: "HCDF Backend",
    apiStatus: "Running",
    databaseStatus: "Connected"
  });
});

// Not found handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found"
  });
});

// Start server only after database connection
const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`HCDF Server running at http://localhost:${PORT}`);
      console.log(`Health API: http://localhost:${PORT}/api/v1/health`);
    });

  } catch (error) {
    console.error("Unable to start HCDF server.");
    process.exit(1);
  }
};

startServer();

