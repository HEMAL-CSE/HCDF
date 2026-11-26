import { ArrowRight } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { DynamicIcon, FALLBACK_HOME } from "../utils/publicHome.jsx";

export default function ImpactPage() {
  const { homeData, copy } = useOutletContext();
  const impact = homeData?.impact?.length ? homeData.impact : FALLBACK_HOME.impact;

  return (
    <>
      <section className="public-page-banner">
        <div className="hcdf-container">
          <div className="eyebrow light-eyebrow"><span /> {copy.impactEyebrow}</div>
          <h1>{copy.impactHeading}</h1>
          <p>{copy.impactLead}</p>
        </div>
      </section>

      <section className="landing-section public-surface-white">
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
                  {item.description && <small style={{ marginTop: 6 }}>{item.description}</small>}
                </div>
              </div>
            ))}
          </div>

          <div className="public-cta-strip">
            <div>
              <h2>{copy.joinHeading}</h2>
              <p>{copy.joinSub}</p>
            </div>
            <Link to="/register" className="primary-button hcdf-about-cta">
              {copy.registerMember} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
