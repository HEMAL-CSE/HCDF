import { QueryTypes } from "sequelize";

const PERMISSIONS = [
  {
    code: "payment_gateway.settings.view",
    name: "View payment gateway settings",
    module: "payment_gateway"
  },
  {
    code: "reports.view",
    name: "View authorised reports",
    module: "reports"
  }
];

const ROLE_PERMISSION_MAP = {
  // Admin: existing 21 permissions plus these two.
  AD: [
    "audit.view",
    "payment_gateway.settings.view"
  ],

  // Membership Officer
  MO: [
    "membership.view",
    "membership.review",
    "membership.approve",
    "nid.view",
    "nid.review"
  ],

  // Finance Officer
  FO: [
    "donations.view",
    "donations.verify",
    "donations.refund",
    "finance.view",
    "finance.reconcile"
  ],

  // Auditor: read-only permissions
  AU: [
    "audit.view",
    "reports.view",
    "finance.view",
    "donations.view"
  ],

  // Member: own records only
  MB: [
    "profile.view_own",
    "profile.update_own",
    "donations.view_own",
    "receipts.view_own"
  ]
};

async function getRows(sequelize, sql, transaction) {
  return sequelize.query(sql, {
    type: QueryTypes.SELECT,
    transaction
  });
}

export async function up({ context: queryInterface }) {
  const sequelize = queryInterface.sequelize;

  await sequelize.transaction(async transaction => {
    const roles = await getRows(
      sequelize,
      "SELECT id, code FROM roles",
      transaction
    );

    const roleMap = new Map(
      roles.map(role => [role.code, role.id])
    );

    const expectedRoles = ["SA", "AD", "MO", "FO", "AU", "MB"];

    for (const code of expectedRoles) {
      if (!roleMap.has(code)) {
        throw new Error(`Required role not found: ${code}`);
      }
    }

    // Add the two new permissions if they do not already exist.
    const existingPermissions = await getRows(
      sequelize,
      "SELECT id, code FROM permissions",
      transaction
    );

    const existingCodes = new Set(
      existingPermissions.map(item => item.code)
    );

    const now = new Date();

    const missingPermissions = PERMISSIONS
      .filter(item => !existingCodes.has(item.code))
      .map(item => ({
        ...item,
        description: null,
        created_at: now,
        updated_at: now
      }));

    if (missingPermissions.length > 0) {
      await queryInterface.bulkInsert(
        "permissions",
        missingPermissions,
        { transaction }
      );
    }

    // Reload permission catalogue.
    const allPermissions = await getRows(
      sequelize,
      "SELECT id, code FROM permissions",
      transaction
    );

    const permissionMap = new Map(
      allPermissions.map(item => [item.code, item.id])
    );

    // Super Admin receives every permission.
    const superAdminId = roleMap.get("SA");

    const existingSuperAdminMappings = await getRows(
      sequelize,
      `
        SELECT permission_id
        FROM role_permissions
        WHERE role_id = ${Number(superAdminId)}
      `,
      transaction
    );

    const superAdminPermissionIds = new Set(
      existingSuperAdminMappings.map(item => Number(item.permission_id))
    );

    const superAdminRows = allPermissions
      .filter(item => !superAdminPermissionIds.has(Number(item.id)))
      .map(item => ({
        role_id: superAdminId,
        permission_id: item.id,
        created_at: now,
        updated_at: now
      }));

    if (superAdminRows.length > 0) {
      await queryInterface.bulkInsert(
        "role_permissions",
        superAdminRows,
        { transaction }
      );
    }

    // Assign each role's approved permissions.
    for (const [roleCode, permissionCodes] of Object.entries(
      ROLE_PERMISSION_MAP
    )) {
      const roleId = roleMap.get(roleCode);

      for (const permissionCode of permissionCodes) {
        if (!permissionMap.has(permissionCode)) {
          throw new Error(
            `Permission not found: ${permissionCode}`
          );
        }
      }

      const existingMappings = await getRows(
        sequelize,
        `
          SELECT permission_id
          FROM role_permissions
          WHERE role_id = ${Number(roleId)}
        `,
        transaction
      );

      const assignedIds = new Set(
        existingMappings.map(item => Number(item.permission_id))
      );

      const rows = permissionCodes
        .map(code => permissionMap.get(code))
        .filter(id => !assignedIds.has(Number(id)))
        .map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId,
          created_at: now,
          updated_at: now
        }));

      if (rows.length > 0) {
        await queryInterface.bulkInsert(
          "role_permissions",
          rows,
          { transaction }
        );
      }
    }
  });
}

export async function down({ context: queryInterface }) {
  throw new Error(
    "Automatic rollback is disabled for this permission migration. " +
    "Review role assignments and perform a controlled recovery."
  );
}