import { Router } from "express";
import { authenticate, requirePermission } from "../../middlewares/auth.middleware.js";
import {
  dashboardSummary,
  getRolePermissions,
  getUser,
  getUserRoles,
  listPermissions,
  listRoles,
  listUsers,
  replaceRolePermissions,
  replaceUserRoles,
  updateUserStatus
} from "./admin.controller.js";

const router = Router();

router.use(authenticate);

router.get("/dashboard/summary", requirePermission("users.view"), dashboardSummary);

router.get("/users", requirePermission("users.view"), listUsers);
router.get("/users/:id", requirePermission("users.view"), getUser);
router.patch("/users/:id/status", requirePermission("users.update"), updateUserStatus);
router.get("/users/:id/roles", requirePermission("users.view"), getUserRoles);
router.put("/users/:id/roles", requirePermission("users.manage_roles"), replaceUserRoles);

router.get("/roles", requirePermission("roles.view"), listRoles);
router.get("/permissions", requirePermission("permissions.view"), listPermissions);
router.get("/roles/:id/permissions", requirePermission("roles.view"), getRolePermissions);
router.put("/roles/:id/permissions", requirePermission("permissions.manage"), replaceRolePermissions);

export default router;
