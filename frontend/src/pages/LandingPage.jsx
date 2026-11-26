import { useEffect, useState } from "react";
import {
  ArrowRight, Award, ChevronLeft, ChevronRight, HeartHandshake,
  ShieldCheck, UserRound
} from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { resolveMediaUrl } from "../api/client.js";
import { DynamicIcon, FALLBACK_HOME, SmartActionLink } from "../utils/publicHome.jsx";

export default function LandingPage() {
  const { homeData, copy } = useOutletContext();
  const [slideIndex, setSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const banners = homeData?.banners?.length ? homeData.banners : FALLBACK_HOME.banners;
  const aboutData = homeData?.about?.[0] || FALLBACK_HOME.about[0];
  const programmes = homeData?.programmes?.length ? homeData.programmes : FALLBACK_HOME.programmes;
  const impact = homeData?.impact?.length ? homeData.impact : FALLBACK_HOME.impact;
  const totalSlides = banners.length;

  useEffect(() => {
    setSlideIndex(0);
  }, [totalSlides]);

  useEffect(() => {
    if (paused || totalSlides <= 1) return undefined;
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % totalSlides);
    }, 6000);
    return () => clearInterval(timer);
  }, [paused, totalSlides]);

  const activeSlide = banners[slideIndex % totalSlides] || banners[0];
  const isSideBySide = activeSlide?.layoutType === "SIDE_BY_SIDE";

  return (
    <>
      {/* ── HERO BANNER SLIDER ────────────────────────────────────── */}
      <section
        className={`hcdf-hero-slider ${isSideBySide ? "hcdf-hero-side-mode" : ""}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {!isSideBySide && activeSlide?.imageUrl && (
          <div
            className="hcdf-hero-bg-image"
            style={{ backgroundImage: `url(${resolveMediaUrl(activeSlide.imageUrl)})` }}
          />
        )}
        <div className="hcdf-hero-overlay" />
        <div className="landing-hero-bg-orb orb-one" />
        <div className="landing-hero-bg-orb orb-two" />

        <div className="hcdf-container hcdf-hero-inner">
          <div className={isSideBySide ? "hcdf-hero-split" : "hcdf-hero-single"}>
            <div className="hcdf-hero-copy">
              <div className="eyebrow light-eyebrow"><span /> HUMAN CHARITY DIGNITY FOUNDATION</div>
              <h1 className="landing-hero-h1">{activeSlide?.title}</h1>
              {activeSlide?.subtitle && (
                <p className="landing-hero-sub">{activeSlide.subtitle}</p>
              )}
              <div className="landing-cta-group">
                {activeSlide?.ctaLabel && activeSlide?.ctaLink ? (
                  <SmartActionLink to={activeSlide.ctaLink} className="primary-button landing-cta-primary">
                    {activeSlide.ctaLabel} <ArrowRight size={17} />
                  </SmartActionLink>
                ) : (
                  <Link to="/register" className="primary-button landing-cta-primary">
                    {copy.registerMember} <ArrowRight size={17} />
                  </Link>
                )}
                <Link to="/member/login" className="landing-cta-secondary">
                  <UserRound size={17} /> {copy.memberPortal}
                </Link>
              </div>
            </div>

            {isSideBySide && (
              <div className="hcdf-hero-media">
                {activeSlide?.imageUrl ? (
                  <img
                    src={resolveMediaUrl(activeSlide.imageUrl)}
                    alt={activeSlide.title}
                    className="hcdf-hero-side-img"
                  />
                ) : (
                  <div className="hcdf-hero-side-card">
                    <HeartHandshake size={38} />
                    <h3>{copy.brandFull}</h3>
                    <p>{copy.footerAbout}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {totalSlides > 1 && (
          <>
            <button
              type="button"
              className="hcdf-slider-arrow prev"
              aria-label="Previous slide"
              onClick={() => setSlideIndex((prev) => (prev - 1 + totalSlides) % totalSlides)}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              className="hcdf-slider-arrow next"
              aria-label="Next slide"
              onClick={() => setSlideIndex((prev) => (prev + 1) % totalSlides)}
            >
              <ChevronRight size={22} />
            </button>
            <div className="hcdf-slider-dots" role="tablist" aria-label="Banner slides">
              {banners.map((b, idx) => (
                <button
                  key={b.id || idx}
                  type="button"
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`hcdf-slider-dot ${idx === slideIndex ? "active" : ""}`}
                  onClick={() => setSlideIndex(idx)}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── IMPACT COUNTERS BAR (LIGHT SLATE BAND) ────────────────── */}
      <section id="impact" className="hcdf-impact-wrap public-surface-soft">
        <div className="hcdf-container">
          <div className="hcdf-impact-grid">
            {impact.map((item) => (
              <div key={item.id} className="hcdf-impact-card">
                <div className="hcdf-impact-icon">
                  <DynamicIcon name={item.icon} size={22} />
                </div>
                <div className="hcdf-impact-meta">
                  <strong>{item.metricValue || "—"}</strong>
                  <span>{item.title}</span>
                  {item.subtitle && <small>{item.subtitle}</small>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT HCDF SECTION (CRISP WHITE SURFACE) ──────────────── */}
      <section id="about" className="landing-section public-surface-white">
        <div className="hcdf-container hcdf-about-grid">
          <div className="hcdf-about-text">
            <div className="eyebrow">{aboutData.subtitle || "WHO WE ARE"}</div>
            <h2 className="landing-section-h2">{aboutData.title}</h2>
            <p className="landing-section-body">{aboutData.description}</p>
            <div className="hcdf-pillars">
              <div className="hcdf-pillar">
                <ShieldCheck size={18} />
                <div>
                  <strong>Dignity First</strong>
                  <span>Respectful, people-centred humanitarian service</span>
                </div>
              </div>
              <div className="hcdf-pillar">
                <Award size={18} />
                <div>
                  <strong>100% Accountability</strong>
                  <span>Role-governed operations &amp; transparent reporting</span>
                </div>
              </div>
            </div>
            <div className="hcdf-about-actions">
              {aboutData.ctaLabel && aboutData.ctaLink && (
                <SmartActionLink to={aboutData.ctaLink} className="primary-button hcdf-about-cta">
                  {aboutData.ctaLabel} <ArrowRight size={16} />
                </SmartActionLink>
              )}
              <Link to="/about" className="secondary-button">
                {copy.navAbout} <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          <div className="hcdf-about-visual">
            {aboutData.imageUrl ? (
              <img src={resolveMediaUrl(aboutData.imageUrl)} alt={aboutData.title} className="hcdf-about-img" />
            ) : (
              <div className="hcdf-mission-card">
                <div className="hcdf-mission-badge">{aboutData.metricValue || "HCDF Mission"}</div>
                <h3>Empowering Communities, Restoring Hope</h3>
                <p>
                  Every initiative—from emergency relief and student scholarships to community health—is
                  delivered directly with local participation and verifiable oversight.
                </p>
                <div className="hcdf-mission-tags">
                  <span>Humanitarian Relief</span>
                  <span>Education</span>
                  <span>Healthcare</span>
                  <span>Social Dignity</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CORE PROGRAMMES SECTION (WARM SLATE SURFACE) ──────────── */}
      <section id="programmes" className="landing-section public-surface-soft">
        <div className="hcdf-container">
          <div className="hcdf-section-head">
            <div className="eyebrow">{copy.programmesEyebrow}</div>
            <h2 className="landing-section-h2">{copy.programmesHeading}</h2>
            <p className="hcdf-section-lead">{copy.programmesLead}</p>
          </div>

          <div className="hcdf-programmes-grid">
            {programmes.map((prog, index) => (
              <article key={prog.id} className={`hcdf-prog-card hcdf-prog-accent-${index % 4}`}>
                <div className="hcdf-prog-top">
                  <div className="landing-card-icon">
                    <DynamicIcon name={prog.icon} size={24} />
                  </div>
                  {prog.subtitle && <span className="hcdf-prog-tag">{prog.subtitle}</span>}
                </div>
                <h3 className="landing-card-title">{prog.title}</h3>
                <p className="landing-card-desc">{prog.description}</p>
                {prog.ctaLabel && prog.ctaLink && (
                  <SmartActionLink to={prog.ctaLink} className="hcdf-prog-link">
                    {prog.ctaLabel} <ArrowRight size={14} />
                  </SmartActionLink>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION / JOIN US (DEEP NAVY-TEAL CONTRAST) ─────── */}
      <section id="join" className="landing-join hcdf-join-navy">
        <div className="hcdf-container landing-join-inner">
          <div className="eyebrow light-eyebrow" style={{ justifyContent: "center" }}>
            <span /> {copy.joinEyebrow}
          </div>
          <h2 className="landing-join-h2">{copy.joinHeading}</h2>
          <p className="landing-join-sub">{copy.joinSub}</p>
          <div className="landing-cta-group">
            <Link to="/register" className="primary-button landing-cta-primary landing-cta-invert">
              {copy.registerMember} <ArrowRight size={17} />
            </Link>
            <Link to="/member/login" className="landing-cta-ghost">
              {copy.alreadyMember}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
