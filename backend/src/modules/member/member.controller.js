import { QueryTypes } from "sequelize";
import sequelize from "../../config/database.js";

function sendError(res, status, code, message) {
  return res.status(status).json({ success: false, code, message });
}

export async function getOwnProfile(req, res, next) {
  try {
    const userId = req.auth.userId;
    const rows = await sequelize.query(
      `SELECT id, full_name, email, phone, status, email_verified_at,
              phone_verified_at, last_login_at, created_at, updated_at
       FROM users
       WHERE id = :userId
       LIMIT 1`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );

    if (!rows.length) {
      return sendError(res, 404, "USER_NOT_FOUND", "User account not found.");
    }

    const user = rows[0];
    return res.json({
      success: true,
      data: {
        id: String(user.id),
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        email_verified_at: user.email_verified_at,
        phone_verified_at: user.phone_verified_at,
        last_login_at: user.last_login_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
        roles: req.auth.roles,
        permissions: req.auth.permissions
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateOwnProfile(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.auth.userId;
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const fullName = String(body.full_name ?? "").trim();
    const phone = String(body.phone ?? "").trim() || null;

    if (!fullName || fullName.length > 150) {
      await transaction.rollback();
      return sendError(res, 422, "INVALID_FULL_NAME", "full_name is required and must not exceed 150 characters.");
    }
    if (phone && phone.length > 30) {
      await transaction.rollback();
      return sendError(res, 422, "INVALID_PHONE", "Phone number must not exceed 30 characters.");
    }

    const currentRows = await sequelize.query(
      `SELECT id, email, phone FROM users WHERE id = :userId FOR UPDATE`,
      { replacements: { userId }, type: QueryTypes.SELECT, transaction }
    );
    if (!currentRows.length) {
      await transaction.rollback();
      return sendError(res, 404, "USER_NOT_FOUND", "User account not found.");
    }

    if (!currentRows[0].email && !phone) {
      await transaction.rollback();
      return sendError(res, 422, "CONTACT_REQUIRED", "Phone number cannot be removed when no email address is set.");
    }

    if (phone) {
      const duplicate = await sequelize.query(
        `SELECT id FROM users WHERE phone = :phone AND id <> :userId LIMIT 1`,
        { replacements: { phone, userId }, type: QueryTypes.SELECT, transaction }
      );
      if (duplicate.length) {
        await transaction.rollback();
        return sendError(res, 409, "PHONE_IN_USE", "This phone number is already associated with another account.");
      }
    }

    await sequelize.query(
      `UPDATE users
       SET full_name = :fullName, phone = :phone, updated_at = NOW()
       WHERE id = :userId`,
      { replacements: { userId, fullName, phone }, transaction }
    );

    const updatedRows = await sequelize.query(
      `SELECT id, full_name, email, phone, status, email_verified_at,
              phone_verified_at, last_login_at, created_at, updated_at
       FROM users
       WHERE id = :userId
       LIMIT 1`,
      { replacements: { userId }, type: QueryTypes.SELECT, transaction }
    );

    await transaction.commit();
    return res.json({
      success: true,
      message: "Profile updated successfully.",
      data: { ...updatedRows[0], id: String(updatedRows[0].id) }
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    return next(error);
  }
}
