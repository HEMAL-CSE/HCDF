import { Router } from "express";
import { authenticate, requirePermission } from "../../middlewares/auth.middleware.js";
import { getOwnProfile, updateOwnProfile } from "./member.controller.js";

const router = Router();

router.use(authenticate);

router.get("/profile", requirePermission("profile.view_own"), getOwnProfile);
router.patch("/profile", requirePermission("profile.update_own"), updateOwnProfile);

export default router;
