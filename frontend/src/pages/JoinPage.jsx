import { ArrowRight, CheckCircle2, ShieldCheck, UserRound } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";

export default function JoinPage() {
  const { copy } = useOutletContext();

  return (
    <>
      <section className="public-page-banner public-banner-navy">
        <div className="hcdf-container">
          <div className="eyebrow light-eyebrow"><span /> {copy.joinEyebrow}</div>
          <h1>{copy.joinHeading}</h1>
          <p>{copy.joinSub}</p>
        </div>
      </section>

      <section className="landing-section public-surface-soft">
        <div className="hcdf-container hcdf-join-cards">
          <div className="hcdf-join-option-card">
            <div className="hcdf-impact-icon"><UserRound size={22} /></div>
            <h3>{copy.registerMember}</h3>
            <p>Submit your membership application to join HCDF&apos;s community network. Applications are reviewed and approved by our administration team.</p>
            <ul>
              <li><CheckCircle2 size={15} /> Personal Member Portal access</li>
              <li><CheckCircle2 size={15} /> Programme participation &amp; updates</li>
              <li><CheckCircle2 size={15} /> Verified role-protected profile</li>
            </ul>
            <Link to="/register" className="primary-button hcdf-about-cta">
              {copy.registerMember} <ArrowRight size={16} />
            </Link>
          </div>

          <div className="hcdf-join-option-card">
            <div className="hcdf-impact-icon"><ShieldCheck size={22} /></div>
            <h3>{copy.memberPortal}</h3>
            <p>Already an approved HCDF member? Sign in securely to manage your profile and stay connected with active programmes.</p>
            <ul>
              <li><CheckCircle2 size={15} /> Sign in with email or phone</li>
              <li><CheckCircle2 size={15} /> Update contact &amp; profile details</li>
              <li><CheckCircle2 size={15} /> Direct access to HCDF services</li>
            </ul>
            <Link to="/member/login" className="secondary-button hcdf-join-secondary-btn">
              {copy.memberLogin} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
