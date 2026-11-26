import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown, ArrowUp, BarChart3, CheckCircle2, Eye, EyeOff,
  ExternalLink, Image as ImageIcon, Info, Layers, Megaphone,
  Pencil, Plus, Trash2, Upload, X
} from "lucide-react";
import { api, resolveMediaUrl } from "../api/client.js";

const TABS = [
  { key: "BANNERS", label: "Hero Banners", icon: ImageIcon },
  { key: "ABOUT", label: "About HCDF", icon: Info },
  { key: "PROGRAMME", label: "Core Programmes", icon: Layers },
  { key: "IMPACT", label: "Impact Counters", icon: BarChart3 },
  { key: "TICKER", label: "News Ticker", icon: Megaphone }
];

const ICON_OPTIONS = [
  "HeartHandshake",
  "GraduationCap",
  "BookOpen",
  "Stethoscope",
  "ShieldCheck",
  "Users",
  "UserCheck",
  "Globe",
  "Award"
];

const EMPTY_BANNER_FORM = {
  title: "",
  subtitle: "",
  imageUrl: "",
  ctaLabel: "",
  ctaLink: "",
  layoutType: "BACKGROUND",
  isActive: true
};

const EMPTY_ITEM_FORM = {
  title: "",
  subtitle: "",
  description: "",
  metricValue: "",
  icon: "HeartHandshake",
  imageUrl: "",
  ctaLabel: "",
  ctaLink: "",
  isActive: true
};

export default function HomeContentPage() {
  const [activeTab, setActiveTab] = useState("BANNERS");
  const [banners, setBanners] = useState([]);
  const [sections, setSections] = useState({ ABOUT: [], PROGRAMME: [], IMPACT: [], TICKER: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const [modalMode, setModalMode] = useState(null); // "banner" | "item" | null
  const [editingId, setEditingId] = useState(null);
  const [bannerForm, setBannerForm] = useState(EMPTY_BANNER_FORM);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM_FORM);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/admin/cms/overview");
      const data = response.data?.data || {};
      setBanners(data.banners || []);
      setSections(data.sections || { ABOUT: [], PROGRAMME: [], IMPACT: [], TICKER: [] });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load home content configuration.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  function openNewModal() {
    setError("");
    setFeedback("");
    setEditingId(null);
    if (activeTab === "BANNERS") {
      setBannerForm(EMPTY_BANNER_FORM);
      setModalMode("banner");
    } else {
      setItemForm(EMPTY_ITEM_FORM);
      setModalMode("item");
    }
  }

  function openEditBanner(banner) {
    setError("");
    setFeedback("");
    setEditingId(banner.id);
    setBannerForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      imageUrl: banner.imageUrl || "",
      ctaLabel: banner.ctaLabel || "",
      ctaLink: banner.ctaLink || "",
      layoutType: banner.layoutType || "BACKGROUND",
      isActive: Boolean(banner.isActive)
    });
    setModalMode("banner");
  }

  function openEditItem(item) {
    setError("");
    setFeedback("");
    setEditingId(item.id);
    setItemForm({
      title: item.title || "",
      subtitle: item.subtitle || "",
      description: item.description || "",
      metricValue: item.metricValue || "",
      icon: item.icon || "HeartHandshake",
      imageUrl: item.imageUrl || "",
      ctaLabel: item.ctaLabel || "",
      ctaLink: item.ctaLink || "",
      isActive: Boolean(item.isActive)
    });
    setModalMode("item");
  }

  function closeModal() {
    setModalMode(null);
    setEditingId(null);
  }

  async function handleImageUpload(event, target) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5 MB or less.");
      return;
    }

    setUploadingImage(true);
    setError("");
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read selected image file."));
        reader.readAsDataURL(file);
      });

      const response = await api.post("/admin/cms/upload-image", {
        filename: file.name,
        dataUrl
      });
      const uploadedUrl = response.data?.data?.url;
      if (uploadedUrl) {
        if (target === "banner") {
          setBannerForm((prev) => ({ ...prev, imageUrl: uploadedUrl }));
        } else {
          setItemForm((prev) => ({ ...prev, imageUrl: uploadedUrl }));
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Image upload failed.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  async function saveBanner(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setFeedback("");
    try {
      if (editingId) {
        await api.put(`/admin/cms/banners/${editingId}`, bannerForm);
        setFeedback("Hero banner updated.");
      } else {
        await api.post("/admin/cms/banners", bannerForm);
        setFeedback("Hero banner added.");
      }
      closeModal();
      await loadOverview();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save hero banner.");
    } finally {
      setBusy(false);
    }
  }

  async function saveItem(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setFeedback("");
    try {
      const payload = { ...itemForm, sectionType: activeTab };
      if (editingId) {
        await api.put(`/admin/cms/items/${editingId}`, payload);
        setFeedback("Content item updated.");
      } else {
        await api.post("/admin/cms/items", payload);
        setFeedback("Content item added.");
      }
      closeModal();
      await loadOverview();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save content item.");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(type, id) {
    setError("");
    setFeedback("");
    try {
      if (type === "BANNERS") {
        await api.patch(`/admin/cms/banners/${id}/toggle`);
      } else {
        await api.patch(`/admin/cms/items/${id}/toggle`);
      }
      setFeedback("Visibility status updated.");
      await loadOverview();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update visibility.");
    }
  }

  async function handleDelete(type, id) {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    setError("");
    setFeedback("");
    try {
      if (type === "BANNERS") {
        await api.delete(`/admin/cms/banners/${id}`);
      } else {
        await api.delete(`/admin/cms/items/${id}`);
      }
      setFeedback("Item deleted.");
      await loadOverview();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete item.");
    }
  }

  async function handleMove(type, index, direction) {
    const list = type === "BANNERS" ? [...banners] : [...(sections[type] || [])];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    const orderedIds = list.map((item) => item.id);

    setError("");
    try {
      if (type === "BANNERS") {
        setBanners(list);
        await api.patch("/admin/cms/banners/reorder", { orderedIds });
      } else {
        setSections((prev) => ({ ...prev, [type]: list }));
        await api.patch("/admin/cms/items/reorder", { sectionType: type, orderedIds });
      }
      setFeedback("Display order updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reorder items.");
      await loadOverview();
    }
  }

  const currentItems = activeTab === "BANNERS" ? banners : (sections[activeTab] || []);

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">PUBLIC WEBSITE CMS</div>
          <h1>Home Content &amp; Banner Management</h1>
          <p>Manage hero slider banners, About HCDF, core programmes, impact counters, and live ticker headlines.</p>
        </div>
        <div className="cms-header-actions">
          <a href="/home" target="_blank" rel="noreferrer" className="secondary-button">
            <ExternalLink size={15} /> Preview Home Page
          </a>
          <button type="button" className="primary-button" onClick={openNewModal}>
            <Plus size={16} /> Add {activeTab === "BANNERS" ? "Banner" : "Item"}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {feedback && <div className="alert alert-success">{feedback}</div>}

      <div className="cms-tabs">
        {TABS.map(({ key, label, icon: Icon }) => {
          const count = key === "BANNERS" ? banners.length : (sections[key] || []).length;
          return (
            <button
              key={key}
              type="button"
              className={`cms-tab ${activeTab === key ? "cms-tab-active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={16} />
              <span>{label}</span>
              <span className="cms-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{TABS.find((t) => t.key === activeTab)?.label}</h2>
            <p>
              {activeTab === "BANNERS"
                ? "Active banners rotate automatically in the Home Page hero slider."
                : "Active items appear on the public Home Page in the order listed below. If all items are hidden or removed, built-in fallback defaults are shown."}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="loading-card">Loading CMS content…</div>
        ) : currentItems.length === 0 ? (
          <div className="empty-state">
            No custom items in this section yet. The public Home Page will display built-in fallback defaults until you add records here.
          </div>
        ) : (
          <div className="cms-item-list">
            {currentItems.map((item, index) => (
              <div key={item.id} className={`cms-item-card ${!item.isActive ? "cms-item-inactive" : ""}`}>
                {activeTab === "BANNERS" && (
                  <div className="cms-banner-thumb">
                    {item.imageUrl ? (
                      <img src={resolveMediaUrl(item.imageUrl)} alt={item.title} />
                    ) : (
                      <div className="cms-thumb-placeholder"><ImageIcon size={20} /><span>Gradient</span></div>
                    )}
                  </div>
                )}

                <div className="cms-item-body">
                  <div className="cms-item-top">
                    <span className={`status-pill ${item.isActive ? "status-active" : "status-suspended"}`}>
                      {item.isActive ? "ACTIVE" : "HIDDEN"}
                    </span>
                    {activeTab === "BANNERS" && (
                      <span className="cms-item-badge">
                        {item.layoutType === "SIDE_BY_SIDE" ? "Side-by-Side" : "Full Background"}
                      </span>
                    )}
                    {item.subtitle && <span className="cms-item-badge">{item.subtitle}</span>}
                    {item.metricValue && <span className="cms-metric-chip">{item.metricValue}</span>}
                  </div>
                  <strong className="cms-item-title">{item.title}</strong>
                  {item.description && <p className="cms-item-desc">{item.description}</p>}
                  {(item.ctaLabel || item.ctaLink) && (
                    <div className="cms-item-meta">
                      {item.ctaLabel && <span>CTA: {item.ctaLabel}</span>}
                      {item.ctaLink && <span>Link: {item.ctaLink}</span>}
                    </div>
                  )}
                </div>

                <div className="cms-item-actions">
                  <button
                    type="button"
                    className="icon-button"
                    title="Move up"
                    disabled={index === 0}
                    onClick={() => handleMove(activeTab, index, -1)}
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    title="Move down"
                    disabled={index === currentItems.length - 1}
                    onClick={() => handleMove(activeTab, index, 1)}
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    type="button"
                    className="secondary-button compact-button"
                    onClick={() => handleToggle(activeTab, item.id)}
                  >
                    {item.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                    {item.isActive ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    className="secondary-button compact-button"
                    onClick={() => activeTab === "BANNERS" ? openEditBanner(item) : openEditItem(item)}
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    className="icon-button cms-delete-btn"
                    title="Delete"
                    onClick={() => handleDelete(activeTab, item.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── MODAL: BANNER ───────────────────────────────────────── */}
      {modalMode === "banner" && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="detail-modal">
            <div className="modal-heading">
              <div>
                <h2>{editingId ? "Edit Hero Banner" : "Add Hero Banner"}</h2>
                <p>Configure slide headline, subtitle, background image, and call-to-action button.</p>
              </div>
              <button type="button" className="icon-button" onClick={closeModal}><X size={18} /></button>
            </div>

            <form onSubmit={saveBanner} className="cms-modal-form">
              <div className="cms-field">
                <label>Banner Title *</label>
                <input
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Uplifting Lives with Dignity & Compassion"
                  required
                />
              </div>

              <div className="cms-field">
                <label>Subtitle</label>
                <textarea
                  rows={3}
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm((p) => ({ ...p, subtitle: e.target.value }))}
                  placeholder="Brief mission-focused subtitle shown under the headline"
                />
              </div>

              <div className="cms-field">
                <label>Banner Image (Upload or Paste URL)</label>
                <div className="cms-upload-row">
                  <input
                    value={bannerForm.imageUrl}
                    onChange={(e) => setBannerForm((p) => ({ ...p, imageUrl: e.target.value }))}
                    placeholder="https://... or /uploads/cms/..."
                  />
                  <label className="secondary-button cms-upload-btn">
                    <Upload size={14} />
                    {uploadingImage ? "Uploading…" : "Upload"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={(e) => handleImageUpload(e, "banner")}
                      hidden
                    />
                  </label>
                </div>
                {bannerForm.imageUrl && (
                  <div className="cms-preview-box">
                    <img src={resolveMediaUrl(bannerForm.imageUrl)} alt="Banner preview" />
                  </div>
                )}
              </div>

              <div className="cms-field">
                <label>Banner Layout</label>
                <select
                  value={bannerForm.layoutType}
                  onChange={(e) => setBannerForm((p) => ({ ...p, layoutType: e.target.value }))}
                >
                  <option value="BACKGROUND">Full Background Image / Gradient</option>
                  <option value="SIDE_BY_SIDE">Text Left + Side-by-Side Image Right</option>
                </select>
              </div>

              <div className="cms-form-two-col">
                <div className="cms-field">
                  <label>CTA Button Label</label>
                  <input
                    value={bannerForm.ctaLabel}
                    onChange={(e) => setBannerForm((p) => ({ ...p, ctaLabel: e.target.value }))}
                    placeholder="e.g. Become a Member"
                  />
                </div>
                <div className="cms-field">
                  <label>CTA Link</label>
                  <input
                    value={bannerForm.ctaLink}
                    onChange={(e) => setBannerForm((p) => ({ ...p, ctaLink: e.target.value }))}
                    placeholder="e.g. /register"
                  />
                </div>
              </div>

              <label className="cms-checkbox-row">
                <input
                  type="checkbox"
                  checked={bannerForm.isActive}
                  onChange={(e) => setBannerForm((p) => ({ ...p, isActive: e.target.checked }))}
                />
                <span>Active (visible on public Home Page)</span>
              </label>

              <div className="cms-modal-footer">
                <button type="button" className="secondary-button" onClick={closeModal}>Cancel</button>
                <button type="submit" className="primary-button" disabled={busy || uploadingImage}>
                  <CheckCircle2 size={15} /> {busy ? "Saving…" : "Save Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CONTENT ITEM ─────────────────────────────────── */}
      {modalMode === "item" && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="detail-modal">
            <div className="modal-heading">
              <div>
                <h2>{editingId ? "Edit Content Item" : "Add Content Item"}</h2>
                <p>Section: {TABS.find((t) => t.key === activeTab)?.label}</p>
              </div>
              <button type="button" className="icon-button" onClick={closeModal}><X size={18} /></button>
            </div>

            <form onSubmit={saveItem} className="cms-modal-form">
              <div className="cms-field">
                <label>{activeTab === "TICKER" ? "Headline Text *" : "Title *"}</label>
                <input
                  value={itemForm.title}
                  onChange={(e) => setItemForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder={activeTab === "TICKER" ? "Enter news ticker headline" : "Enter section or card title"}
                  required
                />
              </div>

              {activeTab !== "TICKER" && (
                <div className="cms-form-two-col">
                  <div className="cms-field">
                    <label>{activeTab === "IMPACT" ? "Metric Value (e.g. 15,000+)" : "Eyebrow / Subtitle"}</label>
                    {activeTab === "IMPACT" ? (
                      <input
                        value={itemForm.metricValue}
                        onChange={(e) => setItemForm((p) => ({ ...p, metricValue: e.target.value }))}
                        placeholder="e.g. 15,000+"
                      />
                    ) : (
                      <input
                        value={itemForm.subtitle}
                        onChange={(e) => setItemForm((p) => ({ ...p, subtitle: e.target.value }))}
                        placeholder="e.g. YOUTH EMPOWERMENT"
                      />
                    )}
                  </div>

                  <div className="cms-field">
                    <label>Icon</label>
                    <select
                      value={itemForm.icon}
                      onChange={(e) => setItemForm((p) => ({ ...p, icon: e.target.value }))}
                    >
                      {ICON_OPTIONS.map((iconName) => (
                        <option key={iconName} value={iconName}>{iconName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {activeTab !== "TICKER" && (
                <div className="cms-field">
                  <label>Description</label>
                  <textarea
                    rows={3}
                    value={itemForm.description}
                    onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Detailed description"
                  />
                </div>
              )}

              {activeTab === "ABOUT" && (
                <div className="cms-field">
                  <label>About Section Image (Optional Upload or URL)</label>
                  <div className="cms-upload-row">
                    <input
                      value={itemForm.imageUrl}
                      onChange={(e) => setItemForm((p) => ({ ...p, imageUrl: e.target.value }))}
                      placeholder="https://... or /uploads/cms/..."
                    />
                    <label className="secondary-button cms-upload-btn">
                      <Upload size={14} />
                      {uploadingImage ? "Uploading…" : "Upload"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={(e) => handleImageUpload(e, "item")}
                        hidden
                      />
                    </label>
                  </div>
                </div>
              )}

              {activeTab !== "IMPACT" && (
                <div className="cms-form-two-col">
                  {activeTab !== "TICKER" && (
                    <div className="cms-field">
                      <label>CTA Label</label>
                      <input
                        value={itemForm.ctaLabel}
                        onChange={(e) => setItemForm((p) => ({ ...p, ctaLabel: e.target.value }))}
                        placeholder="e.g. Learn More"
                      />
                    </div>
                  )}
                  <div className="cms-field">
                    <label>{activeTab === "TICKER" ? "Optional Link" : "CTA Link"}</label>
                    <input
                      value={itemForm.ctaLink}
                      onChange={(e) => setItemForm((p) => ({ ...p, ctaLink: e.target.value }))}
                      placeholder="e.g. /register"
                    />
                  </div>
                </div>
              )}

              <label className="cms-checkbox-row">
                <input
                  type="checkbox"
                  checked={itemForm.isActive}
                  onChange={(e) => setItemForm((p) => ({ ...p, isActive: e.target.checked }))}
                />
                <span>Active (visible on public Home Page)</span>
              </label>

              <div className="cms-modal-footer">
                <button type="button" className="secondary-button" onClick={closeModal}>Cancel</button>
                <button type="submit" className="primary-button" disabled={busy || uploadingImage}>
                  <CheckCircle2 size={15} /> {busy ? "Saving…" : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
