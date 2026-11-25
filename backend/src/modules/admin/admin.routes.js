import { Router } from "express";
import { authenticate, requirePermission } from "../../middlewares/auth.middleware.js";
import {
  approveMember,
  dashboardSummary,
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
  updateUserStatus
} from "./admin.controller.js";

const router = Router();

router.use(authenticate);

router.get("/dashboard/summary", requirePermission("users.view"), dashboardSummary);

router.get("/members/pending", requirePermission("membership.view"), listPendingMembers);
router.patch("/members/:id/approve", requirePermission("membership.approve"), approveMember);
router.patch("/members/:id/reject", requirePermission("membership.approve"), rejectMember);

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
