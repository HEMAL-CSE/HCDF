
import { DataTypes } from "sequelize";

export async function up({ context: queryInterface }) {
  // 1. USERS
  await queryInterface.createTable("users", {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    full_name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(191),
      allowNull: true,
      unique: true
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
      unique: true
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(
        "PENDING",
        "ACTIVE",
        "SUSPENDED",
        "LOCKED"
      ),
      allowNull: false,
      defaultValue: "PENDING"
    },
    email_verified_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    phone_verified_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    failed_login_attempts: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    locked_until: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // 2. ROLES
  await queryInterface.createTable("roles", {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    is_system: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // 3. PERMISSIONS
  await queryInterface.createTable("permissions", {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    module: {
      type: DataTypes.STRING(80),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // 4. USER ROLES
  await queryInterface.createTable("user_roles", {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    role_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: "roles",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT"
    },
    assigned_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // 5. ROLE PERMISSIONS
  await queryInterface.createTable("role_permissions", {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    role_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: "roles",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    permission_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: "permissions",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // Composite unique indexes
  await queryInterface.addIndex(
    "user_roles",
    ["user_id", "role_id"],
    {
      unique: true,
      name: "uq_user_roles_user_role"
    }
  );

  await queryInterface.addIndex(
    "role_permissions",
    ["role_id", "permission_id"],
    {
      unique: true,
      name: "uq_role_permissions_role_permission"
    }
  );

  // Default system roles from HCDF specification
  const now = new Date();

  await queryInterface.bulkInsert("roles", [
    {
      code: "SA",
      name: "Super Admin",
      description: "System administration and configuration",
      is_system: true,
      created_at: now,
      updated_at: now
    },
    {
      code: "AD",
      name: "Admin",
      description: "Administrative operations",
      is_system: true,
      created_at: now,
      updated_at: now
    },
    {
      code: "MO",
      name: "Membership Officer",
      description: "Membership application and review operations",
      is_system: true,
      created_at: now,
      updated_at: now
    },
    {
      code: "FO",
      name: "Finance Officer",
      description: "Donation, payment and finance operations",
      is_system: true,
      created_at: now,
      updated_at: now
    },
    {
      code: "CE",
      name: "Content Editor",
      description: "Website content and publication management",
      is_system: true,
      created_at: now,
      updated_at: now
    },
    {
      code: "PM",
      name: "Programme Manager",
      description: "Programme and project operations",
      is_system: true,
      created_at: now,
      updated_at: now
    },
    {
      code: "SO",
      name: "Support Officer",
      description: "Support and contact message operations",
      is_system: true,
      created_at: now,
      updated_at: now
    },
    {
      code: "AU",
      name: "Auditor",
      description: "Read-only audit and compliance access",
      is_system: true,
      created_at: now,
      updated_at: now
    },
    {
      code: "MB",
      name: "Member",
      description: "Member self-service access",
      is_system: true,
      created_at: now,
      updated_at: now
    }
  ]);

  // Initial permission catalogue.
  // Role-to-permission assignments will be added
  // in a separate, reviewed seed step.
  const permissionDefinitions = [
    ["users.view", "View users", "users"],
    ["users.create", "Create users", "users"],
    ["users.update", "Update users", "users"],
    ["users.manage_roles", "Manage user roles", "users"],

    ["roles.view", "View roles", "roles"],
    ["roles.manage", "Manage roles", "roles"],

    ["permissions.view", "View permissions", "permissions"],
    ["permissions.manage", "Manage permissions", "permissions"],

    ["membership.view", "View membership applications", "membership"],
    ["membership.review", "Review membership applications", "membership"],
    ["membership.approve", "Approve membership applications", "membership"],

    ["nid.view", "View permitted NID records", "nid"],
    ["nid.review", "Review NID records", "nid"],

    ["donations.view", "View donations", "donations"],
    ["donations.verify", "Verify manual donations", "donations"],
    ["donations.refund", "Process authorised refunds", "donations"],

    ["finance.view", "View finance reports", "finance"],
    ["finance.reconcile", "Reconcile financial records", "finance"],

    ["content.view", "View website content", "content"],
    ["content.manage", "Manage website content", "content"],
    ["content.publish", "Publish approved content", "content"],

    ["programmes.view", "View programmes", "programmes"],
    ["programmes.manage", "Manage programmes", "programmes"],

    ["projects.view", "View projects", "projects"],
    ["projects.manage", "Manage projects", "projects"],

    ["notices.manage", "Manage notices", "notices"],
    ["publications.manage", "Manage publications", "publications"],

    ["contacts.view", "View contact messages", "contacts"],
    ["contacts.manage", "Manage contact messages", "contacts"],

    ["applications.view", "View scheme applications", "applications"],
    ["applications.review", "Review scheme applications", "applications"],

    ["audit.view", "View audit logs", "audit"],

    ["profile.view_own", "View own profile", "profile"],
    ["profile.update_own", "Update own profile", "profile"],
    ["donations.view_own", "View own donation history", "donations"],
    ["receipts.view_own", "View own receipts", "receipts"]
  ];

  await queryInterface.bulkInsert(
    "permissions",
    permissionDefinitions.map(([code, name, module]) => ({
      code,
      name,
      module,
      description: null,
      created_at: now,
      updated_at: now
    }))
  );
}

export async function down({ context: queryInterface }) {
  // Remove child tables before parent tables.
  await queryInterface.dropTable("role_permissions");
  await queryInterface.dropTable("user_roles");
  await queryInterface.dropTable("permissions");
  await queryInterface.dropTable("roles");
  await queryInterface.dropTable("users");
}


