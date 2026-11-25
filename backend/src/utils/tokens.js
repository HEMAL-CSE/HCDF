import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

if (!accessSecret || accessSecret.length < 32) {
  throw new Error("JWT_ACCESS_SECRET must be set and contain at least 32 characters.");
}
if (!refreshSecret || refreshSecret.length < 32) {
  throw new Error("JWT_REFRESH_SECRET must be set and contain at least 32 characters.");
}

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

function getRefreshDays() {
  const parsed = Number(process.env.JWT_REFRESH_DAYS || 7);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 7;
}

export function createAccessToken(userId, sessionId) {
  return jwt.sign(
    { typ: "access", sid: String(sessionId) },
    accessSecret,
    { subject: String(userId), expiresIn: process.env.JWT_ACCESS_TTL || "15m", issuer: "hcdf-api", audience: "hcdf-client" }
  );
}

export function createRefreshToken(userId, sessionId) {
  const days = getRefreshDays();
  return jwt.sign(
    { typ: "refresh", sid: String(sessionId) },
    refreshSecret,
    { subject: String(userId), expiresIn: `${days}d`, issuer: "hcdf-api", audience: "hcdf-client" }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, accessSecret, { issuer: "hcdf-api", audience: "hcdf-client" });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, refreshSecret, { issuer: "hcdf-api", audience: "hcdf-client" });
}

export function refreshExpiryDate() {
  const days = getRefreshDays();
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function setRefreshCookie(res, token) {
  const days = getRefreshDays();
  res.cookie("hcdf_refresh", token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: days * 24 * 60 * 60 * 1000
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie("hcdf_refresh", {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/api/v1/auth"
  });
}

