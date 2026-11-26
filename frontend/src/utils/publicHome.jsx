import {
  Award, BookOpen, Globe, GraduationCap, HeartHandshake,
  ShieldCheck, Stethoscope, UserCheck, Users
} from "lucide-react";
import { Link } from "react-router-dom";

const ICON_MAP = {
  HeartHandshake,
  GraduationCap,
  BookOpen,
  Stethoscope,
  ShieldCheck,
  Users,
  UserCheck,
  Globe,
  Award
};

export function DynamicIcon({ name, size = 24 }) {
  const Icon = ICON_MAP[name] || HeartHandshake;
  return <Icon size={size} />;
}

export function SmartActionLink({ to, className, children }) {
  if (!to) return null;
  if (to.startsWith("http://") || to.startsWith("https://")) {
    return <a href={to} target="_blank" rel="noreferrer" className={className}>{children}</a>;
  }
  return <Link to={to} className={className}>{children}</Link>;
}

export const FALLBACK_HOME = {
  banners: [
    {
      id: "fallback-b1",
      title: "Uplifting Lives with Dignity & Compassion",
      subtitle: "Human Charity Dignity Foundation (HCDF) empowers vulnerable families, meritorious students, and rural communities through sustainable humanitarian programmes.",
      imageUrl: null,
      ctaLabel: "Become a Member",
      ctaLink: "/register",
      layoutType: "BACKGROUND"
    },
    {
      id: "fallback-b2",
      title: "Empowering Youth Through Education & Skills",
      subtitle: "From scholarships and community learning centres to vocational training, we invest in long-term self-reliance across communities.",
      imageUrl: null,
      ctaLabel: "Member Portal",
      ctaLink: "/member/login",
      layoutType: "SIDE_BY_SIDE"
    },
    {
      id: "fallback-b3",
      title: "Rapid Humanitarian Relief When It Matters Most",
      subtitle: "Delivering emergency food, clean water, shelter, and healthcare support with 100% transparent accountability.",
      imageUrl: null,
      ctaLabel: "Join Our Mission",
      ctaLink: "/register",
      layoutType: "BACKGROUND"
    }
  ],
  about: [
    {
      id: "fallback-about",
      title: "A Foundation Built on Human Dignity",
      subtitle: "WHO WE ARE",
      description: "Human Charity Dignity Foundation (HCDF) is a dedicated non-profit humanitarian and social development organisation. Inspired by grassroots community welfare, we bridge immediate relief with long-term empowerment—ensuring every family, student, and elder is supported with respect, transparency, and lasting opportunity.",
      metricValue: "Since 2018",
      icon: "HeartHandshake",
      imageUrl: null,
      ctaLabel: "Register as Member",
      ctaLink: "/register"
    }
  ],
  programmes: [
    {
      id: "fallback-p1",
      title: "Humanitarian Aid & Relief",
      subtitle: "EMERGENCY RESPONSE",
      description: "Rapid food security packages, seasonal winter relief, emergency shelter, and essential household support for families facing crisis.",
      icon: "HeartHandshake",
      ctaLabel: "Support Relief",
      ctaLink: "/register"
    },
    {
      id: "fallback-p2",
      title: "Education & Talent Assistance",
      subtitle: "YOUTH EMPOWERMENT",
      description: "Scholarships, school supplies, and rural library enrichment empowering meritorious yet disadvantaged students to thrive.",
      icon: "GraduationCap",
      ctaLabel: "Learn More",
      ctaLink: "/register"
    },
    {
      id: "fallback-p3",
      title: "Community Health & Livelihoods",
      subtitle: "SUSTAINABLE GROWTH",
      description: "Primary health camps, maternal care awareness, and vocational skill-building workshops fostering self-reliant households.",
      icon: "Stethoscope",
      ctaLabel: "Get Involved",
      ctaLink: "/register"
    },
    {
      id: "fallback-p4",
      title: "Dignity & Social Rights",
      subtitle: "COMMUNITY ADVOCACY",
      description: "Protecting fundamental human dignity through community awareness, inclusive welfare access, and partner-led social support.",
      icon: "ShieldCheck",
      ctaLabel: "Join HCDF",
      ctaLink: "/register"
    }
  ],
  impact: [
    { id: "fallback-i1", metricValue: "15,000+", title: "Lives Impacted", subtitle: "Across vulnerable communities", icon: "Users" },
    { id: "fallback-i2", metricValue: "5,200+", title: "Active Members", subtitle: "Serving on the ground", icon: "UserCheck" },
    { id: "fallback-i3", metricValue: "12", title: "Core Programmes", subtitle: "Education, health & relief", icon: "Globe" },
    { id: "fallback-i4", metricValue: "100%", title: "Transparency", subtitle: "Audited & role-governed", icon: "Award" }
  ],
  ticker: [
    { id: "fallback-t1", title: "Welcome new members and volunteers to HCDF — thank you for championing human dignity.", ctaLink: "/register" },
    { id: "fallback-t2", title: "100% transparent humanitarian operations: every programme is tracked and verified.", ctaLink: null },
    { id: "fallback-t3", title: "Education & Talent Assistance applications open for deserving students.", ctaLink: "/register" },
    { id: "fallback-t4", title: "Approved members can sign in anytime via the HCDF Member Portal.", ctaLink: "/member/login" }
  ]
};

export const PUBLIC_COPY = {
  en: {
    brandFull: "Human Charity Dignity Foundation",
    staffPortal: "Staff / Admin Portal",
    workspace: "Go to Workspace",
    navHome: "Home",
    navAbout: "About",
    navProgrammes: "Programmes",
    navImpact: "Impact",
    navJoin: "Join Us",
    memberLogin: "Member Login",
    register: "Register",
    staffSignIn: "Staff Sign In",
    dashboard: "Dashboard",
    liveUpdates: "Live Updates",
    memberPortal: "Member Portal",
    programmesEyebrow: "OUR CORE PROGRAMMES",
    programmesHeading: "Humanitarian work creating lasting change",
    programmesLead: "Structured, accountable programmes addressing urgent relief alongside education, health, and community resilience.",
    impactEyebrow: "MEASURABLE IMPACT",
    impactHeading: "Transparency & community reach",
    impactLead: "Every initiative is monitored and reported with clear accountability across our member and volunteer network.",
    joinEyebrow: "JOIN THE MISSION",
    joinHeading: "Be part of a compassionate future",
    joinSub: "Register as a member to collaborate with HCDF, access your personal membership portal, and support humanitarian initiatives across communities.",
    registerMember: "Register as Member",
    alreadyMember: "Already a member? Sign in",
    quickLinks: "Quick Links",
    portalsAccess: "Portals & Access",
    footerAbout: "A non-profit humanitarian and social development foundation dedicated to uplifting vulnerable communities with dignity, compassion, and transparent governance.",
    rightsReserved: "All rights reserved.",
    developedBy: "System development by"
  },
  bn: {
    brandFull: "হিউম্যান চ্যারিটি ডিগনিটি ফাউন্ডেশন",
    staffPortal: "স্টাফ / অ্যাডমিন পোর্টাল",
    workspace: "ওয়ার্কস্পেসে যান",
    navHome: "হোম",
    navAbout: "আমাদের সম্পর্কে",
    navProgrammes: "কার্যক্রম",
    navImpact: "প্রভাব",
    navJoin: "যুক্ত হোন",
    memberLogin: "মেম্বার লগইন",
    register: "নিবন্ধন",
    staffSignIn: "স্টাফ সাইন ইন",
    dashboard: "ড্যাশবোর্ড",
    liveUpdates: "সর্বশেষ আপডেট",
    memberPortal: "মেম্বার পোর্টাল",
    programmesEyebrow: "আমাদের মূল কার্যক্রম",
    programmesHeading: "স্থায়ী পরিবর্তনে মানবিক উদ্যোগ",
    programmesLead: "জরুরি ত্রাণ সহায়তার পাশাপাশি শিক্ষা, স্বাস্থ্য ও সামাজিক সক্ষমতা বৃদ্ধিতে আমাদের সুসংগঠিত কার্যক্রম।",
    impactEyebrow: "আমাদের প্রভাব",
    impactHeading: "স্বচ্ছতা ও সামাজিক অগ্রগতি",
    impactLead: "আমাদের সদস্য ও স্বেচ্ছাসেবক নেটওয়ার্কের মাধ্যমে প্রতিটি উদ্যোগ স্বচ্ছতার সাথে পরিচালিত ও মূল্যায়িত হয়।",
    joinEyebrow: "আমাদের সাথে যুক্ত হোন",
    joinHeading: "সহমর্মী ভবিষ্যতের অংশ হোন",
    joinSub: "এইচসিডিএফ-এর সদস্য হিসেবে নিবন্ধন করুন, আপনার মেম্বার পোর্টাল ব্যবহার করুন এবং মানবিক কার্যক্রমে অবদান রাখুন।",
    registerMember: "সদস্য হিসেবে নিবন্ধন করুন",
    alreadyMember: "ইতিমধ্যে সদস্য? সাইন ইন করুন",
    quickLinks: "দ্রুত লিংক",
    portalsAccess: "পোর্টাল ও প্রবেশ",
    footerAbout: "মর্যাদা, সহমর্মিতা ও স্বচ্ছ পরিচালনার মাধ্যমে সুবিধাবঞ্চিত মানুষের কল্যাণে নিবেদিত একটি অলাভজনক মানবিক ও সামাজিক উন্নয়ন সংস্থা।",
    rightsReserved: "সর্বস্বত্ব সংরক্ষিত।",
    developedBy: "সিস্টেম ডেভেলপমেন্টে"
  }
};
