import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sequelize from "../../config/database.js";
import { HomeContentItem, HomeHeroBanner } from "../../models/index.js";
import {
  DEFAULT_ABOUT_ITEMS,
  DEFAULT_HERO_BANNERS,
  DEFAULT_IMPACT_ITEMS,
  DEFAULT_PROGRAMME_ITEMS,
  DEFAULT_TICKER_ITEMS,
  getHomeDefaults
} from "./cms.defaults.js";

const MAX_UINT64 = 18446744073709551615n;
const ALLOWED_SECTION_TYPES = new Set(["ABOUT", "PROGRAMME", "IMPACT", "TICKER"]);
const ALLOWED_LAYOUT_TYPES = new Set(["BACKGROUND", "SIDE_BY_SIDE"]);
const ALLOWED_MIME_EXTENSIONS = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif"
};
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const UPLOADS_CMS_DIR = path.resolve("uploads", "cms");

let cmsSchemaPromise = null;

async function ensureCmsSchema() {
  if (!cmsSchemaPromise) {
    cmsSchemaPromise = (async () => {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS home_hero_banners (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(200) NOT NULL,
          subtitle TEXT NULL,
          image_url VARCHAR(500) NULL,
          cta_label VARCHAR(80) NULL,
          cta_link VARCHAR(255) NULL,
          layout_type ENUM('BACKGROUND', 'SIDE_BY_SIDE') NOT NULL DEFAULT 'BACKGROUND',
          sort_order INT UNSIGNED NOT NULL DEFAULT 0,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          created_by BIGINT UNSIGNED NULL,
          updated_by BIGINT UNSIGNED NULL,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          INDEX idx_home_hero_banners_active_order (is_active, sort_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS home_content_items (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          section_type ENUM('ABOUT', 'PROGRAMME', 'IMPACT', 'TICKER') NOT NULL,
          title VARCHAR(255) NOT NULL,
          subtitle VARCHAR(255) NULL,
          description TEXT NULL,
          metric_value VARCHAR(60) NULL,
          icon VARCHAR(60) NULL,
          image_url VARCHAR(500) NULL,
          cta_label VARCHAR(80) NULL,
          cta_link VARCHAR(255) NULL,
          sort_order INT UNSIGNED NOT NULL DEFAULT 0,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          created_by BIGINT UNSIGNED NULL,
          updated_by BIGINT UNSIGNED NULL,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          INDEX idx_home_content_section_active_order (section_type, is_active, sort_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      const [layoutCols] = await sequelize.query(
        "SHOW COLUMNS FROM home_hero_banners LIKE 'layout_type'"
      );
      if (!Array.isArray(layoutCols) || layoutCols.length === 0) {
        await sequelize.query(`
          ALTER TABLE home_hero_banners
          ADD COLUMN layout_type ENUM('BACKGROUND', 'SIDE_BY_SIDE') NOT NULL DEFAULT 'BACKGROUND' AFTER cta_link
        `);
      }

      const bannerCount = await HomeHeroBanner.count();
      if (bannerCount === 0) {
        await HomeHeroBanner.bulkCreate(
          DEFAULT_HERO_BANNERS.map((b, idx) => ({
            title: b.title,
            subtitle: b.subtitle || null,
            imageUrl: b.imageUrl || null,
            ctaLabel: b.ctaLabel || null,
            ctaLink: b.ctaLink || null,
            layoutType: b.layoutType || "BACKGROUND",
            sortOrder: b.sortOrder ?? idx + 1,
            isActive: b.isActive !== false
          }))
        );
      }

      const itemCount = await HomeContentItem.count();
      if (itemCount === 0) {
        const defaultItems = [
          ...DEFAULT_ABOUT_ITEMS,
          ...DEFAULT_PROGRAMME_ITEMS,
          ...DEFAULT_IMPACT_ITEMS,
          ...DEFAULT_TICKER_ITEMS
        ];
        await HomeContentItem.bulkCreate(
          defaultItems.map((item, idx) => ({
            sectionType: item.sectionType,
            title: item.title,
            subtitle: item.subtitle || null,
            description: item.description || null,
            metricValue: item.metricValue || null,
            icon: item.icon || null,
            imageUrl: item.imageUrl || null,
            ctaLabel: item.ctaLabel || null,
            ctaLink: item.ctaLink || null,
            sortOrder: item.sortOrder ?? idx + 1,
            isActive: item.isActive !== false
          }))
        );
      }
    })().catch((err) => {
      cmsSchemaPromise = null;
      throw err;
    });
  }
  return cmsSchemaPromise;
}

function parseId(value) {
  const id = String(value ?? "").trim();
  if (!/^\d+$/.test(id)) return null;
  const parsed = BigInt(id);
  return parsed >= 1n && parsed <= MAX_UINT64 ? id : null;
}

function parseIdArray(value) {
  if (!Array.isArray(value) || value.length === 0) return null;
  const ids = [...new Set(value.map((item) => String(item ?? "").trim()))];
  if (ids.some((id) => !/^\d+$/.test(id) || BigInt(id) < 1n || BigInt(id) > MAX_UINT64)) return null;
  return ids;
}

function cleanText(value, maxLength) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function cleanUrl(value, maxLength = 500) {
  const trimmed = cleanText(value, maxLength);
  if (!trimmed) return null;
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }
  return null;
}

function parseSortOrder(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 999999 ? parsed : fallback;
}

function sendError(res, status, code, message) {
  return res.status(status).json({ success: false, code, message });
}

function serializeBanner(row) {
  return {
    id: String(row.id),
    title: row.title,
    subtitle: row.subtitle,
    imageUrl: row.imageUrl,
    ctaLabel: row.ctaLabel,
    ctaLink: row.ctaLink,
    layoutType: ALLOWED_LAYOUT_TYPES.has(row.layoutType) ? row.layoutType : "BACKGROUND",
    sortOrder: Number(row.sortOrder || 0),
    isActive: Boolean(row.isActive),
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
}

function serializeContentItem(row) {
  return {
    id: String(row.id),
    sectionType: row.sectionType,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    metricValue: row.metricValue,
    icon: row.icon,
    imageUrl: row.imageUrl,
    ctaLabel: row.ctaLabel,
    ctaLink: row.ctaLink,
    sortOrder: Number(row.sortOrder || 0),
    isActive: Boolean(row.isActive),
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
}

// Public endpoint: gracefully falls back to default HCDF content if DB has no active records or is unreachable.
export async function getPublicHomeContent(_req, res) {
  try {
    await ensureCmsSchema();
    const [bannerRows, contentRows] = await Promise.all([
      HomeHeroBanner.findAll({
        where: { isActive: true },
        order: [["sortOrder", "ASC"], ["id", "ASC"]]
      }),
      HomeContentItem.findAll({
        where: { isActive: true },
        order: [["sortOrder", "ASC"], ["id", "ASC"]]
      })
    ]);

    const banners = bannerRows.length
      ? bannerRows.map(serializeBanner)
      : DEFAULT_HERO_BANNERS;

    const grouped = { ABOUT: [], PROGRAMME: [], IMPACT: [], TICKER: [] };
    for (const item of contentRows) {
      if (grouped[item.sectionType]) {
        grouped[item.sectionType].push(serializeContentItem(item));
      }
    }

    return res.json({
      success: true,
      data: {
        banners,
        about: grouped.ABOUT.length ? grouped.ABOUT : DEFAULT_ABOUT_ITEMS,
        programmes: grouped.PROGRAMME.length ? grouped.PROGRAMME : DEFAULT_PROGRAMME_ITEMS,
        impact: grouped.IMPACT.length ? grouped.IMPACT : DEFAULT_IMPACT_ITEMS,
        ticker: grouped.TICKER.length ? grouped.TICKER : DEFAULT_TICKER_ITEMS,
        fallbackUsed: {
          banners: bannerRows.length === 0,
          about: grouped.ABOUT.length === 0,
          programmes: grouped.PROGRAMME.length === 0,
          impact: grouped.IMPACT.length === 0,
          ticker: grouped.TICKER.length === 0
        }
      }
    });
  } catch (error) {
    console.warn("CMS public fallback active:", error.message);
    return res.json({
      success: true,
      data: {
        ...getHomeDefaults(),
        fallbackUsed: {
          banners: true,
          about: true,
          programmes: true,
          impact: true,
          ticker: true
        }
      }
    });
  }
}

export async function getAdminCmsOverview(_req, res, next) {
  try {
    await ensureCmsSchema();
    const [bannerRows, contentRows] = await Promise.all([
      HomeHeroBanner.findAll({
        order: [["sortOrder", "ASC"], ["id", "ASC"]]
      }),
      HomeContentItem.findAll({
        order: [["sectionType", "ASC"], ["sortOrder", "ASC"], ["id", "ASC"]]
      })
    ]);

    const grouped = { ABOUT: [], PROGRAMME: [], IMPACT: [], TICKER: [] };
    for (const item of contentRows) {
      if (grouped[item.sectionType]) {
        grouped[item.sectionType].push(serializeContentItem(item));
      }
    }

    return res.json({
      success: true,
      data: {
        banners: bannerRows.map(serializeBanner),
        sections: grouped
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function uploadBannerImage(req, res, next) {
  try {
    const { dataUrl } = req.body || {};
    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
      return sendError(res, 422, "INVALID_IMAGE_DATA", "Please provide a valid image file (PNG, JPG, WEBP, or GIF).");
    }

    const match = /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl.trim());
    if (!match) {
      return sendError(res, 422, "UNSUPPORTED_IMAGE_FORMAT", "Supported formats are PNG, JPG, WEBP, and GIF.");
    }

    const mimeType = match[1].toLowerCase();
    const ext = ALLOWED_MIME_EXTENSIONS[mimeType];
    const buffer = Buffer.from(match[2], "base64");

    if (!buffer.length || buffer.length > MAX_UPLOAD_BYTES) {
      return sendError(res, 422, "IMAGE_TOO_LARGE", "Image size must be 5 MB or less.");
    }

    await fs.mkdir(UPLOADS_CMS_DIR, { recursive: true });
    const filename = `cms-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
    const targetPath = path.join(UPLOADS_CMS_DIR, filename);
    await fs.writeFile(targetPath, buffer);

    return res.status(201).json({
      success: true,
      data: {
        url: `/uploads/cms/${filename}`
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function createBanner(req, res, next) {
  try {
    await ensureCmsSchema();
    const body = req.body || {};
    const title = cleanText(body.title, 200);
    if (!title) {
      return sendError(res, 422, "TITLE_REQUIRED", "Banner title is required.");
    }

    const imageUrl = body.imageUrl ? cleanUrl(body.imageUrl, 500) : null;
    if (body.imageUrl && !imageUrl) {
      return sendError(res, 422, "INVALID_IMAGE_URL", "Image URL must start with http://, https://, or /.");
    }

    const ctaLink = body.ctaLink ? cleanUrl(body.ctaLink, 255) : null;
    if (body.ctaLink && !ctaLink) {
      return sendError(res, 422, "INVALID_CTA_LINK", "CTA link must start with http://, https://, or /.");
    }

    const layoutType = ALLOWED_LAYOUT_TYPES.has(String(body.layoutType || "").toUpperCase())
      ? String(body.layoutType).toUpperCase()
      : "BACKGROUND";

    const maxOrder = (await HomeHeroBanner.max("sortOrder")) || 0;
    const banner = await HomeHeroBanner.create({
      title,
      subtitle: cleanText(body.subtitle, 1500),
      imageUrl,
      ctaLabel: cleanText(body.ctaLabel, 80),
      ctaLink,
      layoutType,
      sortOrder: parseSortOrder(body.sortOrder, Number(maxOrder) + 1),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      createdBy: req.auth.userId,
      updatedBy: req.auth.userId
    });

    return res.status(201).json({ success: true, data: serializeBanner(banner) });
  } catch (error) {
    return next(error);
  }
}

export async function updateBanner(req, res, next) {
  try {
    await ensureCmsSchema();
    const id = parseId(req.params.id);
    if (!id) return sendError(res, 400, "INVALID_ID", "Invalid banner id.");

    const banner = await HomeHeroBanner.findByPk(id);
    if (!banner) return sendError(res, 404, "BANNER_NOT_FOUND", "Hero banner not found.");

    const body = req.body || {};
    const title = cleanText(body.title, 200);
    if (!title) return sendError(res, 422, "TITLE_REQUIRED", "Banner title is required.");

    const imageUrl = body.imageUrl ? cleanUrl(body.imageUrl, 500) : null;
    if (body.imageUrl && !imageUrl) {
      return sendError(res, 422, "INVALID_IMAGE_URL", "Image URL must start with http://, https://, or /.");
    }

    const ctaLink = body.ctaLink ? cleanUrl(body.ctaLink, 255) : null;
    if (body.ctaLink && !ctaLink) {
      return sendError(res, 422, "INVALID_CTA_LINK", "CTA link must start with http://, https://, or /.");
    }

    const layoutType = body.layoutType !== undefined
      ? (ALLOWED_LAYOUT_TYPES.has(String(body.layoutType).toUpperCase()) ? String(body.layoutType).toUpperCase() : banner.layoutType)
      : banner.layoutType;

    await banner.update({
      title,
      subtitle: cleanText(body.subtitle, 1500),
      imageUrl,
      ctaLabel: cleanText(body.ctaLabel, 80),
      ctaLink,
      layoutType,
      sortOrder: parseSortOrder(body.sortOrder, banner.sortOrder),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : banner.isActive,
      updatedBy: req.auth.userId
    });

    return res.json({ success: true, data: serializeBanner(banner) });
  } catch (error) {
    return next(error);
  }
}

export async function toggleBanner(req, res, next) {
  try {
    await ensureCmsSchema();
    const id = parseId(req.params.id);
    if (!id) return sendError(res, 400, "INVALID_ID", "Invalid banner id.");

    const banner = await HomeHeroBanner.findByPk(id);
    if (!banner) return sendError(res, 404, "BANNER_NOT_FOUND", "Hero banner not found.");

    await banner.update({
      isActive: !banner.isActive,
      updatedBy: req.auth.userId
    });

    return res.json({ success: true, data: serializeBanner(banner) });
  } catch (error) {
    return next(error);
  }
}

export async function reorderBanners(req, res, next) {
  try {
    await ensureCmsSchema();
    const orderedIds = parseIdArray(req.body?.orderedIds);
    if (!orderedIds) {
      return sendError(res, 422, "INVALID_ORDER_LIST", "orderedIds must be a non-empty array of valid banner IDs.");
    }

    await sequelize.transaction(async (transaction) => {
      for (let index = 0; index < orderedIds.length; index += 1) {
        await HomeHeroBanner.update(
          { sortOrder: index + 1, updatedBy: req.auth.userId },
          { where: { id: orderedIds[index] }, transaction }
        );
      }
    });

    const banners = await HomeHeroBanner.findAll({
      order: [["sortOrder", "ASC"], ["id", "ASC"]]
    });

    return res.json({ success: true, data: banners.map(serializeBanner) });
  } catch (error) {
    return next(error);
  }
}

export async function deleteBanner(req, res, next) {
  try {
    await ensureCmsSchema();
    const id = parseId(req.params.id);
    if (!id) return sendError(res, 400, "INVALID_ID", "Invalid banner id.");

    const deleted = await HomeHeroBanner.destroy({ where: { id } });
    if (!deleted) return sendError(res, 404, "BANNER_NOT_FOUND", "Hero banner not found.");

    return res.json({ success: true, message: "Hero banner deleted." });
  } catch (error) {
    return next(error);
  }
}

export async function createContentItem(req, res, next) {
  try {
    await ensureCmsSchema();
    const body = req.body || {};
    const sectionType = String(body.sectionType || "").trim().toUpperCase();
    if (!ALLOWED_SECTION_TYPES.has(sectionType)) {
      return sendError(res, 422, "INVALID_SECTION_TYPE", "sectionType must be ABOUT, PROGRAMME, IMPACT, or TICKER.");
    }

    const title = cleanText(body.title, 255);
    if (!title) return sendError(res, 422, "TITLE_REQUIRED", "Title is required.");

    const imageUrl = body.imageUrl ? cleanUrl(body.imageUrl, 500) : null;
    if (body.imageUrl && !imageUrl) {
      return sendError(res, 422, "INVALID_IMAGE_URL", "Image URL must start with http://, https://, or /.");
    }

    const ctaLink = body.ctaLink ? cleanUrl(body.ctaLink, 255) : null;
    if (body.ctaLink && !ctaLink) {
      return sendError(res, 422, "INVALID_CTA_LINK", "CTA link must start with http://, https://, or /.");
    }

    const maxOrder = (await HomeContentItem.max("sortOrder", { where: { sectionType } })) || 0;
    const item = await HomeContentItem.create({
      sectionType,
      title,
      subtitle: cleanText(body.subtitle, 255),
      description: cleanText(body.description, 3000),
      metricValue: cleanText(body.metricValue, 60),
      icon: cleanText(body.icon, 60),
      imageUrl,
      ctaLabel: cleanText(body.ctaLabel, 80),
      ctaLink,
      sortOrder: parseSortOrder(body.sortOrder, Number(maxOrder) + 1),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      createdBy: req.auth.userId,
      updatedBy: req.auth.userId
    });

    return res.status(201).json({ success: true, data: serializeContentItem(item) });
  } catch (error) {
    return next(error);
  }
}

export async function updateContentItem(req, res, next) {
  try {
    await ensureCmsSchema();
    const id = parseId(req.params.id);
    if (!id) return sendError(res, 400, "INVALID_ID", "Invalid content item id.");

    const item = await HomeContentItem.findByPk(id);
    if (!item) return sendError(res, 404, "ITEM_NOT_FOUND", "Content item not found.");

    const body = req.body || {};
    const title = cleanText(body.title, 255);
    if (!title) return sendError(res, 422, "TITLE_REQUIRED", "Title is required.");

    const imageUrl = body.imageUrl ? cleanUrl(body.imageUrl, 500) : null;
    if (body.imageUrl && !imageUrl) {
      return sendError(res, 422, "INVALID_IMAGE_URL", "Image URL must start with http://, https://, or /.");
    }

    const ctaLink = body.ctaLink ? cleanUrl(body.ctaLink, 255) : null;
    if (body.ctaLink && !ctaLink) {
      return sendError(res, 422, "INVALID_CTA_LINK", "CTA link must start with http://, https://, or /.");
    }

    await item.update({
      title,
      subtitle: cleanText(body.subtitle, 255),
      description: cleanText(body.description, 3000),
      metricValue: cleanText(body.metricValue, 60),
      icon: cleanText(body.icon, 60),
      imageUrl,
      ctaLabel: cleanText(body.ctaLabel, 80),
      ctaLink,
      sortOrder: parseSortOrder(body.sortOrder, item.sortOrder),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : item.isActive,
      updatedBy: req.auth.userId
    });

    return res.json({ success: true, data: serializeContentItem(item) });
  } catch (error) {
    return next(error);
  }
}

export async function toggleContentItem(req, res, next) {
  try {
    await ensureCmsSchema();
    const id = parseId(req.params.id);
    if (!id) return sendError(res, 400, "INVALID_ID", "Invalid content item id.");

    const item = await HomeContentItem.findByPk(id);
    if (!item) return sendError(res, 404, "ITEM_NOT_FOUND", "Content item not found.");

    await item.update({
      isActive: !item.isActive,
      updatedBy: req.auth.userId
    });

    return res.json({ success: true, data: serializeContentItem(item) });
  } catch (error) {
    return next(error);
  }
}

export async function reorderContentItems(req, res, next) {
  try {
    await ensureCmsSchema();
    const sectionType = String(req.body?.sectionType || "").trim().toUpperCase();
    if (!ALLOWED_SECTION_TYPES.has(sectionType)) {
      return sendError(res, 422, "INVALID_SECTION_TYPE", "sectionType must be ABOUT, PROGRAMME, IMPACT, or TICKER.");
    }

    const orderedIds = parseIdArray(req.body?.orderedIds);
    if (!orderedIds) {
      return sendError(res, 422, "INVALID_ORDER_LIST", "orderedIds must be a non-empty array of valid item IDs.");
    }

    await sequelize.transaction(async (transaction) => {
      for (let index = 0; index < orderedIds.length; index += 1) {
        await HomeContentItem.update(
          { sortOrder: index + 1, updatedBy: req.auth.userId },
          { where: { id: orderedIds[index], sectionType }, transaction }
        );
      }
    });

    const items = await HomeContentItem.findAll({
      where: { sectionType },
      order: [["sortOrder", "ASC"], ["id", "ASC"]]
    });

    return res.json({ success: true, data: items.map(serializeContentItem) });
  } catch (error) {
    return next(error);
  }
}

export async function deleteContentItem(req, res, next) {
  try {
    await ensureCmsSchema();
    const id = parseId(req.params.id);
    if (!id) return sendError(res, 400, "INVALID_ID", "Invalid content item id.");

    const deleted = await HomeContentItem.destroy({ where: { id } });
    if (!deleted) return sendError(res, 404, "ITEM_NOT_FOUND", "Content item not found.");

    return res.json({ success: true, message: "Content item deleted." });
  } catch (error) {
    return next(error);
  }
}
