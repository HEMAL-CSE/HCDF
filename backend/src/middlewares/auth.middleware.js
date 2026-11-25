import { QueryTypes } from "sequelize";
import sequelize from "../config/database.js";
import { verifyAccessToken } from "../utils/tokens.js";

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        code: "AUTHENTICATION_REQUIRED",
        message: "A valid access token is required."
      });
    }

    const payload = verifyAccessToken(token);
    if (payload.typ !== "access" || !payload.sub || !payload.sid) {
      return res.status(401).json({ success: false, code: "INVALID_ACCESS_TOKEN", message: "Invalid access token." });
    }

    const sessions = await sequelize.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.status, s.id AS session_id
       FROM auth_sessions s
       INNER JOIN users u ON u.id = s.user_id
       WHERE s.id = :sessionId
         AND s.user_id = :userId
         AND s.revoked_at IS NULL
         AND s.expires_at > NOW()
         AND u.status = 'ACTIVE'
       LIMIT 1`,
      {
        replacements: { sessionId: payload.sid, userId: payload.sub },
        type: QueryTypes.SELECT
      }
    );

    if (!sessions.length) {
      return res.status(401).json({ success: false, code: "SESSION_EXPIRED", message: "Session is no longer active." });
    }

    const [roles, permissions] = await Promise.all([
      sequelize.query(
        `SELECT r.code, r.name
         FROM user_roles ur
         INNER JOIN roles r ON r.id = ur.role_id
         WHERE ur.user_id = :userId`,
        { replacements: { userId: payload.sub }, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT DISTINCT p.code
         FROM user_roles ur
         INNER JOIN role_permissions rp ON rp.role_id = ur.role_id
         INNER JOIN permissions p ON p.id = rp.permission_id
         WHERE ur.user_id = :userId`,
        { replacements: { userId: payload.sub }, type: QueryTypes.SELECT }
      )
    ]);

    req.auth = {
      userId: String(payload.sub),
      sessionId: String(payload.sid),
      user: sessions[0],
      roles: roles.map((role) => role.code),
      permissions: permissions.map((permission) => permission.code)
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      code: "INVALID_OR_EXPIRED_TOKEN",
      message: "Authentication failed."
    });
  }
}

export function requirePermission(permissionCode) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ success: false, code: "AUTHENTICATION_REQUIRED", message: "Login required." });
    }

    if (!req.auth.permissions.includes(permissionCode)) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "You do not have permission to perform this action."
      });
    }

    return next();
  };
}

export function requireAnyRole(...roleCodes) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ success: false, code: "AUTHENTICATION_REQUIRED", message: "Login required." });
    }
    if (!roleCodes.some((code) => req.auth.roles.includes(code))) {
      return res.status(403).json({ success: false, code: "FORBIDDEN", message: "Your role cannot access this resource." });
    }
    return next();
  };
}

