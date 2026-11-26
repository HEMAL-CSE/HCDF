import { ArrowRight } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { DynamicIcon, FALLBACK_HOME, SmartActionLink } from "../utils/publicHome.jsx";

export default function ProgrammesPage() {
  const { homeData, copy } = useOutletContext();
  const programmes = homeData?.programmes?.length ? homeData.programmes : FALLBACK_HOME.programmes;

  return (
    <>
      <section className="public-page-banner public-banner-navy">
        <div className="hcdf-container">
          <div className="eyebrow light-eyebrow"><span /> {copy.programmesEyebrow}</div>
          <h1>{copy.programmesHeading}</h1>
          <p>{copy.programmesLead}</p>
        </div>
      </section>

      <section className="landing-section public-surface-soft">
        <div className="hcdf-container">
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
    </>
  );
}
