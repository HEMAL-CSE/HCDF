import { Router } from "express";
import { authenticate, requirePermission } from "../../middlewares/auth.middleware.js";
import {
  approveMember,
  createRole,
  createUser,
  dashboardSummary,
  deleteRole,
  getRolePermissions,
  getUser,
  getUserRoles,
  listPendingMembers,
  listPermissions,
  listRoles,
  listUsers,
  rejectMember,
  replaceRolePermissions,
  replaceUserRoles,
  resetUserPassword,
  updateRole,
  updateUserStatus
} from "./admin.controller.js";

const router = Router();

router.use(authenticate);

router.get("/dashboard/summary", requirePermission("users.view"), dashboardSummary);

router.get("/members/pending", requirePermission("membership.view"), listPendingMembers);
router.patch("/members/:id/approve", requirePermission("membership.approve"), approveMember);
router.patch("/members/:id/reject", requirePermission("membership.approve"), rejectMember);

router.get("/users", requirePermission("users.view"), listUsers);
router.post("/users", requirePermission("users.create"), createUser);
router.get("/users/:id", requirePermission("users.view"), getUser);
router.patch("/users/:id/status", requirePermission("users.update"), updateUserStatus);
router.patch("/users/:id/password", requirePermission("users.update"), resetUserPassword);
router.get("/users/:id/roles", requirePermission("users.view"), getUserRoles);
router.put("/users/:id/roles", requirePermission("users.manage_roles"), replaceUserRoles);

router.get("/roles", requirePermission("roles.view"), listRoles);
router.post("/roles", requirePermission("roles.manage"), createRole);
router.put("/roles/:id", requirePermission("roles.manage"), updateRole);
router.delete("/roles/:id", requirePermission("roles.manage"), deleteRole);
router.get("/permissions", requirePermission("permissions.view"), listPermissions);
router.get("/roles/:id/permissions", requirePermission("roles.view"), getRolePermissions);
router.put("/roles/:id/permissions", requirePermission("permissions.manage"), replaceRolePermissions);

export default router;
