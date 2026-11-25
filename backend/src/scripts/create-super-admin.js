import "dotenv/config";
import argon2 from "argon2";
import { Op } from "sequelize";
import sequelize from "../config/database.js";
import { Role, User, UserRole } from "../models/index.js";

async function createSuperAdmin() {
  const enabled = process.env.BOOTSTRAP_ADMIN_ENABLED === "true";
  if (!enabled) throw new Error("Set BOOTSTRAP_ADMIN_ENABLED=true temporarily in backend .env.");

  const fullName = String(process.env.BOOTSTRAP_ADMIN_NAME || "").trim();
  const email = String(process.env.BOOTSTRAP_ADMIN_EMAIL || "").trim().toLowerCase();
  const phone = String(process.env.BOOTSTRAP_ADMIN_PHONE || "").trim() || null;
  const password = String(process.env.BOOTSTRAP_ADMIN_PASSWORD || "");

  if (!fullName || !email || password.length < 12) {
    throw new Error("BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL and a 12+ character BOOTSTRAP_ADMIN_PASSWORD are required.");
  }

  await sequelize.authenticate();

  const role = await Role.findOne({ where: { code: "SA" } });
  if (!role) throw new Error("SA role not found. Existing migrations must be verified.");

  const alreadyAssigned = await UserRole.findOne({ where: { roleId: role.id } });
  if (alreadyAssigned) throw new Error("A Super Admin is already assigned. Bootstrap stopped.");

  const duplicateConditions = [{ email }];
  if (phone) duplicateConditions.push({ phone });

  const duplicate = await User.findOne({ where: { [Op.or]: duplicateConditions } });
  if (duplicate) throw new Error("This email or phone already belongs to a user. Bootstrap will not change existing accounts.");

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1
  });

  const transaction = await sequelize.transaction();
  try {
    const user = await User.create({
      fullName,
      email,
      phone,
      passwordHash,
      status: "ACTIVE",
      emailVerifiedAt: new Date()
    }, { transaction });

    await UserRole.create({
      userId: user.id,
      roleId: role.id,
      assignedAt: new Date()
    }, { transaction });

    await transaction.commit();
    console.log(`Super Admin created successfully. User ID: ${user.id}`);
    console.log("Remove BOOTSTRAP_ADMIN_* values and set BOOTSTRAP_ADMIN_ENABLED=false in .env now.");
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    throw error;
  }
}

createSuperAdmin()
  .catch((error) => {
    console.error("Super Admin bootstrap failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });

