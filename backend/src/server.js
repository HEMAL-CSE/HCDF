import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import sequelize, { connectDatabase } from "./config/database.js";
import authRoutes from "./modules/auth/auth.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";

const app = express();
const parsedPort = Number(process.env.PORT || 5001);
const PORT = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 5001;

const allowedOrigins = (process.env.FRONTEND_URLS || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"]
}));
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "HCDF Backend API",
    version: "1.0.0"
  });
});

app.get("/api/v1/health", async (_req, res) => {
  try {
    await sequelize.authenticate();
    return res.status(200).json({
      success: true,
      application: "HCDF Backend",
      apiStatus: "Running",
      databaseStatus: "Connected"
    });
  } catch {
    return res.status(503).json({
      success: false,
      application: "HCDF Backend",
      apiStatus: "Running",
      databaseStatus: "Disconnected"
    });
  }
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    code: "NOT_FOUND",
    message: "API endpoint not found."
  });
});

app.use((error, _req, res, _next) => {
  if (error.message === "Origin is not allowed by CORS.") {
    return res.status(403).json({ success: false, message: error.message });
  }
  if (error.type === "entity.parse.failed" || (error instanceof SyntaxError && error.status === 400)) {
    return res.status(400).json({
      success: false,
      code: "INVALID_JSON",
      message: "Malformed JSON request body."
    });
  }
  console.error("Unhandled API error:", error);
  return res.status(500).json({
    success: false,
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected server error occurred."
  });
});

const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`HCDF Server running at http://localhost:${PORT}`);
      console.log(`Health API: http://localhost:${PORT}/api/v1/health`);
      console.log(`Auth API: http://localhost:${PORT}/api/v1/auth`);
    });
  } catch (error) {
    console.error("Unable to start HCDF server:", error.message);
    process.exit(1);
  }
};

startServer();
