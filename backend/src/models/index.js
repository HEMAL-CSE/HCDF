import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const commonOptions = {
  timestamps: true,
  underscored: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
};

export const User = sequelize.define("User", {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  fullName: { type: DataTypes.STRING(150), allowNull: false, field: "full_name" },
  email: { type: DataTypes.STRING(191), allowNull: true, unique: true },
  phone: { type: DataTypes.STRING(30), allowNull: true, unique: true },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: "password_hash" },
  status: {
    type: DataTypes.ENUM("PENDING", "ACTIVE", "SUSPENDED", "LOCKED"),
    allowNull: false,
    defaultValue: "PENDING"
  },
  emailVerifiedAt: { type: DataTypes.DATE, allowNull: true, field: "email_verified_at" },
  phoneVerifiedAt: { type: DataTypes.DATE, allowNull: true, field: "phone_verified_at" },
  lastLoginAt: { type: DataTypes.DATE, allowNull: true, field: "last_login_at" },
  failedLoginAttempts: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    field: "failed_login_attempts"
  },
  lockedUntil: { type: DataTypes.DATE, allowNull: true, field: "locked_until" }
}, { ...commonOptions, tableName: "users" });

export const Role = sequelize.define("Role", {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.STRING(500), allowNull: true },
  isSystem: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: "is_system" }
}, { ...commonOptions, tableName: "roles" });
          
export const UserRole = sequelize.define("UserRole", {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: "user_id" },
  roleId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: "role_id" },
  assignedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "assigned_at" }
}, { ...commonOptions, tableName: "user_roles" });

export const AuthSession = sequelize.define("AuthSession", {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: "user_id" },
  tokenHash: { type: DataTypes.CHAR(64), allowNull: false, unique: true, field: "token_hash" },
  expiresAt: { type: DataTypes.DATE, allowNull: false, field: "expires_at" },
  revokedAt: { type: DataTypes.DATE, allowNull: true, field: "revoked_at" },
  userAgent: { type: DataTypes.STRING(500), allowNull: true, field: "user_agent" },
  ipAddress: { type: DataTypes.STRING(45), allowNull: true, field: "ip_address" }
}, { ...commonOptions, tableName: "auth_sessions" });

User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: "userId",
  otherKey: "roleId",
  as: "roles"
});
Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: "roleId",
  otherKey: "userId",
  as: "users"
});

