import express, { Router } from "express";
import { authenticate, requireAnyRole } from "../../middlewares/auth.middleware.js";
import {
  createBanner,
  createContentItem,
  deleteBanner,
  deleteContentItem,
  getAdminCmsOverview,
  getPublicHomeContent,
  reorderBanners,
  reorderContentItems,
  toggleBanner,
  toggleContentItem,
  updateBanner,
  updateContentItem,
  uploadBannerImage
} from "./cms.controller.js";

export const publicCmsRouter = Router();
publicCmsRouter.get("/home", getPublicHomeContent);

export const adminCmsRouter = Router();
adminCmsRouter.use(authenticate, requireAnyRole("SA", "AD"));

adminCmsRouter.get("/overview", getAdminCmsOverview);
adminCmsRouter.post("/upload-image", express.json({ limit: "8mb" }), uploadBannerImage);

adminCmsRouter.post("/banners", createBanner);
adminCmsRouter.put("/banners/:id", updateBanner);
adminCmsRouter.patch("/banners/:id/toggle", toggleBanner);
adminCmsRouter.patch("/banners/reorder", reorderBanners);
adminCmsRouter.delete("/banners/:id", deleteBanner);

adminCmsRouter.post("/items", createContentItem);
adminCmsRouter.put("/items/:id", updateContentItem);
adminCmsRouter.patch("/items/:id/toggle", toggleContentItem);
adminCmsRouter.patch("/items/reorder", reorderContentItems);
adminCmsRouter.delete("/items/:id", deleteContentItem);
