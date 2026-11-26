export const DEFAULT_HERO_BANNERS = [
  {
    id: "default-banner-1",
    title: "Uplifting Lives with Dignity & Compassion",
    subtitle: "Human Charity Dignity Foundation (HCDF) empowers vulnerable families, meritorious students, and rural communities through sustainable humanitarian programmes.",
    imageUrl: null,
    ctaLabel: "Become a Member",
    ctaLink: "/register",
    layoutType: "BACKGROUND",
    sortOrder: 1,
    isActive: true
  },
  {
    id: "default-banner-2",
    title: "Empowering Youth Through Education & Skills",
    subtitle: "From scholarships and community learning centres to vocational training, we invest in long-term self-reliance across communities.",
    imageUrl: null,
    ctaLabel: "Member Portal",
    ctaLink: "/member/login",
    layoutType: "SIDE_BY_SIDE",
    sortOrder: 2,
    isActive: true
  },
  {
    id: "default-banner-3",
    title: "Rapid Humanitarian Relief When It Matters Most",
    subtitle: "Delivering emergency food, clean water, shelter, and healthcare support with 100% transparent accountability.",
    imageUrl: null,
    ctaLabel: "Join Our Mission",
    ctaLink: "/register",
    layoutType: "BACKGROUND",
    sortOrder: 3,
    isActive: true
  }
];

export const DEFAULT_ABOUT_ITEMS = [
  {
    id: "default-about-1",
    sectionType: "ABOUT",
    title: "A Foundation Built on Human Dignity",
    subtitle: "WHO WE ARE",
    description: "Human Charity Dignity Foundation (HCDF) is a dedicated non-profit humanitarian and social development organisation. Inspired by grassroots community welfare, we bridge immediate relief with long-term empowerment—ensuring every family, student, and elder is supported with respect, transparency, and lasting opportunity.",
    metricValue: "Since 2018",
    icon: "HeartHandshake",
    imageUrl: null,
    ctaLabel: "Register as Member",
    ctaLink: "/register",
    sortOrder: 1,
    isActive: true
  }
];

export const DEFAULT_PROGRAMME_ITEMS = [
  {
    id: "default-prog-1",
    sectionType: "PROGRAMME",
    title: "Humanitarian Aid & Relief",
    subtitle: "EMERGENCY RESPONSE",
    description: "Rapid food security packages, seasonal winter relief, emergency shelter, and essential household support for families facing crisis.",
    icon: "HeartHandshake",
    imageUrl: null,
    ctaLabel: "Support Relief",
    ctaLink: "/register",
    sortOrder: 1,
    isActive: true
  },
  {
    id: "default-prog-2",
    sectionType: "PROGRAMME",
    title: "Education & Talent Assistance",
    subtitle: "YOUTH EMPOWERMENT",
    description: "Scholarships, school supplies, and rural library enrichment empowering meritorious yet disadvantaged students to thrive.",
    icon: "GraduationCap",
    imageUrl: null,
    ctaLabel: "Learn More",
    ctaLink: "/register",
    sortOrder: 2,
    isActive: true
  },
  {
    id: "default-prog-3",
    sectionType: "PROGRAMME",
    title: "Community Health & Livelihoods",
    subtitle: "SUSTAINABLE GROWTH",
    description: "Primary health camps, maternal care awareness, and vocational skill-building workshops fostering self-reliant households.",
    icon: "Stethoscope",
    imageUrl: null,
    ctaLabel: "Get Involved",
    ctaLink: "/register",
    sortOrder: 3,
    isActive: true
  },
  {
    id: "default-prog-4",
    sectionType: "PROGRAMME",
    title: "Dignity & Social Rights",
    subtitle: "COMMUNITY ADVOCACY",
    description: "Protecting fundamental human dignity through community awareness, inclusive welfare access, and partner-led social support.",
    icon: "ShieldCheck",
    imageUrl: null,
    ctaLabel: "Join HCDF",
    ctaLink: "/register",
    sortOrder: 4,
    isActive: true
  }
];

export const DEFAULT_IMPACT_ITEMS = [
  {
    id: "default-impact-1",
    sectionType: "IMPACT",
    title: "Lives Impacted",
    subtitle: "Across vulnerable communities",
    description: "Direct beneficiaries reached through relief and welfare initiatives",
    metricValue: "15,000+",
    icon: "Users",
    sortOrder: 1,
    isActive: true
  },
  {
    id: "default-impact-2",
    sectionType: "IMPACT",
    title: "Active Members & Volunteers",
    subtitle: "Serving on the ground",
    description: "Dedicated members driving community programmes nationwide",
    metricValue: "5,200+",
    icon: "UserCheck",
    sortOrder: 2,
    isActive: true
  },
  {
    id: "default-impact-3",
    sectionType: "IMPACT",
    title: "Core Programmes",
    subtitle: "Education, health & relief",
    description: "Active humanitarian and community development tracks",
    metricValue: "12",
    icon: "Globe",
    sortOrder: 3,
    isActive: true
  },
  {
    id: "default-impact-4",
    sectionType: "IMPACT",
    title: "Transparent Accountability",
    subtitle: "Audited & role-governed",
    description: "Every contribution tracked with full institutional integrity",
    metricValue: "100%",
    icon: "Award",
    sortOrder: 4,
    isActive: true
  }
];

export const DEFAULT_TICKER_ITEMS = [
  {
    id: "default-ticker-1",
    sectionType: "TICKER",
    title: "Welcome new members and volunteers to HCDF — thank you for championing human dignity.",
    ctaLink: "/register",
    sortOrder: 1,
    isActive: true
  },
  {
    id: "default-ticker-2",
    sectionType: "TICKER",
    title: "100% transparent humanitarian operations: every programme is tracked and verified.",
    ctaLink: null,
    sortOrder: 2,
    isActive: true
  },
  {
    id: "default-ticker-3",
    sectionType: "TICKER",
    title: "Education & Talent Assistance applications open for deserving students.",
    ctaLink: "/register",
    sortOrder: 3,
    isActive: true
  },
  {
    id: "default-ticker-4",
    sectionType: "TICKER",
    title: "Approved members can sign in anytime via the HCDF Member Portal.",
    ctaLink: "/member/login",
    sortOrder: 4,
    isActive: true
  }
];

export function getHomeDefaults() {
  return {
    banners: DEFAULT_HERO_BANNERS,
    about: DEFAULT_ABOUT_ITEMS,
    programmes: DEFAULT_PROGRAMME_ITEMS,
    impact: DEFAULT_IMPACT_ITEMS,
    ticker: DEFAULT_TICKER_ITEMS
  };
}
