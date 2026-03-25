"use client";

import { useState } from "react";
import {
  Globe,
  Search,
  Mail,
  Linkedin,
  Phone,
  TrendingUp,
  Newspaper,
  Briefcase,
  Share2,
  FileText,
  Cpu,
  Shield,
  MapPin,
  Database,
  Rocket,
  CreditCard,
  Users,
  BarChart3,
  Zap,
  Lock,
  Eye,
  Building2,
  type LucideIcon,
} from "lucide-react";

// ── Source definitions ─────────────────────────────────────────────────────────

type SourceStatus = "active" | "coming_soon" | "requires_payment";

interface Source {
  id: string;
  name: string;
  icon: LucideIcon;
  status: SourceStatus;
  category: string;
  description: string;
  tooltip: string;
  dataProvided: string[];
  color: string;
}

const SOURCES: Source[] = [
  // ── Active Free Sources ──────────────────────────────────────────────────
  {
    id: "company-website",
    name: "Website Scraper",
    icon: Globe,
    status: "active",
    category: "Company Intel",
    description: "Deep-scrapes company websites with 8 extraction methods",
    tooltip:
      "Crawls company homepages using Chrome user-agent. Extracts phones from tel: links, JSON-LD structured data, meta tags, phone-class elements, footer/header sections, labeled text patterns, and full body scan. Also pulls emails, social links, and company description.",
    dataProvided: ["Phone (HQ)", "Email", "Social links", "Company description", "Address"],
    color: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  },
  {
    id: "google-business",
    name: "Google Business Profile",
    icon: MapPin,
    status: "active",
    category: "Company Intel",
    description: "3-tier search strategy for business listings",
    tooltip:
      "Tier 1: DuckDuckGo search for company + phone/contact. Tier 2: BBB and Yelp profile lookup. Tier 3: Direct Google business listing scrape. Finds phone numbers, addresses, hours, and reviews that aren't on the company website.",
    dataProvided: ["Phone", "Address", "Business hours", "Reviews"],
    color: "from-green-500/20 to-green-600/10 border-green-500/30",
  },
  {
    id: "web-search",
    name: "Web Search (DDG)",
    icon: Search,
    status: "active",
    category: "Company Intel",
    description: "DuckDuckGo search for company intelligence",
    tooltip:
      "Searches DuckDuckGo for company info, press releases, directory listings, and contact pages. Pulls structured data from search results. Automatically throttles to avoid rate limits (5s+ delay).",
    dataProvided: ["Company info", "Directory listings", "Press mentions"],
    color: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
  },
  {
    id: "email-discovery",
    name: "Email Pattern Discovery",
    icon: Mail,
    status: "active",
    category: "Contact Intel",
    description: "Guesses email patterns from name + domain",
    tooltip:
      "Given a contact name and company domain, generates likely email addresses using common patterns (first@, first.last@, firstlast@, f.last@, etc). Tests deliverability when possible. Assigns confidence scores.",
    dataProvided: ["Email addresses", "Email patterns", "Confidence scores"],
    color: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
  },
  {
    id: "linkedin",
    name: "LinkedIn Lookup",
    icon: Linkedin,
    status: "active",
    category: "Contact Intel",
    description: "Finds company and contact LinkedIn profiles",
    tooltip:
      "Searches DuckDuckGo for LinkedIn company pages and employee profiles. Extracts company size, description, and key employee names/titles. Does not scrape LinkedIn directly (no login required).",
    dataProvided: ["LinkedIn URL", "Employee count", "Key contacts", "Company description"],
    color: "from-sky-500/20 to-sky-600/10 border-sky-500/30",
  },
  {
    id: "wappalyzer",
    name: "Wappalyzer Tech Detection",
    icon: Cpu,
    status: "active",
    category: "Company Intel",
    description: "Detects tech stack from website HTML",
    tooltip:
      "Pure HTML analysis — no API key required. Detects CMS (WordPress, Shopify), frameworks (React, Next.js), analytics (GA, Mixpanel), payment processors, and other technologies. Useful for identifying SaaS companies and their maturity level.",
    dataProvided: ["Tech stack", "CMS", "Frameworks", "Analytics tools"],
    color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
  },
  {
    id: "funding",
    name: "Funding Research",
    icon: TrendingUp,
    status: "active",
    category: "Company Intel",
    description: "Discovers funding rounds and investor info",
    tooltip:
      "Searches public sources for funding announcements, press releases, and Crunchbase-like data. Identifies total raised, last round, investors, and financing status. Critical for tech startup qualification — recently funded companies need D&O insurance.",
    dataProvided: ["Total raised", "Last round", "Investors", "Funding stage"],
    color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
  },
  {
    id: "news-monitor",
    name: "News & Signals Monitor",
    icon: Newspaper,
    status: "active",
    category: "Signals",
    description: "Tracks recent news and company developments",
    tooltip:
      "Monitors news sources for company mentions, product launches, partnerships, acquisitions, and regulatory events. Surfaces buying signals like expansion, new leadership, and compliance needs that indicate insurance purchase timing.",
    dataProvided: ["Recent news", "Press releases", "Buying signals"],
    color: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
  },
  {
    id: "job-postings",
    name: "Job Postings Analyzer",
    icon: Briefcase,
    status: "active",
    category: "Signals",
    description: "Analyzes hiring activity as growth signal",
    tooltip:
      "Searches job boards and career pages for open positions. High hiring velocity indicates growth (and growing insurance needs). Identifies key hires like CFO, VP Ops, Head of Legal — decision-makers who buy insurance.",
    dataProvided: ["Open roles count", "Key hires", "Hiring signals", "Growth indicators"],
    color: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30",
  },
  {
    id: "social-signals",
    name: "Social Signals",
    icon: Share2,
    status: "active",
    category: "Signals",
    description: "Discovers social media presence and activity",
    tooltip:
      "Finds Twitter/X, GitHub, and other social profiles. Analyzes posting frequency and engagement. Active social presence indicates a real, operating company. GitHub activity shows engineering team size and product maturity.",
    dataProvided: ["Twitter URL", "GitHub URL", "Social activity metrics"],
    color: "from-pink-500/20 to-pink-600/10 border-pink-500/30",
  },
  {
    id: "sec-edgar",
    name: "SEC EDGAR Filings",
    icon: FileText,
    status: "active",
    category: "Company Intel",
    description: "Checks SEC filings for public/pre-IPO companies",
    tooltip:
      "Queries the SEC EDGAR database for company filings (10-K, 10-Q, S-1, D filings). Identifies companies preparing for IPO or with regulatory filing requirements — strong insurance purchase signals. Also validates company legitimacy.",
    dataProvided: ["SEC filings", "Public/private status", "Regulatory compliance"],
    color: "from-slate-400/20 to-slate-500/10 border-slate-400/30",
  },
  {
    id: "rate-limiter",
    name: "Smart Rate Limiter",
    icon: Shield,
    status: "active",
    category: "Infrastructure",
    description: "Manages API rate limits across all sources",
    tooltip:
      "Coordinates all enrichment requests to prevent rate limiting and source blocking. Max 3 concurrent requests, 1s minimum delay between calls, 15s per-source timeout. Ensures reliable, sustainable enrichment at scale.",
    dataProvided: ["Rate management", "Error handling", "Queue coordination"],
    color: "from-gray-400/20 to-gray-500/10 border-gray-400/30",
  },

  // ── Paid / API Key Required ──────────────────────────────────────────────
  {
    id: "apollo",
    name: "Apollo.io",
    icon: Rocket,
    status: "requires_payment",
    category: "Contact Intel",
    description: "Premium contact and company enrichment",
    tooltip:
      "Apollo's database of 275M+ contacts. Company enrichment (revenue, employee count, tech stack, funding), people search (direct dials, verified emails, titles), and contact discovery. Manual trigger only — credits consumed per lookup. 10K free credits/month on starter plan.",
    dataProvided: ["Direct phone numbers", "Verified emails", "Revenue data", "Employee count", "Tech stack"],
    color: "from-violet-500/20 to-violet-600/10 border-violet-500/30",
  },
  {
    id: "phone-validation",
    name: "Abstract Phone Validation",
    icon: Phone,
    status: "requires_payment",
    category: "Verification",
    description: "Validates and formats phone numbers",
    tooltip:
      "Uses Abstract API to validate phone numbers found by other sources. Checks if numbers are valid, identifies carrier type (mobile/landline/VoIP), and formats to E.164 standard. Ensures cold call lists have working numbers. API key configured.",
    dataProvided: ["Phone validation", "Carrier type", "Number formatting"],
    color: "from-teal-500/20 to-teal-600/10 border-teal-500/30",
  },

  // ── Coming Soon ──────────────────────────────────────────────────────────
  {
    id: "hunter",
    name: "Hunter.io",
    icon: Mail,
    status: "coming_soon",
    category: "Contact Intel",
    description: "Email verification and discovery",
    tooltip:
      "Hunter.io finds and verifies professional email addresses. Domain search reveals all known emails at a company, email finder generates the most likely email for a specific person, and email verifier checks deliverability. 25 free searches/month.",
    dataProvided: ["Verified emails", "Email patterns", "Deliverability scores"],
    color: "from-orange-400/20 to-orange-500/10 border-orange-400/30",
  },
  {
    id: "clearbit",
    name: "Clearbit (HubSpot)",
    icon: Database,
    status: "coming_soon",
    category: "Company Intel",
    description: "Real-time company and contact enrichment",
    tooltip:
      "Clearbit (now part of HubSpot) provides real-time company enrichment including revenue, employee count, industry, tech stack, and social profiles. Also enriches contacts with title, seniority, and department. Pairs with your HubSpot CRM.",
    dataProvided: ["Revenue", "Industry", "Tech stack", "Contact details", "Seniority"],
    color: "from-blue-400/20 to-blue-500/10 border-blue-400/30",
  },
  {
    id: "zoominfo",
    name: "ZoomInfo",
    icon: Users,
    status: "coming_soon",
    category: "Contact Intel",
    description: "Enterprise-grade B2B contact database",
    tooltip:
      "ZoomInfo's database of 100M+ business contacts with direct dials, org charts, and intent data. Includes buying intent signals based on web activity. Premium pricing but highest data quality for B2B outbound. Enterprise plan required.",
    dataProvided: ["Direct dials", "Org charts", "Intent signals", "Buying activity"],
    color: "from-rose-400/20 to-rose-500/10 border-rose-400/30",
  },
  {
    id: "crunchbase",
    name: "Crunchbase",
    icon: BarChart3,
    status: "coming_soon",
    category: "Company Intel",
    description: "Startup and investment intelligence",
    tooltip:
      "The gold standard for startup funding data. Tracks every funding round, acquisition, and IPO. Identifies board members, investors, and advisors. Great for finding recently funded startups that need D&O and cyber insurance. No free API tier — starts at $29/mo.",
    dataProvided: ["Funding rounds", "Investors", "Board members", "Acquisitions", "IPO status"],
    color: "from-yellow-400/20 to-yellow-500/10 border-yellow-400/30",
  },
  {
    id: "google-maps",
    name: "Google Maps API",
    icon: MapPin,
    status: "coming_soon",
    category: "Company Intel",
    description: "Official Google business data",
    tooltip:
      "Google Places API provides verified business info including phone, address, hours, website, rating, and review count. Much more reliable than scraping — returns structured data directly. Requires Google Cloud account. $17/1000 requests (Place Details).",
    dataProvided: ["Verified phone", "Address", "Hours", "Rating", "Review count"],
    color: "from-red-400/20 to-red-500/10 border-red-400/30",
  },
  {
    id: "builtwith",
    name: "BuiltWith",
    icon: Cpu,
    status: "coming_soon",
    category: "Company Intel",
    description: "Advanced technology profiling",
    tooltip:
      "BuiltWith tracks the technology usage of every website on the internet. Shows current and historical tech stack, spending profile, and technology market share. Useful for identifying companies using specific insurance-related tools (HR systems, payroll, etc).",
    dataProvided: ["Full tech stack", "Spending profile", "Tech history", "Market share"],
    color: "from-fuchsia-400/20 to-fuchsia-500/10 border-fuchsia-400/30",
  },
  {
    id: "pitchbook",
    name: "PitchBook",
    icon: TrendingUp,
    status: "coming_soon",
    category: "Company Intel",
    description: "Private market financial data",
    tooltip:
      "PitchBook provides deep private company financial data including valuations, revenue estimates, cap tables, and comparable deal analysis. The most comprehensive source for understanding a startup's financial position and insurance needs. Enterprise pricing.",
    dataProvided: ["Valuations", "Revenue estimates", "Cap tables", "Comparable deals"],
    color: "from-emerald-400/20 to-emerald-500/10 border-emerald-400/30",
  },
  {
    id: "intent-data",
    name: "Bombora Intent Data",
    icon: Eye,
    status: "coming_soon",
    category: "Signals",
    description: "B2B buying intent signals",
    tooltip:
      "Bombora tracks which companies are actively researching insurance-related topics. Identifies companies reading about D&O insurance, cyber liability, workers comp, and other policy types — indicating they're in a buying cycle. Premium B2B intent data provider.",
    dataProvided: ["Buying intent score", "Topic interests", "Research activity", "Surge signals"],
    color: "from-lime-400/20 to-lime-500/10 border-lime-400/30",
  },
  {
    id: "hubspot-crm",
    name: "HubSpot CRM Sync",
    icon: Building2,
    status: "coming_soon",
    category: "Infrastructure",
    description: "Two-way sync with your HubSpot CRM",
    tooltip:
      "Syncs enriched lead data directly to HubSpot deals and contacts. Auto-creates companies, associates contacts, and updates deal properties. Eliminates manual data entry between this tool and your sales pipeline.",
    dataProvided: ["CRM sync", "Deal creation", "Contact association", "Activity logging"],
    color: "from-orange-400/20 to-orange-500/10 border-orange-400/30",
  },
  {
    id: "auto-dialer",
    name: "Auto-Dialer Integration",
    icon: Phone,
    status: "coming_soon",
    category: "Infrastructure",
    description: "Click-to-call with power dialer",
    tooltip:
      "Integrate with power dialers (Orum, Nooks, PhoneBurner) to enable click-to-call directly from the leads table. Automatically logs call outcomes, schedules follow-ups, and updates lead status. Turn enriched phone numbers into instant outbound calls.",
    dataProvided: ["Click-to-call", "Call logging", "Follow-up scheduling"],
    color: "from-green-400/20 to-green-500/10 border-green-400/30",
  },
  {
    id: "email-sequences",
    name: "Email Sequence Engine",
    icon: Zap,
    status: "coming_soon",
    category: "Infrastructure",
    description: "Automated multi-touch email outreach",
    tooltip:
      "Build automated email sequences triggered by lead score and enrichment completeness. Personalized templates using enriched data (funding round, tech stack, team size). A/B testing, reply detection, and automatic sequence pausing on response.",
    dataProvided: ["Email automation", "Personalization", "A/B testing", "Reply tracking"],
    color: "from-violet-400/20 to-violet-500/10 border-violet-400/30",
  },
];

// ── Category grouping ──────────────────────────────────────────────────────

const CATEGORIES = [
  { key: "Company Intel", label: "Company Intelligence", description: "Discover company details, tech stack, and financials" },
  { key: "Contact Intel", label: "Contact Discovery", description: "Find decision-makers, emails, and phone numbers" },
  { key: "Signals", label: "Buying Signals", description: "Detect growth, hiring, and purchase intent" },
  { key: "Verification", label: "Data Verification", description: "Validate and clean enriched data" },
  { key: "Infrastructure", label: "Infrastructure & Integrations", description: "Pipeline management and CRM connections" },
];

function StatusPill({ status }: { status: SourceStatus }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-500/15 text-green-400 border border-green-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        Active
      </span>
    );
  }
  if (status === "requires_payment") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
        <CreditCard className="w-3 h-3" />
        API Key Required
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25">
      <Lock className="w-3 h-3" />
      Coming Soon
    </span>
  );
}

function SourceTile({ source }: { source: Source }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const Icon = source.icon;
  const isInactive = source.status !== "active";

  return (
    <div
      className={`relative group rounded-xl border bg-gradient-to-br ${source.color} p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20 cursor-default ${isInactive ? "opacity-75" : ""}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-background/50 ${isInactive ? "opacity-60" : ""}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-tight">{source.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{source.description}</p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="mb-3">
        <StatusPill status={source.status} />
      </div>

      {/* Data chips */}
      <div className="flex flex-wrap gap-1.5">
        {source.dataProvided.map((d) => (
          <span
            key={d}
            className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-background/40 text-muted-foreground border border-white/5"
          >
            {d}
          </span>
        ))}
      </div>

      {/* Tooltip overlay */}
      {showTooltip && (
        <div className="absolute z-50 left-0 right-0 -bottom-2 translate-y-full">
          <div className="mx-2 p-4 rounded-lg bg-popover border border-border shadow-xl text-sm text-popover-foreground leading-relaxed">
            {source.tooltip}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function SourcesPage() {
  const activeCount = SOURCES.filter((s) => s.status === "active").length;
  const paidCount = SOURCES.filter((s) => s.status === "requires_payment").length;
  const comingSoonCount = SOURCES.filter((s) => s.status === "coming_soon").length;

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Hero Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Zap className="w-7 h-7 text-primary" />
          Enrichment Engine
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Multi-source intelligence pipeline that discovers, verifies, and enriches lead data from {SOURCES.length} sources across company intel, contact discovery, buying signals, and more.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-medium">{activeCount} Active Sources</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="text-sm font-medium text-muted-foreground">{paidCount} API Key Required</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          <span className="text-sm font-medium text-muted-foreground">{comingSoonCount} Coming Soon</span>
        </div>
        <div className="text-sm text-muted-foreground/60">
          {SOURCES.length} total enrichment capabilities
        </div>
      </div>

      {/* Categories */}
      {CATEGORIES.map((cat) => {
        const catSources = SOURCES.filter((s) => s.category === cat.key);
        if (catSources.length === 0) return null;

        return (
          <div key={cat.key}>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">{cat.label}</h2>
              <p className="text-sm text-muted-foreground">{cat.description}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catSources.map((s) => (
                <SourceTile key={s.id} source={s} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
