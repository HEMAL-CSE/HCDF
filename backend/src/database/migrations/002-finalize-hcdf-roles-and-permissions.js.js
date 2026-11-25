
import { QueryTypes } from "sequelize";

const REMOVED_ROLES = [
  {
    code: "CE",
    name: "Content Editor",
    description: "Merged into Admin"
  },
  {
    code: "PM",
    name: "Programme Manager",
    description: "Merged into Admin"
  },
  {
    code: "SO",
    name: "Support Officer",
    description: "Merged into Admin"
  }
];

// Admin receives the operational permissions of CE, PM and SO,
// plus the administrative/review permissions defined for Admin.
const ADMIN_PERMISSION_CODES = [
  "users.view",
  "roles.view",
  "permissions.view",

  "membership.view",
  "membership.review",
  "membership.approve",

  "nid.view",
  "nid.review",

  "content.view",
  "content.manage",
  "content.publish",

  "programmes.view",
  "programmes.manage",

  "projects.view",
  "projects.manage",

  "notices.manage",
  "publications.manage",

  "contacts.view",
  "contacts.manage",

  "applications.view",
  "applications.review"
];

const getRows = async (sequelize, sql, transaction) => {
  return sequelize.query(sql, {
    type: QueryTypes.SELECT,
    transaction
  });
};

export async function up({ context: queryInterface }) {
  const sequelize = queryInterface.sequelize;

  await sequelize.transaction(async (transaction) => {
    // This migration is intentionally restricted to the initial
    // setup stage. Never silently move real user assignments.
    const counts = await getRows(
      sequelize,
      `
        SELECT
          (SELECT COUNT(*) FROM users) AS users_count,
          (SELECT COUNT(*) FROM user_roles) AS user_roles_count,
          (SELECT COUNT(*) FROM role_permissions) AS role_permissions_count
      `,
      transaction
    );

    const state = counts[0];

    if (
      Number(state.users_count) !== 0 ||
      Number(state.user_roles_count) !== 0 ||
      Number(state.role_permissions_count) !== 0
    ) {
      throw new Error(
        "Safety stop: users or role assignments already exist. " +
        "Review and migrate existing assignments manually before applying 002."
      );
    }

    const roles = await getRows(
      sequelize,
      "SELECT id, code FROM roles",
      transaction
    );

    const roleCodes = new Set(roles.map(role => role.code));

    const requiredRoles = ["SA", "AD", "MO", "FO", "AU", "MB", "CE", "PM", "SO"];

    for (const code of requiredRoles) {
      if (!roleCodes.has(code)) {
        throw new Error(`Required role is missing: ${code}`);
      }
    }

    const permissions = await getRows(
      sequelize,
      "SELECT id, code FROM permissions",
      transaction
    );

    const permissionMap = new Map(
      permissions.map(permission => [permission.code, permission.id])
    );

    const missingPermissions = ADMIN_PERMISSION_CODES.filter(
      code => !permissionMap.has(code)
    );

    if (missingPermissions.length > 0) {
      throw new Error(
        `Missing required permissions: ${missingPermissions.join(", ")}`
      );
    }

    const roleMap = new Map(
      roles.map(role => [role.code, role.id])
    );

    const now = new Date();

    // Super Admin receives every permission, including NID access.
    const superAdminMappings = permissions.map(permission => ({
      role_id: roleMap.get("SA"),
      permission_id: permission.id,
      created_at: now,
      updated_at: now
    }));

    // Admin receives the explicitly approved operational permissions.
    const adminMappings = ADMIN_PERMISSION_CODES.map(code => ({
      role_id: roleMap.get("AD"),
      permission_id: permissionMap.get(code),
      created_at: now,
      updated_at: now
    }));

    await queryInterface.bulkInsert(
      "role_permissions",
      [...superAdminMappings, ...adminMappings],
      { transaction }
    );

    // Remove the three merged roles.
    await queryInterface.bulkDelete(
      "roles",
      {
        code: ["CE", "PM", "SO"]
      },
      { transaction }
    );
  });
}

export async function down({ context: queryInterface }) {
  // Rollback to the initial 9-role state.
  // This rollback is intended for the initial setup stage,
  // before any users or role assignments are created.

  const sequelize = queryInterface.sequelize;

  const counts = await getRows(
    sequelize,
    `
      SELECT
        (SELECT COUNT(*) FROM users) AS users_count,
        (SELECT COUNT(*) FROM user_roles) AS user_roles_count
    `
  );

  if (
    Number(counts[0].users_count) !== 0 ||
    Number(counts[0].user_roles_count) !== 0
  ) {
    throw new Error(
      "Safety stop: do not rollback role configuration after users exist."
    );
  }

  // Remove role mappings created by this migration.
  await queryInterface.bulkDelete("role_permissions", null);

  // Restore the removed system roles.
  const now = new Date();

  await queryInterface.bulkInsert(
    "roles",
    REMOVED_ROLES.map(role => ({
      code: role.code,
      name: role.name,
      description: role.description,
      is_system: true,
      created_at: now,
      updated_at: now
    }))
  );
}
