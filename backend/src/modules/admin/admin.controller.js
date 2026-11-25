import { QueryTypes } from "sequelize";
import sequelize from "../../config/database.js";

const allowedStatuses = new Set(["PENDING", "ACTIVE", "SUSPENDED", "LOCKED"]);
const MAX_UINT64 = 18446744073709551615n;

function parseId(value) {
  const id = String(value ?? "").trim();
  if (!/^\d+$/.test(id)) return null;
  const parsed = BigInt(id);
  return parsed >= 1n && parsed <= MAX_UINT64 ? id : null;
}

function parseIdArray(value) {
  if (!Array.isArray(value)) return null;
  const ids = [...new Set(value.map((item) => String(item ?? "").trim()))];
  if (ids.some((id) => !/^\d+$/.test(id) || BigInt(id) < 1n || BigInt(id) > MAX_UINT64)) return null;
  return ids;
}

function sendError(res, status, code, message) {
  return res.status(status).json({ success: false, code, message });
}

export async function dashboardSummary(req, res, next) {
  try {
    const rows = await sequelize.query(
      `SELECT
         COUNT(*) AS total_users,
         SUM(status = 'ACTIVE') AS active_users,
         SUM(status = 'PENDING') AS pending_users,
         SUM(status = 'SUSPENDED') AS suspended_users,
         SUM(status = 'LOCKED') AS locked_users
       FROM users`,
      { type: QueryTypes.SELECT }
    );
    const roleRows = await sequelize.query(
      `SELECT r.code, r.name, COUNT(DISTINCT ur.user_id) AS user_count
       FROM roles r
       LEFT JOIN user_roles ur ON ur.role_id = r.id
       GROUP BY r.id, r.code, r.name
       ORDER BY r.id`,
      { type: QueryTypes.SELECT }
    );
    return res.json({
      success: true,
      data: {
        users: Object.fromEntries(
          Object.entries(rows[0] || {}).map(([key, value]) => [key, Number(value || 0)])
        ),
        role_distribution: roleRows.map((row) => ({
          code: row.code, name: row.name, user_count: Number(row.user_count || 0)
        }))
      }
    });
  } catch (error) { return next(error); }
}

export async function listUsers(req, res, next) {
  try {
    const page = Math.max(1, Math.min(100000, Number.parseInt(req.query.page, 10) || 1));
    const limit = Math.max(1, Math.min(100, Number.parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const status = req.query.status ? String(req.query.status).toUpperCase() : "";
    const q = String(req.query.q || "").trim().slice(0, 150);

    if (status && !allowedStatuses.has(status)) {
      return sendError(res, 422, "INVALID_STATUS_FILTER", "Unsupported user status filter.");
    }

    const conditions = [];
    const replacements = { limit, offset };
    if (status) { conditions.push("u.status = :status"); replacements.status = status; }
    if (q) {
      const escapedQ = q.replace(/[\\%_]/g, "\\$&");
      conditions.push("(u.full_name LIKE :q ESCAPE '\\\\' OR u.email LIKE :q ESCAPE '\\\\' OR u.phone LIKE :q ESCAPE '\\\\')");
      replacements.q = `%${escapedQ}%`;
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRows = await sequelize.query(
      `SELECT COUNT(*) AS total FROM users u ${where}`,
      { replacements, type: QueryTypes.SELECT }
    );
    const users = await sequelize.query(
      `SELECT
         u.id, u.full_name, u.email, u.phone, u.status,
         u.email_verified_at, u.phone_verified_at, u.last_login_at,
         u.failed_login_attempts, u.locked_until, u.created_at, u.updated_at,
         GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ',') AS role_codes,
         GROUP_CONCAT(DISTINCT r.name ORDER BY r.code SEPARATOR ' | ') AS role_names
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       ${where}
       GROUP BY u.id
       ORDER BY u.created_at DESC, u.id DESC
       LIMIT :limit OFFSET :offset`,
      { replacements, type: QueryTypes.SELECT }
    );

    return res.json({
      success: true,
      data: {
        items: users.map((user) => ({
          ...user,
          id: String(user.id),
          failed_login_attempts: Number(user.failed_login_attempts || 0),
          role_codes: user.role_codes ? user.role_codes.split(",") : [],
          role_names: user.role_names ? user.role_names.split(" | ") : []
        })),
        pagination: {
          page, limit, total: Number(countRows[0]?.total || 0),
          total_pages: Math.ceil(Number(countRows[0]?.total || 0) / limit)
        }
      }
    });
  } catch (error) { return next(error); }
}

export async function getUser(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return sendError(res, 422, "INVALID_USER_ID", "User ID must be a positive integer.");

    const rows = await sequelize.query(
      `SELECT id, full_name, email, phone, status, email_verified_at,
              phone_verified_at, last_login_at, failed_login_attempts,
              locked_until, created_at, updated_at
       FROM users WHERE id = :id LIMIT 1`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );
    if (!rows.length) return sendError(res, 404, "USER_NOT_FOUND", "User was not found.");

    const roles = await sequelize.query(
      `SELECT r.id, r.code, r.name, r.description, r.is_system, ur.assigned_at
       FROM user_roles ur INNER JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = :id ORDER BY r.id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );
    return res.json({ success: true, data: { ...rows[0], id: String(rows[0].id), roles } });
  } catch (error) { return next(error); }
}

export async function updateUserStatus(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const id = parseId(req.params.id);
    const status = String(body.status ?? "").toUpperCase();
    if (!id) { await transaction.rollback(); return sendError(res, 422, "INVALID_USER_ID", "Invalid user ID."); }
    if (!allowedStatuses.has(status)) {
      await transaction.rollback();
      return sendError(res, 422, "INVALID_STATUS", "Status must be PENDING, ACTIVE, SUSPENDED or LOCKED.");
    }
    if (String(req.auth.userId) === id) {
      await transaction.rollback();
      return sendError(res, 409, "SELF_STATUS_CHANGE_BLOCKED", "You cannot change your own account status.");
    }

    const target = await sequelize.query(
      `SELECT id, status FROM users WHERE id = :id FOR UPDATE`,
      { replacements: { id }, type: QueryTypes.SELECT, transaction }
    );
    if (!target.length) { await transaction.rollback(); return sendError(res, 404, "USER_NOT_FOUND", "User was not found."); }

    const targetRoles = await sequelize.query(
      `SELECT r.code FROM user_roles ur INNER JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT, transaction }
    );
    const isSuperAdmin = targetRoles.some((role) => role.code === "SA");
    if (isSuperAdmin && target[0].status === "ACTIVE" && status !== "ACTIVE") {
      const activeAdmins = await sequelize.query(
        `SELECT COUNT(DISTINCT u.id) AS total
         FROM users u
         INNER JOIN user_roles ur ON ur.user_id = u.id
         INNER JOIN roles r ON r.id = ur.role_id
         WHERE r.code = 'SA' AND u.status = 'ACTIVE' AND u.id <> :id`,
        { replacements: { id }, type: QueryTypes.SELECT, transaction }
      );
      if (Number(activeAdmins[0]?.total || 0) < 1) {
        await transaction.rollback();
        return sendError(res, 409, "LAST_ACTIVE_SUPER_ADMIN", "The last active Super Admin cannot be deactivated.");
      }
    }

    await sequelize.query(
      `UPDATE users SET status = :status,
         failed_login_attempts = CASE WHEN :status = 'ACTIVE' THEN 0 ELSE failed_login_attempts END,
         locked_until = CASE WHEN :status = 'ACTIVE' THEN NULL ELSE locked_until END,
         updated_at = NOW()
       WHERE id = :id`,
      { replacements: { id, status }, transaction }
    );
    if (status !== "ACTIVE") {
      await sequelize.query(
        `UPDATE auth_sessions SET revoked_at = NOW(), updated_at = NOW()
         WHERE user_id = :id AND revoked_at IS NULL`,
        { replacements: { id }, transaction }
      );
    }
    await transaction.commit();
    return res.json({ success: true, message: "User status updated.", data: { user_id: id, status } });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    return next(error);
  }
}

export async function getUserRoles(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return sendError(res, 422, "INVALID_USER_ID", "Invalid user ID.");
    const exists = await sequelize.query("SELECT id FROM users WHERE id = :id", {
      replacements: { id }, type: QueryTypes.SELECT
    });
    if (!exists.length) return sendError(res, 404, "USER_NOT_FOUND", "User was not found.");
    const roles = await sequelize.query(
      `SELECT r.id, r.code, r.name, r.description, ur.assigned_at
       FROM user_roles ur INNER JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = :id ORDER BY r.id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );
    return res.json({ success: true, data: roles });
  } catch (error) { return next(error); }
}

export async function replaceUserRoles(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const id = parseId(req.params.id);
    const roleIds = parseIdArray(body.role_ids);
    if (!id) { await transaction.rollback(); return sendError(res, 422, "INVALID_USER_ID", "Invalid user ID."); }
    if (!roleIds) { await transaction.rollback(); return sendError(res, 422, "INVALID_ROLE_IDS", "role_ids must be an array of positive integer IDs."); }
    if (String(req.auth.userId) === id) {
      await transaction.rollback();
      return sendError(res, 409, "SELF_ROLE_CHANGE_BLOCKED", "You cannot change your own role assignments.");
    }

    const userRows = await sequelize.query("SELECT id FROM users WHERE id = :id FOR UPDATE", {
      replacements: { id }, type: QueryTypes.SELECT, transaction
    });
    if (!userRows.length) { await transaction.rollback(); return sendError(res, 404, "USER_NOT_FOUND", "User was not found."); }

    const roles = roleIds.length ? await sequelize.query(
      `SELECT id, code FROM roles WHERE id IN (${roleIds.map((_, i) => `:role${i}`).join(",")})`,
      { replacements: Object.fromEntries(roleIds.map((value, i) => [`role${i}`, value])), type: QueryTypes.SELECT, transaction }
    ) : [];
    if (roles.length !== roleIds.length) {
      await transaction.rollback();
      return sendError(res, 422, "UNKNOWN_ROLE", "One or more role IDs do not exist.");
    }

    const currentRoles = await sequelize.query(
      `SELECT r.code FROM user_roles ur INNER JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT, transaction }
    );
    const currentlySA = currentRoles.some((role) => role.code === "SA");
    const willBeSA = roles.some((role) => role.code === "SA");
    if (currentlySA && !willBeSA) {
      const targetStatus = await sequelize.query("SELECT status FROM users WHERE id = :id", {
        replacements: { id }, type: QueryTypes.SELECT, transaction
      });
      if (targetStatus[0]?.status === "ACTIVE") {
        const otherActiveSAs = await sequelize.query(
          `SELECT COUNT(DISTINCT u.id) AS total
           FROM users u INNER JOIN user_roles ur ON ur.user_id = u.id
           INNER JOIN roles r ON r.id = ur.role_id
           WHERE r.code = 'SA' AND u.status = 'ACTIVE' AND u.id <> :id`,
          { replacements: { id }, type: QueryTypes.SELECT, transaction }
        );
        if (Number(otherActiveSAs[0]?.total || 0) < 1) {
          await transaction.rollback();
          return sendError(res, 409, "LAST_ACTIVE_SUPER_ADMIN", "The last active Super Admin role cannot be removed.");
        }
      }
    }

    await sequelize.query("DELETE FROM user_roles WHERE user_id = :id", {
      replacements: { id }, transaction
    });
    for (const role of roles) {
      await sequelize.query(
        `INSERT INTO user_roles (user_id, role_id, assigned_at, created_at, updated_at)
         VALUES (:id, :roleId, NOW(), NOW(), NOW())`,
        { replacements: { id, roleId: role.id }, transaction }
      );
    }
    await transaction.commit();
    return res.json({ success: true, message: "User role assignments replaced.", data: { user_id: id, roles } });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    return next(error);
  }
}

export async function listPendingMembers(req, res, next) {
  try {
    const page = Math.max(1, Math.min(100000, Number.parseInt(req.query.page, 10) || 1));
    const limit = Math.max(1, Math.min(100, Number.parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const q = String(req.query.q || "").trim().slice(0, 150);

    const conditions = ["u.status = 'PENDING'"];
    const replacements = { limit, offset };
    if (q) {
      const escapedQ = q.replace(/[\\%_]/g, "\\$&");
      conditions.push("(u.full_name LIKE :q ESCAPE '\\\\' OR u.email LIKE :q ESCAPE '\\\\' OR u.phone LIKE :q ESCAPE '\\\\')");
      replacements.q = `%${escapedQ}%`;
    }
    const where = `WHERE ${conditions.join(" AND ")}`;

    const countRows = await sequelize.query(
      `SELECT COUNT(*) AS total FROM users u ${where}`,
      { replacements, type: QueryTypes.SELECT }
    );
    const members = await sequelize.query(
      `SELECT
         u.id, u.full_name, u.email, u.phone, u.status, u.created_at,
         GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ',') AS role_codes,
         GROUP_CONCAT(DISTINCT r.name ORDER BY r.code SEPARATOR ' | ') AS role_names
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       ${where}
       GROUP BY u.id
       ORDER BY u.created_at ASC, u.id ASC
       LIMIT :limit OFFSET :offset`,
      { replacements, type: QueryTypes.SELECT }
    );

    return res.json({
      success: true,
      data: {
        items: members.map((m) => ({
          ...m,
          id: String(m.id),
          role_codes: m.role_codes ? m.role_codes.split(",") : [],
          role_names: m.role_names ? m.role_names.split(" | ") : []
        })),
        pagination: {
          page, limit, total: Number(countRows[0]?.total || 0),
          total_pages: Math.ceil(Number(countRows[0]?.total || 0) / limit)
        }
      }
    });
  } catch (error) { return next(error); }
}

export async function approveMember(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const id = parseId(req.params.id);
    if (!id) { await transaction.rollback(); return sendError(res, 422, "INVALID_USER_ID", "Invalid user ID."); }
    if (String(req.auth.userId) === id) {
      await transaction.rollback();
      return sendError(res, 409, "SELF_APPROVAL_BLOCKED", "You cannot approve your own account.");
    }

    const target = await sequelize.query(
      `SELECT id, status, full_name, email FROM users WHERE id = :id FOR UPDATE`,
      { replacements: { id }, type: QueryTypes.SELECT, transaction }
    );
    if (!target.length) { await transaction.rollback(); return sendError(res, 404, "USER_NOT_FOUND", "User was not found."); }
    if (target[0].status !== "PENDING") {
      await transaction.rollback();
      return sendError(res, 409, "NOT_PENDING", "Only accounts with PENDING status can be approved.");
    }

    await sequelize.query(
      `UPDATE users SET status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE id = :id`,
      { replacements: { id }, transaction }
    );
    await transaction.commit();

    return res.json({
      success: true,
      message: "Member account approved and activated.",
      data: { user_id: id, full_name: target[0].full_name, status: "ACTIVE" }
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    return next(error);
  }
}

export async function rejectMember(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const id = parseId(req.params.id);
    const reason = String(body.reason ?? "").trim().slice(0, 500) || null;
    if (!id) { await transaction.rollback(); return sendError(res, 422, "INVALID_USER_ID", "Invalid user ID."); }
    if (String(req.auth.userId) === id) {
      await transaction.rollback();
      return sendError(res, 409, "SELF_REJECTION_BLOCKED", "You cannot reject your own account.");
    }

    const target = await sequelize.query(
      `SELECT id, status, full_name FROM users WHERE id = :id FOR UPDATE`,
      { replacements: { id }, type: QueryTypes.SELECT, transaction }
    );
    if (!target.length) { await transaction.rollback(); return sendError(res, 404, "USER_NOT_FOUND", "User was not found."); }
    if (target[0].status !== "PENDING") {
      await transaction.rollback();
      return sendError(res, 409, "NOT_PENDING", "Only accounts with PENDING status can be rejected.");
    }

    await sequelize.query(
      `UPDATE users SET status = 'SUSPENDED', updated_at = NOW() WHERE id = :id`,
      { replacements: { id }, transaction }
    );
    await sequelize.query(
      `UPDATE auth_sessions SET revoked_at = NOW(), updated_at = NOW()
       WHERE user_id = :id AND revoked_at IS NULL`,
      { replacements: { id }, transaction }
    );
    await transaction.commit();

    return res.json({
      success: true,
      message: "Member application rejected.",
      data: { user_id: id, full_name: target[0].full_name, status: "SUSPENDED", reason }
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    return next(error);
  }
}

export async function listRoles(req, res, next) {
  try {
    const roles = await sequelize.query(
      `SELECT r.id, r.code, r.name, r.description, r.is_system,
              COUNT(DISTINCT ur.user_id) AS user_count,
              COUNT(DISTINCT rp.permission_id) AS permission_count
       FROM roles r
       LEFT JOIN user_roles ur ON ur.role_id = r.id
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       GROUP BY r.id ORDER BY r.id`,
      { type: QueryTypes.SELECT }
    );
    return res.json({ success: true, data: roles });
  } catch (error) { return next(error); }
}

export async function listPermissions(req, res, next) {
  try {
    const permissions = await sequelize.query(
      `SELECT id, code, name, module, description FROM permissions ORDER BY module, id`,
      { type: QueryTypes.SELECT }
    );
    return res.json({ success: true, data: permissions });
  } catch (error) { return next(error); }
}

export async function getRolePermissions(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return sendError(res, 422, "INVALID_ROLE_ID", "Invalid role ID.");
    const roleRows = await sequelize.query(
      "SELECT id, code, name, is_system FROM roles WHERE id = :id",
      { replacements: { id }, type: QueryTypes.SELECT }
    );
    if (!roleRows.length) return sendError(res, 404, "ROLE_NOT_FOUND", "Role was not found.");
    const permissions = await sequelize.query(
      `SELECT p.id, p.code, p.name, p.module, p.description
       FROM role_permissions rp INNER JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = :id ORDER BY p.module, p.id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );
    return res.json({ success: true, data: { role: roleRows[0], permissions } });
  } catch (error) { return next(error); }
}

export async function replaceRolePermissions(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const id = parseId(req.params.id);
    const permissionIds = parseIdArray(body.permission_ids);
    if (!id) { await transaction.rollback(); return sendError(res, 422, "INVALID_ROLE_ID", "Invalid role ID."); }
    if (!permissionIds) { await transaction.rollback(); return sendError(res, 422, "INVALID_PERMISSION_IDS", "permission_ids must be an array of positive integer IDs."); }

    const roleRows = await sequelize.query(
      "SELECT id, code FROM roles WHERE id = :id FOR UPDATE",
      { replacements: { id }, type: QueryTypes.SELECT, transaction }
    );
    if (!roleRows.length) { await transaction.rollback(); return sendError(res, 404, "ROLE_NOT_FOUND", "Role was not found."); }
    if (roleRows[0].code === "SA") {
      await transaction.rollback();
      return sendError(res, 409, "SYSTEM_SUPER_ADMIN_PROTECTED", "The Super Admin permission set is protected from replacement.");
    }

    const permissions = permissionIds.length ? await sequelize.query(
      `SELECT id, code FROM permissions WHERE id IN (${permissionIds.map((_, i) => `:permission${i}`).join(",")})`,
      { replacements: Object.fromEntries(permissionIds.map((value, i) => [`permission${i}`, value])), type: QueryTypes.SELECT, transaction }
    ) : [];
    if (permissions.length !== permissionIds.length) {
      await transaction.rollback();
      return sendError(res, 422, "UNKNOWN_PERMISSION", "One or more permission IDs do not exist.");
    }

    await sequelize.query("DELETE FROM role_permissions WHERE role_id = :id", {
      replacements: { id }, transaction
    });
    for (const permission of permissions) {
      await sequelize.query(
        `INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
         VALUES (:id, :permissionId, NOW(), NOW())`,
        { replacements: { id, permissionId: permission.id }, transaction }
      );
    }
    await transaction.commit();
    return res.json({ success: true, message: "Role permissions replaced.", data: { role_id: id, permissions } });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    return next(error);
  }
}
