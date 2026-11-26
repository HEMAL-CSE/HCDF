import { ArrowRight, Award, HeartHandshake, ShieldCheck } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { resolveMediaUrl } from "../api/client.js";
import { FALLBACK_HOME, SmartActionLink } from "../utils/publicHome.jsx";

export default function AboutPage() {
  const { homeData, copy } = useOutletContext();
  const aboutData = homeData?.about?.[0] || FALLBACK_HOME.about[0];

  return (
    <>
      <section className="public-page-banner">
        <div className="hcdf-container">
          <div className="eyebrow light-eyebrow"><span /> {aboutData.subtitle || copy.navAbout}</div>
          <h1>{aboutData.title}</h1>
          <p>{copy.brandFull} — {copy.footerAbout}</p>
        </div>
      </section>

      <section className="landing-section public-surface-white">
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
            {aboutData.ctaLabel && aboutData.ctaLink && (
              <SmartActionLink to={aboutData.ctaLink} className="primary-button hcdf-about-cta">
                {aboutData.ctaLabel} <ArrowRight size={16} />
              </SmartActionLink>
            )}
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

      <section className="landing-section public-surface-soft">
        <div className="hcdf-container">
          <div className="hcdf-about-values">
            <div className="hcdf-value-box">
              <HeartHandshake size={24} />
              <h3>Compassion in Action</h3>
              <p>Immediate humanitarian assistance delivered with empathy and respect for every household.</p>
            </div>
            <div className="hcdf-value-box">
              <ShieldCheck size={24} />
              <h3>Institutional Integrity</h3>
              <p>Clear role-based governance and audited member &amp; programme records.</p>
            </div>
            <div className="hcdf-value-box">
              <Award size={24} />
              <h3>Lasting Empowerment</h3>
              <p>Investing in education, library enrichment, and skills so communities thrive independently.</p>
            </div>
          </div>
          <div style={{ marginTop: 28 }}>
            <Link to="/programmes" className="primary-button hcdf-about-cta">
              {copy.navProgrammes} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
