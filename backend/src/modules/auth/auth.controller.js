import argon2 from "argon2";
import crypto from "node:crypto";
import { Op, QueryTypes } from "sequelize";
import sequelize from "../../config/database.js";
import { AuthSession, Role, User, UserRole } from "../../models/index.js";
import {
  clearRefreshCookie,
  createAccessToken,
  createRefreshToken,
  hashToken,
  refreshExpiryDate,
  setRefreshCookie,
  verifyRefreshToken
} from "../../utils/tokens.js";

const passwordOptions = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 };
const DUMMY_PASSWORD_HASH = "$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

async function getUserAccess(userId) {
  const user = await User.findByPk(userId, {
    attributes: ["id", "fullName", "email", "phone", "status"],
    include: [{ model: Role, as: "roles", attributes: ["code", "name"], through: { attributes: [] } }]
  });
  if (!user) return null;

  const permissionRows = await sequelize.query(
    `SELECT DISTINCT p.code
     FROM user_roles ur
     INNER JOIN role_permissions rp ON rp.role_id = ur.role_id
     INNER JOIN permissions p ON p.id = rp.permission_id
     WHERE ur.user_id = :userId`,
    { replacements: { userId }, type: QueryTypes.SELECT }
  );

  return {
    id: String(user.id),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    status: user.status,
    roles: (user.roles || []).map((role) => ({ code: role.code, name: role.name })),
    permissions: (permissionRows || []).map((item) => item.code)
  };
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function register(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const fullName = String(body.full_name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase() || null;
    const phone = String(body.phone ?? "").trim() || null;
    const password = String(body.password ?? "");

    if (!fullName || fullName.length > 150) {
      await transaction.rollback();
      return res.status(422).json({ success: false, message: "full_name is required and must not exceed 150 characters." });
    }
    if (!email && !phone) {
      await transaction.rollback();
      return res.status(422).json({ success: false, message: "Provide an email address or phone number." });
    }
    if (email && !validEmail(email)) {
      await transaction.rollback();
      return res.status(422).json({ success: false, message: "A valid email address is required." });
    }
    if (phone && phone.length > 30) {
      await transaction.rollback();
      return res.status(422).json({ success: false, message: "Phone number must not exceed 30 characters." });
    }
    if (password.length < 12 || password.length > 128) {
      await transaction.rollback();
      return res.status(422).json({ success: false, message: "Password must contain 12 to 128 characters." });
    }

    const duplicateConditions = [];
    if (email) duplicateConditions.push({ email });
    if (phone) duplicateConditions.push({ phone });

    const existing = await User.findOne({
      where: { [Op.or]: duplicateConditions },
      transaction
    });
    if (existing) {
      await transaction.rollback();
      return res.status(409).json({ success: false, message: "An account already exists with this email or phone." });
    }

    const memberRole = await Role.findOne({ where: { code: "MB" }, transaction });
    if (!memberRole) throw new Error("Required MB role is missing from roles table.");

    const passwordHash = await argon2.hash(password, passwordOptions);
    const user = await User.create({
      fullName,
      email,
      phone,
      passwordHash,
      status: "PENDING"
    }, { transaction });

    await UserRole.create({
      userId: user.id,
      roleId: memberRole.id,
      assignedAt: new Date()
    }, { transaction });

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: "Registration submitted. Your account is pending approval/activation.",
      data: { user_id: String(user.id), status: "PENDING", role: "MB" }
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    return next(error);
  }
}

export async function login(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const identifier = String(body.identifier ?? "").trim();
    const password = String(body.password ?? "");

    if (!identifier || !password) {
      await transaction.rollback();
      return res.status(422).json({ success: false, message: "identifier and password are required." });
    }

    const normalized = identifier.includes("@") ? identifier.toLowerCase() : identifier;
    const user = await User.findOne({
      where: { [Op.or]: [{ email: normalized }, { phone: identifier }] },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!user) {
      await transaction.rollback();
      await argon2.verify(DUMMY_PASSWORD_HASH, password).catch(() => false);
      return res.status(401).json({ success: false, code: "INVALID_CREDENTIALS", message: "Invalid login credentials." });
    }

    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
      await transaction.rollback();
      return res.status(423).json({ success: false, code: "LOGIN_TEMPORARILY_LOCKED", message: "Too many failed attempts. Try again later." });
    }

    const lockExpired = Boolean(user.lockedUntil && new Date(user.lockedUntil).getTime() <= Date.now());
    const currentAttempts = lockExpired ? 0 : Number(user.failedLoginAttempts || 0);

    const passwordMatches = await argon2.verify(user.passwordHash, password).catch(() => false);
    if (!passwordMatches) {
      const attempts = currentAttempts + 1;
      const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await user.update({ failedLoginAttempts: attempts, lockedUntil }, { transaction });
      await transaction.commit();
      return res.status(attempts >= 5 ? 423 : 401).json({
        success: false,
        code: attempts >= 5 ? "LOGIN_TEMPORARILY_LOCKED" : "INVALID_CREDENTIALS",
        message: attempts >= 5 ? "Too many failed attempts. Try again in 15 minutes." : "Invalid login credentials."
      });
    }

    if (user.status === "LOCKED") {
      await transaction.rollback();
      return res.status(423).json({ success: false, code: "ACCOUNT_LOCKED", message: "This account is locked. Contact an administrator." });
    }

    if (user.status !== "ACTIVE") {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_NOT_ACTIVE",
        message: "Your account is pending approval or is not active."
      });
    }

    await user.update({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date()
    }, { transaction });

    const session = await AuthSession.create({
      userId: user.id,
      tokenHash: crypto.randomBytes(32).toString("hex"),
      expiresAt: refreshExpiryDate(),
      revokedAt: null,
      userAgent: String(req.get("user-agent") || "").slice(0, 500) || null,
      ipAddress: req.ip || null
    }, { transaction });

    const refreshToken = createRefreshToken(user.id, session.id);
    await session.update({ tokenHash: hashToken(refreshToken) }, { transaction });
    await transaction.commit();

    const accessToken = createAccessToken(user.id, session.id);
    setRefreshCookie(res, refreshToken);

    const data = await getUserAccess(user.id);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: { access_token: accessToken, token_type: "Bearer", expires_in: process.env.JWT_ACCESS_TTL || "15m", user: data }
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    return next(error);
  }
}

export async function refresh(req, res) {
  const token = req.cookies?.hcdf_refresh;
  if (!token) {
    clearRefreshCookie(res);
    return res.status(401).json({ success: false, code: "REFRESH_TOKEN_REQUIRED", message: "Refresh session not found." });
  }

  const transaction = await sequelize.transaction();
  try {
    const payload = verifyRefreshToken(token);
    if (payload.typ !== "refresh" || !payload.sub || !payload.sid) {
      throw new Error("Invalid refresh token.");
    }

    const session = await AuthSession.findOne({
      where: { id: payload.sid, userId: payload.sub, revokedAt: null },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!session || new Date(session.expiresAt).getTime() <= Date.now() ||
        session.tokenHash !== hashToken(token)) {
      throw new Error("Refresh session is invalid or expired.");
    }

    const user = await User.findByPk(payload.sub, { transaction });
    if (!user || user.status !== "ACTIVE") {
      throw new Error("User is not active.");
    }

    const newRefreshToken = createRefreshToken(user.id, session.id);
    await session.update({
      tokenHash: hashToken(newRefreshToken),
      expiresAt: refreshExpiryDate(),
      userAgent: String(req.get("user-agent") || "").slice(0, 500) || null,
      ipAddress: req.ip || null
    }, { transaction });

    await transaction.commit();

    setRefreshCookie(res, newRefreshToken);
    const accessToken = createAccessToken(user.id, session.id);
    return res.status(200).json({
      success: true,
      data: { access_token: accessToken, token_type: "Bearer", expires_in: process.env.JWT_ACCESS_TTL || "15m" }
    });
  } catch {
    if (!transaction.finished) await transaction.rollback();
    clearRefreshCookie(res);
    return res.status(401).json({ success: false, code: "INVALID_REFRESH_SESSION", message: "Refresh session is invalid or expired. Please log in again." });
  }
}

export async function logout(req, res) {
  try {
    const token = req.cookies?.hcdf_refresh;
    if (token) {
      const payload = verifyRefreshToken(token);
      if (payload.typ === "refresh" && payload.sid && payload.sub) {
        await AuthSession.update(
          { revokedAt: new Date() },
          { where: { id: payload.sid, userId: payload.sub, revokedAt: null } }
        );
      }
    }
  } catch {
    // An invalid/expired cookie is still cleared below.
  }

  clearRefreshCookie(res);
  return res.status(200).json({ success: true, message: "Logout completed." });
}

export async function me(req, res, next) {
  try {
    const data = await getUserAccess(req.auth.userId);
    if (!data) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

