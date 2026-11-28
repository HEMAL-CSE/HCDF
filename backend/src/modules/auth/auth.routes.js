import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, logout, me, refresh, register } from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

const isProduction = process.env.NODE_ENV === "production";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProduction ? 10 : 1000,
  skip: () => !isProduction,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: "TOO_MANY_REQUESTS",
    message: "Too many authentication requests. Please try again later."
  }
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProduction ? 60 : 1000,
  skip: () => !isProduction,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: "TOO_MANY_REQUESTS",
    message: "Too many session refresh requests. Please try again later."
  }
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh", refreshLimiter, refresh);
router.post("/logout", logout);
router.get("/me", authenticate, me);

export default router;
