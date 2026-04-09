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
  Info,
  ArrowDown,
  type LucideIcon,
} from "lucide-react";

// ── Source definitions ─────────────────────────────────────────────────────────

type SourceStatus = "active" | "inactive" | "coming_soon" | "requires_payment";

interface Source {
  id: string;
  name: string;
  icon: LucideIcon;
  status: SourceStatus;
  description: string;
  tooltip: string;
  dataProvided: string[];
  color: string;
}

// ── Pipeline stages (top → bottom = workflow order) ────────────────────────

interface PipelineStage {
  key: string;
  label: string;
  description: string;
  sources: Source[];
}

const PIPELINE: PipelineStage[] = [
  // ─── STAGE 1: Data Sources ───────────────────────────────────────────────
  {
    key: "data-sources",
    label: "① Data Sources",
    description: "Where raw lead data comes from",
    sources: [
      {
        id: "dealscope",
        name: "DealScope by Munger Longview",
        icon: Database,
        status: "active",
        description: "Primary lead database — 1,380 companies with financials, contacts, and scoring",
        tooltip:
          "DealScope from Munger Longview provides comprehensive financial data on businesses — revenue, assets, liabilities, employee count, NAICS codes, and ownership structure. Currently our primary data source with 1,380 enriched companies and 3,321 contacts. Imported via XLSX with AI-powered Blueprint scoring (0–100).",
        dataProvided: ["Revenue", "Employees", "Contacts", "Blueprint Score", "Industry", "NAICS"],
        color: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
      },
      {
        id: "gpu-operators",
        name: "GPU Operator Pipeline",
        icon: Cpu,
        status: "active",
        description: "Curated GPU cloud operators with fleet data, financing profiles, and RVG scores",
        tooltip:
          "Custom-built pipeline of 77 GPU cloud and AI infrastructure companies. Includes GPU fleet sizes, hardware specs (H100/H200/B200), financing profiles, estimated GPU asset values, and RVG scores. Sourced from public filings, news, Crunchbase, and direct research.",
        dataProvided: ["GPU Fleet", "Hardware", "Est. GPU Value", "Financing Profile", "RVG Score"],
        color: "from-violet-500/20 to-violet-600/10 border-violet-500/30",
      },
      {
        id: "crunchbase",
        name: "Crunchbase",
        icon: BarChart3,
        status: "coming_soon",
        description: "Startup and investment intelligence",
        tooltip:
          "The gold standard for startup funding data. Tracks every funding round, acquisition, and IPO. Identifies board members, investors, and advisors. Starts at $29/mo.",
        dataProvided: ["Funding rounds", "Investors", "Board members", "Acquisitions"],
        color: "from-yellow-400/20 to-yellow-500/10 border-yellow-400/30",
      },
      {
        id: "dnb",
        name: "Dun & Bradstreet",
        icon: Database,
        status: "coming_soon",
        description: "Global business intelligence & credit data",
        tooltip:
          "D&B covers 500M+ business entities. Provides DUNS numbers, company hierarchies, financial statements, payment history, and risk scores.",
        dataProvided: ["DUNS number", "Financial statements", "Risk scores", "Company hierarchy"],
        color: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
      },
      {
        id: "privco",
        name: "PrivCo",
        icon: Database,
        status: "coming_soon",
        description: "Private company financial data",
        tooltip:
          "Financial data on 1M+ private companies. Revenue estimates, employee counts, funding history, M&A activity, and executive contacts.",
        dataProvided: ["Revenue estimates", "Employee count", "M&A activity", "Executive contacts"],
        color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
      },
      {
        id: "pitchbook",
        name: "PitchBook",
        icon: TrendingUp,
        status: "coming_soon",
        description: "Private market financial data",
        tooltip:
          "Deep private company financial data including valuations, revenue estimates, cap tables, and comparable deal analysis. Enterprise pricing.",
        dataProvided: ["Valuations", "Revenue estimates", "Cap tables", "Comparable deals"],
        color: "from-emerald-400/20 to-emerald-500/10 border-emerald-400/30",
      },
      {
        id: "naic-filings",
        name: "NAIC Insurance Filings",
        icon: FileText,
        status: "coming_soon",
        description: "Insurance commissioner data and regulatory records",
        tooltip:
          "Statutory financial filings, market share data, and regulatory records for insurance carriers and agencies.",
        dataProvided: ["Financial filings", "Market share", "Regulatory records"],
        color: "from-slate-500/20 to-slate-600/10 border-slate-500/30",
      },
    ],
  },

  // ─── STAGE 2: Company Enrichment ─────────────────────────────────────────
  {
    key: "company-enrichment",
    label: "② Company Enrichment",
    description: "Fill in company details, tech stack, and financials",
    sources: [
      {
        id: "company-website",
        name: "Website Scraper",
        icon: Globe,
        status: "active",
        description: "Deep-scrapes company websites with 8 extraction methods",
        tooltip:
          "Crawls company homepages using Chrome user-agent. Extracts phones from tel: links, JSON-LD structured data, meta tags, phone-class elements, footer/header sections, labeled text patterns, and full body scan. Also pulls emails, social links, and company description.",
        dataProvided: ["Phone (HQ)", "Email", "Social links", "Description", "Address"],
        color: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
      },
      {
        id: "google-business",
        name: "Google Business Profile",
        icon: MapPin,
        status: "active",
        description: "3-tier search strategy for business listings",
        tooltip:
          "Tier 1: DuckDuckGo search for company + phone/contact. Tier 2: BBB and Yelp profile lookup. Tier 3: Direct Google business listing scrape. Also powered by Orange Slice Google Maps scraping (879 company phones found in v3 sweep).",
        dataProvided: ["Phone", "Address", "Business hours", "Reviews"],
        color: "from-green-500/20 to-green-600/10 border-green-500/30",
      },
      {
        id: "web-search",
        name: "Web Search (DDG)",
        icon: Search,
        status: "active",
        description: "DuckDuckGo search for company intelligence",
        tooltip:
          "Searches DuckDuckGo for company info, press releases, directory listings, and contact pages. Automatically throttles to avoid rate limits (5s+ delay).",
        dataProvided: ["Company info", "Directory listings", "Press mentions"],
        color: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
      },
      {
        id: "funding",
        name: "Funding Research",
        icon: TrendingUp,
        status: "active",
        description: "Discovers funding rounds and investor info",
        tooltip:
          "Searches public sources for funding announcements, press releases, and Crunchbase-like data. Identifies total raised, last round, investors, and financing status.",
        dataProvided: ["Total raised", "Last round", "Investors", "Funding stage"],
        color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
      },
      {
        id: "wappalyzer",
        name: "Wappalyzer Tech Detection",
        icon: Cpu,
        status: "inactive",
        description: "Detects tech stack from website HTML",
        tooltip:
          "Pure HTML analysis — no API key required. Detects CMS, frameworks, analytics, and payment processors. Not currently used in our pipeline.",
        dataProvided: ["Tech stack", "CMS", "Frameworks", "Analytics tools"],
        color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
      },
      {
        id: "sec-edgar",
        name: "SEC EDGAR Filings",
        icon: FileText,
        status: "inactive",
        description: "Checks SEC filings for public/pre-IPO companies",
        tooltip:
          "Queries the SEC EDGAR database for company filings (10-K, 10-Q, S-1, D filings). Not currently active in our pipeline.",
        dataProvided: ["SEC filings", "Public/private status", "Regulatory compliance"],
        color: "from-slate-400/20 to-slate-500/10 border-slate-400/30",
      },
      {
        id: "clearbit",
        name: "Clearbit (HubSpot)",
        icon: Database,
        status: "coming_soon",
        description: "Real-time company and contact enrichment",
        tooltip:
          "Clearbit (now part of HubSpot) provides real-time company enrichment including revenue, employee count, industry, tech stack, and social profiles.",
        dataProvided: ["Revenue", "Industry", "Tech stack", "Contact details"],
        color: "from-blue-400/20 to-blue-500/10 border-blue-400/30",
      },
      {
        id: "builtwith",
        name: "BuiltWith",
        icon: Cpu,
        status: "coming_soon",
        description: "Advanced technology profiling",
        tooltip:
          "Tracks the technology usage of every website. Shows current and historical tech stack, spending profile, and technology market share.",
        dataProvided: ["Full tech stack", "Spending profile", "Tech history"],
        color: "from-fuchsia-400/20 to-fuchsia-500/10 border-fuchsia-400/30",
      },
      {
        id: "google-maps-api",
        name: "Google Maps API",
        icon: MapPin,
        status: "coming_soon",
        description: "Official Google business data",
        tooltip:
          "Google Places API provides verified business info. Much more reliable than scraping. $17/1000 requests.",
        dataProvided: ["Verified phone", "Address", "Hours", "Rating"],
        color: "from-red-400/20 to-red-500/10 border-red-400/30",
      },
    ],
  },

  // ─── STAGE 3: Contact Discovery ──────────────────────────────────────────
  {
    key: "contact-discovery",
    label: "③ Contact Discovery",
    description: "Find decision-makers, emails, and phone numbers",
    sources: [
      {
        id: "apollo",
        name: "Apollo.io",
        icon: Rocket,
        status: "active",
        description: "Premium contact and company enrichment — 275M+ contacts",
        tooltip:
          "Apollo's database of 275M+ contacts. Company enrichment (revenue, employee count, tech stack, funding), people search (direct dials, verified emails, titles), and contact discovery. 10K free credits/month on starter plan. Active in our pipeline.",
        dataProvided: ["Direct phones", "Verified emails", "Revenue", "Employee count"],
        color: "from-violet-500/20 to-violet-600/10 border-violet-500/30",
      },
      {
        id: "linkedin",
        name: "LinkedIn Lookup",
        icon: Linkedin,
        status: "active",
        description: "Finds company and contact LinkedIn profiles",
        tooltip:
          "Searches DuckDuckGo for LinkedIn company pages and employee profiles. Extracts company size, description, and key employee names/titles. No LinkedIn login required.",
        dataProvided: ["LinkedIn URL", "Employee count", "Key contacts", "Description"],
        color: "from-sky-500/20 to-sky-600/10 border-sky-500/30",
      },
      {
        id: "email-discovery",
        name: "Email Pattern Discovery",
        icon: Mail,
        status: "active",
        description: "Guesses email patterns from name + domain",
        tooltip:
          "Given a contact name and company domain, generates likely email addresses using common patterns (first@, first.last@, etc). Assigns confidence scores.",
        dataProvided: ["Email addresses", "Email patterns", "Confidence scores"],
        color: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
      },
      {
        id: "orange-slice",
        name: "Orange Slice SDK",
        icon: Phone,
        status: "active",
        description: "Personal contact enrichment via LinkedIn URLs and Google Maps scraping",
        tooltip:
          "Orange Slice SDK provides person.contact.get() for emails/phones from LinkedIn URLs, and googleMaps.scrape() for business phone numbers. Used in v3 enrichment sweep: 879 company phones + 122 personal phones found. ~13,000 credits used.",
        dataProvided: ["Personal phones", "Verified emails", "Business phones", "Google Maps data"],
        color: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
      },
      {
        id: "hunter",
        name: "Hunter.io",
        icon: Mail,
        status: "coming_soon",
        description: "Email verification and discovery",
        tooltip:
          "Finds and verifies professional email addresses. Domain search, email finder, and deliverability verification. 25 free searches/month.",
        dataProvided: ["Verified emails", "Email patterns", "Deliverability scores"],
        color: "from-orange-400/20 to-orange-500/10 border-orange-400/30",
      },
      {
        id: "zoominfo",
        name: "ZoomInfo",
        icon: Users,
        status: "coming_soon",
        description: "Enterprise-grade B2B contact database",
        tooltip:
          "100M+ business contacts with direct dials, org charts, and intent data. Enterprise pricing.",
        dataProvided: ["Direct dials", "Org charts", "Intent signals"],
        color: "from-rose-400/20 to-rose-500/10 border-rose-400/30",
      },
    ],
  },

  // ─── STAGE 4: Signals & Scoring ──────────────────────────────────────────
  {
    key: "signals-scoring",
    label: "④ Signals & Scoring",
    description: "Detect growth signals, news, and score leads",
    sources: [
      {
        id: "news-monitor",
        name: "News & Signals Monitor",
        icon: Newspaper,
        status: "active",
        description: "Tracks recent news and company developments",
        tooltip:
          "Monitors news sources for company mentions, product launches, partnerships, acquisitions, and regulatory events. Surfaces buying signals like expansion and new leadership.",
        dataProvided: ["Recent news", "Press releases", "Buying signals"],
        color: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
      },
      {
        id: "job-postings",
        name: "Job Postings Analyzer",
        icon: Briefcase,
        status: "active",
        description: "Analyzes hiring activity as growth signal",
        tooltip:
          "Searches job boards for open positions. High hiring velocity indicates growth. Identifies key hires like CFO, VP Ops, Head of Legal — decision-makers.",
        dataProvided: ["Open roles", "Key hires", "Hiring signals", "Growth indicators"],
        color: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30",
      },
      {
        id: "social-signals",
        name: "Social Signals",
        icon: Share2,
        status: "inactive",
        description: "Discovers social media presence and activity",
        tooltip:
          "Finds Twitter/X, GitHub, and other social profiles. Analyzes posting frequency and engagement. Not currently active in our pipeline.",
        dataProvided: ["Twitter URL", "GitHub URL", "Social activity"],
        color: "from-pink-500/20 to-pink-600/10 border-pink-500/30",
      },
      {
        id: "intent-data",
        name: "Bombora Intent Data",
        icon: Eye,
        status: "coming_soon",
        description: "B2B buying intent signals",
        tooltip:
          "Tracks which companies are actively researching insurance-related topics. Premium B2B intent data.",
        dataProvided: ["Buying intent score", "Topic interests", "Surge signals"],
        color: "from-lime-400/20 to-lime-500/10 border-lime-400/30",
      },
    ],
  },

  // ─── STAGE 5: Verification ───────────────────────────────────────────────
  {
    key: "verification",
    label: "⑤ Verification & Validation",
    description: "Validate and clean enriched data before outreach",
    sources: [
      {
        id: "phone-validation",
        name: "Phone Validation",
        icon: Phone,
        status: "inactive",
        description: "Validates and formats phone numbers",
        tooltip:
          "Uses Abstract API to validate phone numbers. Checks if numbers are valid, identifies carrier type, and formats to E.164. Not currently active.",
        dataProvided: ["Phone validation", "Carrier type", "Formatting"],
        color: "from-teal-500/20 to-teal-600/10 border-teal-500/30",
      },
      {
        id: "rate-limiter",
        name: "Smart Rate Limiter",
        icon: Shield,
        status: "active",
        description: "Manages API rate limits across all sources",
        tooltip:
          "Coordinates all enrichment requests. Max 3 concurrent, 1s minimum delay, 15s per-source timeout. Ensures sustainable enrichment at scale.",
        dataProvided: ["Rate management", "Error handling", "Queue coordination"],
        color: "from-gray-400/20 to-gray-500/10 border-gray-400/30",
      },
    ],
  },

  // ─── STAGE 6: CRM & Outreach ─────────────────────────────────────────────
  {
    key: "crm-outreach",
    label: "⑥ CRM & Outreach",
    description: "Push enriched data to CRM and execute outreach",
    sources: [
      {
        id: "hubspot-crm",
        name: "HubSpot CRM Sync",
        icon: Building2,
        status: "active",
        description: "Two-way sync — companies, contacts, and custom properties pushed to HubSpot",
        tooltip:
          "Syncs enriched lead data directly to HubSpot. Auto-creates companies with 19 custom properties (Blueprint Score, Revenue, Stage, Description, Call Window, etc.), associates contacts, and assigns ownership. Currently active with 188 companies synced.",
        dataProvided: ["CRM sync", "Custom properties", "Contact association", "Owner assignment"],
        color: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
      },
      {
        id: "auto-dialer",
        name: "Auto-Dialer Integration",
        icon: Phone,
        status: "coming_soon",
        description: "Click-to-call with power dialer",
        tooltip:
          "Integrate with power dialers (Orum, Nooks, PhoneBurner) for click-to-call. Logs call outcomes and schedules follow-ups.",
        dataProvided: ["Click-to-call", "Call logging", "Follow-up scheduling"],
        color: "from-green-400/20 to-green-500/10 border-green-400/30",
      },
      {
        id: "email-sequences",
        name: "Email Sequence Engine",
        icon: Zap,
        status: "coming_soon",
        description: "Automated multi-touch email outreach",
        tooltip:
          "Automated email sequences triggered by lead score and enrichment completeness. Personalized templates, A/B testing, and reply detection.",
        dataProvided: ["Email automation", "Personalization", "A/B testing"],
        color: "from-violet-400/20 to-violet-500/10 border-violet-400/30",
      },
    ],
  },
];

// ── All sources flat (for stats) ───────────────────────────────────────────

const ALL_SOURCES = PIPELINE.flatMap((s) => s.sources);

// ── Components ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: SourceStatus }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-500/15 text-green-400 border border-green-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        Active
      </span>
    );
  }
  if (status === "inactive") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-500/15 text-zinc-500 border border-zinc-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
        Not Active
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
  const [expanded, setExpanded] = useState(false);
  const Icon = source.icon;
  const isGreyed = source.status === "inactive" || source.status === "coming_soon";

  return (
    <div
      className={`rounded-xl border bg-gradient-to-br ${source.color} transition-all duration-200 cursor-pointer ${
        isGreyed
          ? "opacity-40 grayscale hover:opacity-60 hover:grayscale-0"
          : "hover:shadow-lg hover:shadow-black/20"
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-background/50`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold leading-tight">{source.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{source.description}</p>
            </div>
          </div>
          <Info
            className={`w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
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
      </div>

      {/* Expandable detail panel */}
      {expanded && (
        <div className="px-5 pb-5 pt-0">
          <div className="p-3 rounded-lg bg-background/60 border border-white/5 text-sm text-muted-foreground leading-relaxed">
            {source.tooltip}
          </div>
        </div>
      )}
    </div>
  );
}

function StageConnector() {
  return (
    <div className="flex justify-center py-2">
      <div className="flex flex-col items-center gap-0.5 text-muted-foreground/30">
        <div className="w-px h-4 bg-current" />
        <ArrowDown className="w-4 h-4" />
        <div className="w-px h-4 bg-current" />
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function SourcesPage() {
  const activeCount = ALL_SOURCES.filter((s) => s.status === "active").length;
  const inactiveCount = ALL_SOURCES.filter((s) => s.status === "inactive").length;
  const comingSoonCount = ALL_SOURCES.filter(
    (s) => s.status === "coming_soon" || s.status === "requires_payment"
  ).length;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Hero Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Zap className="w-7 h-7 text-primary" />
          Enrichment Engine
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Multi-source intelligence pipeline. Data flows top → bottom: from raw sources through enrichment,
          contact discovery, scoring, verification, and into your CRM.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-medium">{activeCount} Active</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
          <span className="text-sm font-medium text-muted-foreground">{inactiveCount} Available (not active)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          <span className="text-sm font-medium text-muted-foreground">{comingSoonCount} Coming Soon</span>
        </div>
        <div className="text-sm text-muted-foreground/60">{ALL_SOURCES.length} total sources</div>
      </div>

      {/* Pipeline stages */}
      {PIPELINE.map((stage, idx) => (
        <div key={stage.key}>
          {idx > 0 && <StageConnector />}
          <div className="mb-4">
            <h2 className="text-lg font-semibold">{stage.label}</h2>
            <p className="text-sm text-muted-foreground">{stage.description}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stage.sources.map((s) => (
              <SourceTile key={s.id} source={s} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
