import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import BackToTop from "@/components/ui/back-to-top";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import StripePaymentIcons from "@/components/ui/stripe-payment-icons";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { glossaryTerms } from "@/data/glossaryData";
import { WebsiteProfileSection } from "@/components/audit/WebsiteProfileSection";
import GlossaryTooltip from "@/components/ui/glossary-tooltip";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Gauge,
  FileCode,
  Search,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Download,
  Clock,
  Globe,
  Link2,
  Smartphone,
  Heading,
  Image,
  FileText,
  Bot,
  Star,
  Check,
  ShieldCheck,
  CreditCard,
  HeadphonesIcon,
  Sparkles,
  Zap,
  Crown,
  Flame,
  Plus,
  ExternalLink,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Calendar,
  Phone,
  Save,
  BookOpen,
  Tag,
  ArrowRight,
  Mail,
  Gift,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import FloatingExportPDF from "@/components/ui/floating-export-pdf";
import { generateAuditPDF } from "@/lib/generateAuditPDF";
import bronDiamondFlow from "@/assets/bron-seo-diamond-flow.png";
import cadeContentAutomation from "@/assets/cade-content-automation.png";

interface WebsiteProfile {
  title: string | null;
  description: string | null;
  favicon: string | null;
  logo: string | null;
  summary: string | null;
  socialLinks: {
    facebook: string | null;
    twitter: string | null;
    linkedin: string | null;
    instagram: string | null;
    youtube: string | null;
    tiktok: string | null;
  };
  contactInfo: {
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  detectedCategory: string;
}

interface AuditCheck {
  name: string;
  status: "pass" | "warning" | "fail";
  value?: string;
  description: string;
}

interface AuditCategory {
  title: string;
  icon: React.ElementType;
  score: number;
  checks: AuditCheck[];
  isRealData?: boolean;
}

interface AhrefsMetrics {
  domainRating: number;
  backlinks: number;
  referringDomains: number;
  organicTraffic: number;
  organicKeywords: number;
}

interface HistoryDataPoint {
  date: string;
  organicTraffic: number;
  organicKeywords: number;
  domainRating: number;
  trafficValue: number;
}

// Reusable Score Dial Component
const ScoreDial = ({
  value,
  max = 100,
  label,
  size = "md",
  color = "primary",
  showPercentage = true,
  prefix = "",
  suffix = "",
}: {
  value: number;
  max?: number;
  label: string;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "green" | "amber" | "violet" | "cyan";
  showPercentage?: boolean;
  prefix?: string;
  suffix?: string;
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * 40; // radius = 40
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
  
  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-24 h-24",
    lg: "w-28 h-28",
  };
  
  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };
  
  const labelSizes = {
    sm: "text-[8px]",
    md: "text-[9px]",
    lg: "text-[10px]",
  };
  
  const colorGradients = {
    primary: { from: "hsl(var(--primary))", to: "hsl(280, 80%, 60%)" },
    green: { from: "hsl(142, 76%, 36%)", to: "hsl(160, 84%, 39%)" },
    amber: { from: "hsl(38, 92%, 50%)", to: "hsl(25, 95%, 53%)" },
    violet: { from: "hsl(280, 80%, 60%)", to: "hsl(300, 80%, 60%)" },
    cyan: { from: "hsl(190, 95%, 39%)", to: "hsl(210, 100%, 50%)" },
  };
  
  const gradientId = `dial-${label.replace(/\s/g, '-')}-${color}`;
  
  const formatValue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toLocaleString();
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${sizeClasses[size]}`}>
        <svg className={`${sizeClasses[size]} transform -rotate-90`} viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted/20"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke={`url(#${gradientId})`}
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colorGradients[color].from} />
              <stop offset="100%" stopColor={colorGradients[color].to} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${textSizes[size]} font-bold text-foreground`}>
            {prefix}{formatValue(value)}{showPercentage && max === 100 ? "" : suffix}
          </span>
          {showPercentage && max === 100 && (
            <span className={`${labelSizes[size]} text-muted-foreground`}>/100</span>
          )}
        </div>
      </div>
      <span className={`${labelSizes[size]} text-muted-foreground mt-2 text-center font-medium`}>{label}</span>
    </div>
  );
};

// Store Ahrefs metrics separately for dashboard display
interface DashboardMetrics {
  domainRating: number;
  ahrefsRank: number;
  backlinks: number;
  backlinksAllTime: number;
  referringDomains: number;
  referringDomainsAllTime: number;
  organicTraffic: number;
  organicKeywords: number;
  trafficValue: number;
  isReal: boolean;
}

// Pricing data (simplified from PricingSection)
const getPositionsLeft = () => {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const monthSeed = now.getMonth() + now.getFullYear() * 12;
  const baseDecrease = Math.floor(dayOfMonth * 0.7);
  const randomVariance = ((monthSeed * dayOfMonth * 7) % 5) - 2;
  return Math.max(3, 21 - baseDecrease + randomVariance);
};

const premiumFeatures: Record<string, { icon: typeof Sparkles; label: string; color: string }> = {
  "Free directory listing": { icon: Star, label: "Included", color: "from-emerald-400 to-green-500" },
  "Free Marketplace Listing": { icon: Star, label: "Included", color: "from-emerald-400 to-green-500" },
  "AEO and GEO signals": { icon: Sparkles, label: "AI Ready", color: "from-fuchsia-400 to-pink-500" },
  "DA - DR BOOSTER": { icon: Zap, label: "Power", color: "from-amber-400 to-orange-500" },
  "Up to 40% off normal keyword pricing": { icon: Crown, label: "Deal", color: "from-violet-400 to-purple-500" },
  "Up to 60% off normal pricing": { icon: Crown, label: "Best Deal", color: "from-cyan-400 to-blue-500" },
};

const addOns = [
  { name: "On-Page SEO", icon: Sparkles },
  { name: "PPC Landing Pages", icon: Zap },
  { name: "Lovable Premium Hosting", icon: Shield },
];

const plans = [
  {
    name: "Business CEO",
    monthlyPrice: 75,
    yearlyPrice: 60,
    description: "Everything you need to dominate local SEO",
    features: [
      "15 keyword phrases",
      "Free directory listing",
      "AEO and GEO signals",
      "Uptime monitoring",
      "Bi-weekly SEO ranking reports",
      "15 SEO rich content pages",
      "25 relevant business partners",
      "Up to 125 targeted Deep Links",
      "DA - DR BOOSTER",
      "In-depth analytics",
    ],
    highlighted: false,
    hasToggle: true,
    originalPrice: 150,
    hasScarcity: true,
  },
  {
    name: "White Label",
    monthlyPrice: 499,
    yearlyPrice: 399,
    description: "Resell our services under your brand",
    features: [
      "Everything in Growth plan",
      "Free Marketplace Listing",
      "Up to 40% off normal keyword pricing",
      "White-label dashboard & reports",
      "Custom branding on all deliverables",
      "Priority 24/7 support",
      "Bulk client management tools",
      "Dedicated account manager",
    ],
    highlighted: true,
    hasToggle: true,
  },
  {
    name: "Super Reseller",
    monthlyPrice: 1499,
    yearlyPrice: 1199,
    description: "Enterprise API access for agencies at scale",
    features: [
      "Everything in White Label plan",
      "Up to 60% off normal pricing",
      "Full API access to all data",
      "Pull data to your own systems",
      "Custom integrations & webhooks",
      "Volume-based enterprise pricing",
      "Dedicated success team",
      "Priority enterprise support",
    ],
    highlighted: false,
    hasToggle: true,
    buttonText: "Book a Call",
  },
];

// Generate audit results - now accepts optional real Ahrefs data
const generateAuditResults = (domain: string, ahrefsData?: AhrefsMetrics | null): AuditCategory[] => {
  const hash = domain.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const randomScore = (base: number, variance: number) => {
    const offset = ((hash % 100) / 100) * variance * 2 - variance;
    return Math.min(100, Math.max(0, Math.round(base + offset)));
  };

  const randomValue = (min: number, max: number) => {
    return Math.round(min + ((hash % 100) / 100) * (max - min));
  };

  const speedScore = randomScore(72, 20);
  const schemaScore = randomScore(45, 30);
  const metaScore = randomScore(68, 25);
  const securityScore = randomScore(85, 15);
  const technicalScore = randomScore(65, 25);

  // Calculate backlink score from real Ahrefs data or use simulated
  let backlinkScore: number;
  let hasRealBacklinkData = false;
  
  if (ahrefsData) {
    // Convert Domain Rating to score (DR is already 0-100)
    backlinkScore = ahrefsData.domainRating;
    hasRealBacklinkData = true;
  } else {
    backlinkScore = randomScore(55, 35);
  }

  return [
    {
      title: "Page Speed",
      icon: Gauge,
      score: speedScore,
      checks: [
        {
          name: "Largest Contentful Paint (LCP)",
          status: speedScore > 70 ? "pass" : speedScore > 50 ? "warning" : "fail",
          value: `${(1.2 + (100 - speedScore) * 0.03).toFixed(1)}s`,
          description: "LCP should be under 2.5s for good user experience",
        },
        {
          name: "First Input Delay (FID)",
          status: speedScore > 60 ? "pass" : "warning",
          value: `${Math.round(50 + (100 - speedScore) * 1.5)}ms`,
          description: "FID should be under 100ms for responsive interactions",
        },
        {
          name: "Cumulative Layout Shift (CLS)",
          status: speedScore > 75 ? "pass" : speedScore > 55 ? "warning" : "fail",
          value: (0.05 + (100 - speedScore) * 0.003).toFixed(2),
          description: "CLS should be under 0.1 for visual stability",
        },
        {
          name: "Time to First Byte (TTFB)",
          status: speedScore > 65 ? "pass" : "warning",
          value: `${Math.round(200 + (100 - speedScore) * 8)}ms`,
          description: "TTFB should be under 600ms for good server response",
        },
        {
          name: "Image Optimization",
          status: hash % 3 === 0 ? "fail" : hash % 3 === 1 ? "warning" : "pass",
          description: "Images should be compressed and use modern formats like WebP",
        },
      ],
    },
    {
      title: "Backlink Profile",
      icon: Link2,
      score: backlinkScore,
      isRealData: hasRealBacklinkData,
      checks: ahrefsData ? [
        {
          name: "Domain Rating (DR)",
          status: ahrefsData.domainRating >= 50 ? "pass" : ahrefsData.domainRating >= 25 ? "warning" : "fail",
          value: `${ahrefsData.domainRating}/100`,
          description: "Ahrefs Domain Rating - measures website authority (real data)",
        },
        {
          name: "Total Backlinks",
          status: ahrefsData.backlinks >= 100 ? "pass" : ahrefsData.backlinks >= 20 ? "warning" : "fail",
          value: `${ahrefsData.backlinks.toLocaleString()} links`,
          description: "Total number of backlinks pointing to this domain (real data)",
        },
        {
          name: "Referring Domains",
          status: ahrefsData.referringDomains >= 30 ? "pass" : ahrefsData.referringDomains >= 10 ? "warning" : "fail",
          value: `${ahrefsData.referringDomains.toLocaleString()} domains`,
          description: "Unique domains linking to this website (real data)",
        },
        {
          name: "Organic Traffic",
          status: ahrefsData.organicTraffic >= 500 ? "pass" : ahrefsData.organicTraffic >= 100 ? "warning" : "fail",
          value: `${ahrefsData.organicTraffic.toLocaleString()} visits/mo`,
          description: "Estimated monthly organic search traffic (real data)",
        },
        {
          name: "Organic Keywords",
          status: ahrefsData.organicKeywords >= 50 ? "pass" : ahrefsData.organicKeywords >= 10 ? "warning" : "fail",
          value: `${ahrefsData.organicKeywords.toLocaleString()} keywords`,
          description: "Keywords this domain ranks for in search results (real data)",
        },
      ] : [
        {
          name: "Total Backlinks",
          status: backlinkScore > 60 ? "pass" : backlinkScore > 35 ? "warning" : "fail",
          value: `${randomValue(15, 850).toLocaleString()} links`,
          description: "More quality backlinks improve domain authority and rankings",
        },
        {
          name: "Referring Domains",
          status: backlinkScore > 50 ? "pass" : backlinkScore > 30 ? "warning" : "fail",
          value: `${randomValue(8, 120)} domains`,
          description: "Links from diverse domains carry more weight than many from one",
        },
        {
          name: "Domain Authority (DA)",
          status: backlinkScore > 55 ? "pass" : backlinkScore > 40 ? "warning" : "fail",
          value: `${randomValue(15, 55)}/100`,
          description: "Higher DA indicates stronger site authority and trust",
        },
        {
          name: "Toxic Link Ratio",
          status: hash % 4 === 0 ? "fail" : hash % 3 === 0 ? "warning" : "pass",
          value: `${randomValue(2, 18)}%`,
          description: "High ratio of toxic/spammy links can hurt rankings",
        },
        {
          name: "Anchor Text Diversity",
          status: backlinkScore > 45 ? "pass" : "warning",
          description: "Natural anchor text variation signals organic link building",
        },
      ],
    },
    {
      title: "Technical SEO",
      icon: FileText,
      score: technicalScore,
      checks: [
        {
          name: "Mobile Friendliness",
          status: technicalScore > 60 ? "pass" : technicalScore > 40 ? "warning" : "fail",
          description: "Site must be fully responsive for mobile-first indexing",
        },
        {
          name: "Heading Structure (H1-H6)",
          status: hash % 3 !== 0 ? "pass" : "warning",
          value: hash % 3 !== 0 ? "Valid hierarchy" : "Multiple H1s found",
          description: "Proper heading hierarchy helps search engines understand content",
        },
        {
          name: "Image Alt Attributes",
          status: technicalScore > 55 ? "pass" : technicalScore > 35 ? "warning" : "fail",
          value: `${randomValue(65, 95)}% coverage`,
          description: "Alt text improves accessibility and image SEO",
        },
        {
          name: "Sitemap.xml Present",
          status: hash % 5 !== 0 ? "pass" : "fail",
          description: "XML sitemap helps search engines discover and index pages",
        },
        {
          name: "Robots.txt Configured",
          status: technicalScore > 50 ? "pass" : "warning",
          description: "Proper robots.txt controls crawler access to your site",
        },
        {
          name: "Canonical Tags",
          status: technicalScore > 60 ? "pass" : hash % 2 === 0 ? "warning" : "fail",
          description: "Canonicals prevent duplicate content issues",
        },
      ],
    },
    {
      title: "Schema Markup",
      icon: FileCode,
      score: schemaScore,
      checks: [
        {
          name: "JSON-LD Present",
          status: schemaScore > 50 ? "pass" : "fail",
          description: "JSON-LD structured data helps search engines understand your content",
        },
        {
          name: "Organization Schema",
          status: schemaScore > 60 ? "pass" : schemaScore > 40 ? "warning" : "fail",
          description: "Organization schema provides business information to search engines",
        },
        {
          name: "Breadcrumb Schema",
          status: hash % 2 === 0 ? "pass" : "fail",
          description: "Breadcrumb schema improves navigation display in search results",
        },
        {
          name: "FAQ Schema",
          status: schemaScore > 70 ? "pass" : "fail",
          description: "FAQ schema can enable rich snippets in search results",
        },
        {
          name: "Local Business Schema",
          status: hash % 4 === 0 ? "pass" : schemaScore > 55 ? "warning" : "fail",
          description: "Local business schema is essential for local SEO visibility",
        },
      ],
    },
    {
      title: "Meta Tags",
      icon: Search,
      score: metaScore,
      checks: [
        {
          name: "Title Tag",
          status: metaScore > 60 ? "pass" : "warning",
          value: metaScore > 60 ? "55 characters" : "72 characters (too long)",
          description: "Title should be 50-60 characters for optimal display",
        },
        {
          name: "Meta Description",
          status: metaScore > 50 ? "pass" : metaScore > 30 ? "warning" : "fail",
          value: metaScore > 50 ? "152 characters" : "Missing",
          description: "Meta description should be 150-160 characters",
        },
        {
          name: "Open Graph Tags",
          status: metaScore > 65 ? "pass" : hash % 2 === 0 ? "warning" : "fail",
          description: "OG tags control how content appears when shared on social media",
        },
        {
          name: "Twitter Card Tags",
          status: hash % 3 !== 0 ? "pass" : "fail",
          description: "Twitter cards enhance link previews on Twitter/X",
        },
        {
          name: "Viewport Meta Tag",
          status: "pass",
          description: "Viewport meta enables proper mobile rendering",
        },
      ],
    },
    {
      title: "SSL & Security",
      icon: Shield,
      score: securityScore,
      checks: [
        {
          name: "HTTPS Enabled",
          status: securityScore > 50 ? "pass" : "fail",
          description: "HTTPS is required for secure data transmission and SEO",
        },
        {
          name: "SSL Certificate Valid",
          status: securityScore > 60 ? "pass" : "warning",
          value: securityScore > 60 ? "Valid for 245 days" : "Expires in 15 days",
          description: "SSL certificate should be valid and not expiring soon",
        },
        {
          name: "HSTS Header",
          status: securityScore > 80 ? "pass" : "fail",
          description: "HSTS forces secure connections and prevents downgrade attacks",
        },
        {
          name: "X-Content-Type-Options",
          status: hash % 2 === 0 ? "pass" : "warning",
          description: "Prevents MIME type sniffing attacks",
        },
        {
          name: "X-Frame-Options",
          status: securityScore > 70 ? "pass" : "fail",
          description: "Prevents clickjacking attacks by controlling iframe embedding",
        },
      ],
    },
  ];
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
};

const getScoreGradient = (score: number) => {
  if (score >= 80) return "from-green-500 to-emerald-500";
  if (score >= 50) return "from-amber-500 to-orange-500";
  return "from-red-500 to-rose-500";
};

const getStatusIcon = (status: "pass" | "warning" | "fail") => {
  switch (status) {
    case "pass":
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case "warning":
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    case "fail":
      return <XCircle className="w-5 h-5 text-red-500" />;
  }
};

const AuditResults = () => {
  const { domain } = useParams<{ domain: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [auditResults, setAuditResults] = useState<AuditCategory[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [historyData, setHistoryData] = useState<HistoryDataPoint[] | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [ahrefsError, setAhrefsError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const positionsLeft = useMemo(() => getPositionsLeft(), []);
  
  // Website profile state
  const [websiteProfile, setWebsiteProfile] = useState<WebsiteProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [showLinkActiveNotification, setShowLinkActiveNotification] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false); // true when user just claimed in this session
  
  // Chart line visibility toggles
  const [chartLines, setChartLines] = useState({
    traffic: true,
    keywords: true,
    dr: true,
    value: true,
  });

  const decodedDomain = domain ? decodeURIComponent(domain) : "";

  // Match glossary terms based on audit categories and website profile
  const matchedGlossaryTerms = useMemo(() => {
    const relevantTerms: Array<{ term: string; slug: string; shortDescription: string }> = [];
    const categories = new Set<string>();
    
    // Add categories based on audit results
    auditResults.forEach(cat => {
      if (cat.title === 'Page Speed') categories.add('Technical SEO');
      if (cat.title === 'Backlink Profile') categories.add('Off-Page SEO');
      if (cat.title === 'Technical SEO') categories.add('Technical SEO');
      if (cat.title === 'Schema Markup') categories.add('Technical SEO');
      if (cat.title === 'Meta Tags') categories.add('On-Page SEO');
      if (cat.title === 'Security') categories.add('Technical SEO');
    });
    
    // Always include some core terms
    categories.add('On-Page SEO');
    categories.add('Off-Page SEO');
    
    // Filter glossary terms by relevant categories
    glossaryTerms.forEach(term => {
      if (categories.has(term.category) && relevantTerms.length < 16) {
        relevantTerms.push({
          term: term.term,
          slug: term.slug,
          shortDescription: term.shortDescription
        });
      }
    });
    
    return relevantTerms;
  }, [auditResults]);

  // Match relevant learning guides based on audit results
  const matchedLearningGuides = useMemo(() => {
    const guides: Array<{ title: string; href: string; description: string }> = [];
    
    // Always include core guides
    guides.push({
      title: 'On-Page SEO Guide',
      href: '/learn/on-page-seo-guide',
      description: 'Master title tags, meta descriptions, header structure, and content optimization.'
    });
    guides.push({
      title: 'Off-Page SEO Guide',
      href: '/learn/off-page-seo-guide',
      description: 'Learn link building strategies and how to boost domain authority.'
    });
    
    // Add guides based on audit findings
    const pageSpeed = auditResults.find(c => c.title === 'Page Speed');
    if (pageSpeed && pageSpeed.score < 80) {
      guides.push({
        title: 'Core Web Vitals Guide',
        href: '/learn/core-web-vitals-guide',
        description: 'Optimize LCP, FID, and CLS for better performance and rankings.'
      });
    }
    
    const technical = auditResults.find(c => c.title === 'Technical SEO');
    if (technical) {
      guides.push({
        title: 'Technical SEO Guide',
        href: '/learn/technical-seo-guide',
        description: 'Fix crawlability, indexation, and site architecture issues.'
      });
    }
    
    const schema = auditResults.find(c => c.title === 'Schema Markup');
    if (schema && schema.score < 80) {
      guides.push({
        title: 'Link Building Guide',
        href: '/learn/link-building-guide',
        description: 'Build high-quality backlinks with proven strategies.'
      });
    }
    
    // Add domain authority guide for low DR sites
    if (dashboardMetrics && dashboardMetrics.domainRating < 50) {
      guides.push({
        title: 'Domain Authority Guide',
        href: '/learn/domain-authority-guide',
        description: 'Understand and improve your domain rating and authority.'
      });
    }
    
    // Add analytics guide
    guides.push({
      title: 'Analytics Guide',
      href: '/learn/analytics-guide',
      description: 'Track and measure your SEO performance with actionable insights.'
    });
    
    return guides.slice(0, 6); // Max 6 guides
  }, [auditResults, dashboardMetrics]);

  const toggleCategory = (title: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  };

  // Fetch website profile
  useEffect(() => {
    if (!decodedDomain) return;
    
    const fetchWebsiteProfile = async () => {
      setIsProfileLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('scrape-website', {
          body: { url: decodedDomain }
        });
        
        if (error) {
          console.error('Website scrape error:', error);
        } else if (data?.profile) {
          setWebsiteProfile(data.profile);
        }
      } catch (err) {
        console.error('Website profile fetch error:', err);
      } finally {
        setIsProfileLoading(false);
      }
    };
    
    fetchWebsiteProfile();
  }, [decodedDomain]);

  // Open email dialog for save
  const handleSaveClick = () => {
    if (isSaved) return;
    setShowEmailDialog(true);
  };

  // Save audit to database with email
  const saveAudit = async () => {
    if (!decodedDomain || !dashboardMetrics) return;
    
    // Extract the root domain (handle subdomains like www.example.com -> example.com)
    const domainParts = decodedDomain.replace(/^www\./, '').split('.');
    const rootDomain = domainParts.length >= 2 
      ? domainParts.slice(-2).join('.') 
      : decodedDomain;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!submitterEmail.trim() || !emailRegex.test(submitterEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // Validate email matches domain
    const emailDomain = submitterEmail.trim().split('@')[1]?.toLowerCase();
    if (!emailDomain || !emailDomain.endsWith(rootDomain.toLowerCase())) {
      toast.error(`Email must be from @${rootDomain} to verify ownership`);
      return;
    }
    
    setIsSaving(true);
    try {
      // Create a URL-safe slug
      const slug = decodedDomain.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      
      const auditData = {
        domain: decodedDomain,
        slug,
        category: (websiteProfile?.detectedCategory || 'other') as any,
        site_title: websiteProfile?.title,
        site_description: websiteProfile?.description,
        site_summary: websiteProfile?.summary,
        favicon_url: websiteProfile?.favicon,
        logo_url: websiteProfile?.logo,
        social_facebook: websiteProfile?.socialLinks?.facebook,
        social_twitter: websiteProfile?.socialLinks?.twitter,
        social_linkedin: websiteProfile?.socialLinks?.linkedin,
        social_instagram: websiteProfile?.socialLinks?.instagram,
        social_youtube: websiteProfile?.socialLinks?.youtube,
        social_tiktok: websiteProfile?.socialLinks?.tiktok,
        contact_email: websiteProfile?.contactInfo?.email,
        contact_phone: websiteProfile?.contactInfo?.phone,
        domain_rating: dashboardMetrics.domainRating,
        ahrefs_rank: dashboardMetrics.ahrefsRank,
        backlinks: dashboardMetrics.backlinks,
        referring_domains: dashboardMetrics.referringDomains,
        organic_traffic: dashboardMetrics.organicTraffic,
        organic_keywords: dashboardMetrics.organicKeywords,
        traffic_value: dashboardMetrics.trafficValue,
        glossary_terms: matchedGlossaryTerms.map(t => t.slug),
        submitter_email: submitterEmail.trim(),
      };
      
      // Upsert - update if exists, insert if not
      const { error } = await supabase
        .from('saved_audits')
        .upsert(auditData, { onConflict: 'slug' });
      
      if (error) {
        console.error('Save audit error:', error);
        toast.error('Failed to save audit');
      } else {
        setIsSaved(true);
        setIsClaimed(true);
        setJustClaimed(true);
        setShowEmailDialog(false);
        setShowLinkActiveNotification(true);
      }
    } catch (err) {
      console.error('Save audit error:', err);
      toast.error('Failed to save audit');
    } finally {
      setIsSaving(false);
    }
  };

  // Check if audit already exists and is claimed
  useEffect(() => {
    if (!decodedDomain) return;
    
    const checkExisting = async () => {
      const slug = decodedDomain.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const { data } = await supabase
        .from('saved_audits')
        .select('id, submitter_email')
        .eq('slug', slug)
        .single();
      
      if (data) {
        setIsSaved(true);
        if (data.submitter_email) {
          setIsClaimed(true);
          setShowLinkActiveNotification(true);
        }
      }
    };
    
    checkExisting();
  }, [decodedDomain]);

  useEffect(() => {
    if (!decodedDomain) {
      navigate("/");
      return;
    }

    const fetchAuditData = async () => {
      try {
        // Call the edge function to get real Ahrefs data
        const { data, error } = await supabase.functions.invoke('domain-audit', {
          body: { domain: decodedDomain }
        });

        if (error) {
          console.error('Edge function error:', error);
          setAuditResults(generateAuditResults(decodedDomain, null));
          setDashboardMetrics({
            domainRating: 0,
            ahrefsRank: 0,
            backlinks: 0,
            backlinksAllTime: 0,
            referringDomains: 0,
            referringDomainsAllTime: 0,
            organicTraffic: 0,
            organicKeywords: 0,
            trafficValue: 0,
            isReal: false,
          });
          toast.error('Could not fetch real backlink data - showing simulated results');
        } else {
          const ahrefsData = data?.ahrefs || null;
          const historyResponse = data?.history || null;
          
          if (data?.ahrefsError) {
            setAhrefsError(data.ahrefsError);
            toast.warning(`Ahrefs: ${data.ahrefsError} - showing simulated backlink data`);
          } else if (ahrefsData) {
            toast.success('Real Ahrefs backlink data loaded!');
          }
          
          // Store history data for chart
          if (historyResponse && Array.isArray(historyResponse) && historyResponse.length > 0) {
            setHistoryData(historyResponse);
          }
          
          // Store dashboard metrics separately for prominent display
          if (ahrefsData) {
            setDashboardMetrics({
              domainRating: ahrefsData.domainRating,
              ahrefsRank: ahrefsData.ahrefsRank || 0,
              backlinks: ahrefsData.backlinks,
              backlinksAllTime: ahrefsData.backlinksAllTime || 0,
              referringDomains: ahrefsData.referringDomains,
              referringDomainsAllTime: ahrefsData.referringDomainsAllTime || 0,
              organicTraffic: ahrefsData.organicTraffic,
              organicKeywords: ahrefsData.organicKeywords,
              trafficValue: ahrefsData.trafficValue || 0,
              isReal: true,
            });
          } else {
            // Simulated metrics
            const hash = decodedDomain.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
            setDashboardMetrics({
              domainRating: Math.round(30 + (hash % 50)),
              ahrefsRank: Math.round(1000 + (hash % 5000)),
              backlinks: Math.round(50 + (hash % 800)),
              backlinksAllTime: Math.round(200 + (hash % 2000)),
              referringDomains: Math.round(10 + (hash % 100)),
              referringDomainsAllTime: Math.round(50 + (hash % 300)),
              organicTraffic: Math.round(100 + (hash % 2000)),
              organicKeywords: Math.round(20 + (hash % 200)),
              trafficValue: Math.round(50 + (hash % 500)),
              isReal: false,
            });
          }
          
          setAuditResults(generateAuditResults(decodedDomain, ahrefsData));
        }
      } catch (err) {
        console.error('Audit fetch error:', err);
        setAuditResults(generateAuditResults(decodedDomain, null));
        toast.error('Error fetching audit data');
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay for UX then fetch
    const timer = setTimeout(fetchAuditData, 1500);
    return () => clearTimeout(timer);
  }, [decodedDomain, navigate]);

  const overallScore = auditResults.length
    ? Math.round(auditResults.reduce((sum, cat) => sum + cat.score, 0) / auditResults.length)
    : 0;

  // Generate recommendations based on audit scores
  const recommendations = useMemo(() => {
    const recs: {
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      category: string;
      icon: React.ElementType;
      actions: string[];
      service?: 'BRON' | 'CADE';
      comingSoon?: string[];
    }[] = [];

    // Find categories by title
    const getCategory = (title: string) => auditResults.find(c => c.title === title);
    
    const pageSpeed = getCategory('Page Speed');
    const backlinks = getCategory('Backlink Profile');
    const technical = getCategory('Technical SEO');
    const schema = getCategory('Schema Markup');
    const meta = getCategory('Meta Tags');
    const security = getCategory('Security');

    // BRON (Backlink Ranking Optimization Network) - handles DR, DA, link building, keyword clusters
    if (dashboardMetrics && (dashboardMetrics.domainRating < 50 || dashboardMetrics.referringDomains < 50)) {
      recs.push({
        title: 'BRON: Boost Domain Rating & Authority',
        description: 'BRON (Backlink Ranking Optimization Network) delivers real business website deep links into your clustered topical content using our proprietary Diamond Flow methodology. Unlike PBNs or spam networks, BRON sources links exclusively from legitimate, niche-relevant business websites. All link equity flows upward through your content silos into your money pages, boosting your entire domain\'s authority. BRON automatically reverse engineers the top 5 ranked pages for your target keywords to create the exact keyword clusters that Google rewards with higher rankings.',
        priority: 'high',
        category: 'Authority & Links',
        icon: Link2,
        actions: [
          'Deep links from real business websites',
          'Diamond Flow link architecture',
          'Domain Rating & Domain Authority boosting',
          'Links directed to your money page',
          'Weekly keyword ranking reports',
          'Top 5 competitor keyword cluster analysis',
          'Niche-relevant link sourcing'
        ],
        service: 'BRON',
        comingSoon: ['AEO & GEO tracking'],
      });
    } else if (dashboardMetrics && dashboardMetrics.domainRating >= 50) {
      recs.push({
        title: 'BRON: Scale Your Link Authority',
        description: 'Continue accelerating your Domain Rating growth with BRON\'s Diamond Flow architecture. Real business website links flow strategically into your keyword clusters and money pages, creating a powerful authority network. Weekly ranking reports track your keyword positions across search engines, while our system continuously reverse engineers top-performing competitors to identify new cluster opportunities and link placement strategies.',
        priority: 'medium',
        category: 'Authority & Links',
        icon: TrendingUp,
        actions: [
          'Diamond Flow link silos',
          'Clustered topical content links',
          'Money page link targeting',
          'Weekly ranking reports',
          'Keyword cluster optimization',
          'Competitor reverse engineering'
        ],
        service: 'BRON',
        comingSoon: ['AEO & GEO tracking'],
      });
    }

    // CADE (Content Automation and Domain Enhancement) - handles content, social signals, GMB, internal linking
    if (dashboardMetrics && (dashboardMetrics.organicTraffic < 500 || dashboardMetrics.organicKeywords < 100)) {
      recs.push({
        title: 'CADE: Build Topical Authority',
        description: 'CADE (Content Automation and Domain Enhancement) creates ongoing content with 7 different blog types designed to establish your site as the topical authority in your niche. Each blog generates 3-5 FAQs with individual URLs—going the extra mile that other agencies skip. These FAQs are dripped throughout the week, then posted to your social media channels for engagement signals that Google uses to measure topical relevance. CADE continuously reverse engineers your top 5 competitors on complete autopilot, identifying content gaps and opportunities.',
        priority: 'high',
        category: 'Content & Signals',
        icon: FileText,
        actions: [
          '7 types of automated blog content',
          '3-5 FAQs per blog with individual URLs',
          'Social media posting for social signals',
          'Internal linking to keyword clusters',
          'Top 5 competitor reverse engineering',
          'Automated content gap analysis'
        ],
        service: 'CADE',
        comingSoon: ['GMB signals', 'On-page optimization'],
      });
    } else {
      recs.push({
        title: 'CADE: Amplify Content & Signals',
        description: 'CADE (Content Automation and Domain Enhancement) delivers ongoing content with 7 strategically designed blog types, each generating 3-5 FAQs with individual URLs—going the extra mile other agencies skip. Content is automatically posted to your social media channels for engagement signals that build topical authority. CADE\'s smart internal linking connects new content to your keyword clusters and money pages, while continuously analyzing your top 5 competitors to identify new opportunities and content gaps.',
        priority: 'high',
        category: 'Content & Signals',
        icon: Users,
        actions: [
          'Ongoing 7-type blog automation',
          'Individual FAQ URLs for each question',
          'Social signal distribution',
          'Smart internal linking',
          'Competitor analysis on autopilot',
          'Automated content gap analysis'
        ],
        service: 'CADE',
        comingSoon: ['GMB signals', 'On-page optimization'],
      });
    }

    // Page Speed recommendations
    if (pageSpeed && pageSpeed.score < 70) {
      recs.push({
        title: 'Improve Page Speed',
        description: pageSpeed.score < 50 
          ? 'Critical: Your page speed is severely impacting user experience and rankings.'
          : 'Your site loads slower than competitors, hurting conversions and SEO.',
        priority: pageSpeed.score < 50 ? 'high' : 'medium',
        category: 'Page Speed',
        icon: Gauge,
        actions: ['Optimize images', 'Enable caching', 'Minify CSS/JS', 'Use a CDN'],
      });
    }

    // Technical SEO recommendations
    if (technical && technical.score < 70) {
      recs.push({
        title: 'Fix Technical SEO Issues',
        description: 'Technical issues are preventing search engines from properly crawling and indexing your site.',
        priority: technical.score < 50 ? 'high' : 'medium',
        category: 'Technical',
        icon: FileText,
        actions: ['Fix mobile issues', 'Update sitemap', 'Optimize robots.txt', 'Add canonical tags'],
      });
    }

    // Meta tags recommendations
    if (meta && meta.score < 70) {
      recs.push({
        title: 'Optimize Meta Tags',
        description: 'Your meta titles and descriptions need improvement to boost click-through rates.',
        priority: meta.score < 50 ? 'high' : 'medium',
        category: 'Meta Tags',
        icon: Search,
        actions: ['Write compelling titles', 'Optimize descriptions', 'Add OG tags', 'Target keywords'],
      });
    }

    // Security recommendations
    if (security && security.score < 80) {
      recs.push({
        title: 'Enhance Security Headers',
        description: 'Security issues can hurt trust signals and may impact your search rankings.',
        priority: security.score < 60 ? 'high' : 'low',
        category: 'Security',
        icon: Shield,
        actions: ['Enable HTTPS', 'Add CSP headers', 'Implement HSTS', 'Fix mixed content'],
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recs.slice(0, 6); // Limit to 6 recommendations
  }, [auditResults, dashboardMetrics]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SEO
          title={`Analyzing ${decodedDomain} | Free Domain Audit`}
          description={`Running comprehensive domain audit for ${decodedDomain}`}
          noIndex
        />
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24"
            >
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <Gauge className="absolute inset-0 m-auto w-10 h-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Analyzing {decodedDomain}</h1>
              <p className="text-muted-foreground mb-8">
                Running comprehensive domain audit...
              </p>
              <div className="flex flex-col gap-3 max-w-md mx-auto text-left">
                {[
                  { icon: Gauge, text: "Measuring page speed metrics..." },
                  { icon: Link2, text: "Analyzing backlink profile..." },
                  { icon: FileCode, text: "Scanning for schema markup..." },
                  { icon: Search, text: "Checking meta tags..." },
                  { icon: FileText, text: "Reviewing technical SEO..." },
                  { icon: Shield, text: "Verifying security headers..." },
                ].map((item, i) => (
                  <motion.div
                    key={item.text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.3 }}
                    className="flex items-center gap-3 text-sm text-muted-foreground"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.text}</span>
                    {i < 5 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (i + 1) * 0.4 }}
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`Domain Audit Results for ${decodedDomain} | Webstack.ceo`}
        description={`Comprehensive domain audit results for ${decodedDomain}. Check page speed, backlinks, schema markup, meta tags, and security analysis.`}
        noIndex
      />
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          {/* Combined Hero Section: Free Website Audit + Website Profile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="p-6 rounded-2xl bg-card border border-border/50">
              {/* Header Row */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {websiteProfile?.favicon ? (
                      <img 
                        src={websiteProfile.favicon} 
                        alt="" 
                        className="w-10 h-10 rounded-lg object-contain bg-muted p-1"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <Globe className="w-10 h-10 text-primary" />
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {isSaved ? (
                          <a 
                            href={`https://${decodedDomain}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-2xl md:text-3xl font-bold hover:text-primary transition-colors flex items-center gap-2 group"
                          >
                            {decodedDomain}
                            <ExternalLink className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ) : (
                          <h1 className="text-2xl md:text-3xl font-bold">{decodedDomain}</h1>
                        )}
                        {dashboardMetrics?.isReal && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-primary/20 to-violet-500/20 text-primary font-semibold flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            Live Data
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Free Website Audit Tool
                        {dashboardMetrics?.ahrefsRank > 0 && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded bg-muted">
                            Ahrefs Rank: #{dashboardMetrics.ahrefsRank.toLocaleString()}
                          </span>
                        )}
                      </p>
                      
                      {/* Claimed Notification - below subtitle, left-justified */}
                      {isClaimed && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 mt-2 w-fit"
                        >
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 0.7, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                            className="text-green-500 shrink-0"
                          >
                            <ArrowRight className="w-3 h-3 rotate-[225deg]" />
                          </motion.div>
                          <Link2 className="w-3 h-3 text-green-400 shrink-0" />
                          <span className="text-xs font-medium text-green-400">
                            {justClaimed 
                              ? "Your do-follow link is now active! Click the domain to visit."
                              : "This website owner claimed their free do-follow link!"
                            }
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  {!isClaimed && (
                    <Button 
                      variant="outline" 
                      className="gap-2 min-w-[160px] justify-center" 
                      onClick={handleSaveClick}
                    >
                      <Gift className="w-4 h-4 text-primary" />
                      Save & Get Free Backlink
                    </Button>
                  )}
                  <Button className="gap-2 min-w-[140px] justify-center" asChild>
                    <a href="https://calendly.com/d/csmt-vs9-zq6/seo-local-book-demo" target="_blank" rel="noopener noreferrer">
                      <Phone className="w-4 h-4" />
                      Book a Call
                    </a>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2 min-w-[140px] justify-center shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] hover:border-amber-400 hover:text-amber-400 hover:bg-amber-400/10 transition-all duration-300" 
                    asChild
                  >
                    <a href="/pricing">
                      <Sparkles className="w-4 h-4" />
                      Get Started
                    </a>
                  </Button>
                </div>
              </div>

              {/* Social Links & Contact Row */}
              {websiteProfile && (
                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border/50">
                  {/* Social Links */}
                  {Object.entries(websiteProfile.socialLinks || {}).some(([_, v]) => v) && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Social:</span>
                      {websiteProfile.socialLinks?.facebook && (
                        <a href={websiteProfile.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </a>
                      )}
                      {websiteProfile.socialLinks?.twitter && (
                        <a href={websiteProfile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        </a>
                      )}
                      {websiteProfile.socialLinks?.linkedin && (
                        <a href={websiteProfile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        </a>
                      )}
                      {websiteProfile.socialLinks?.instagram && (
                        <a href={websiteProfile.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                        </a>
                      )}
                      {websiteProfile.socialLinks?.youtube && (
                        <a href={websiteProfile.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                        </a>
                      )}
                      {websiteProfile.socialLinks?.tiktok && (
                        <a href={websiteProfile.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                        </a>
                      )}
                    </div>
                  )}
                  
                  {/* Contact Info */}
                  {websiteProfile.contactInfo?.email && (
                    <a href={`mailto:${websiteProfile.contactInfo.email}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                      {websiteProfile.contactInfo.email}
                    </a>
                  )}
                  {websiteProfile.contactInfo?.phone && (
                    <a href={`tel:${websiteProfile.contactInfo.phone}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                      {websiteProfile.contactInfo.phone}
                    </a>
                  )}
                  
                  {/* Category Badge */}
                  {websiteProfile.detectedCategory && (
                    <span className="ml-auto text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                      {websiteProfile.detectedCategory.replace('_', ' ')}
                    </span>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Dashboard Metrics Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <div className="p-6 rounded-2xl bg-card border border-border/50">

              {/* Floating Export PDF Button */}
              <FloatingExportPDF 
                domain={decodedDomain} 
                onExport={() => {
                  generateAuditPDF({
                    domain: decodedDomain,
                    overallScore,
                    dashboardMetrics,
                    auditResults,
                    historyData: historyData || undefined,
                  });
                }}
              />

              {/* Main Dials Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-6">
                {dashboardMetrics && (
                  <>
                    <ScoreDial
                      value={dashboardMetrics.domainRating}
                      max={100}
                      label="Domain Rating"
                      size="md"
                      color="violet"
                    />
                    <ScoreDial
                      value={dashboardMetrics.organicTraffic}
                      max={Math.max(dashboardMetrics.organicTraffic * 1.5, 1000)}
                      label="Organic Traffic"
                      size="md"
                      color="green"
                      showPercentage={false}
                      suffix="/mo"
                    />
                    <ScoreDial
                      value={dashboardMetrics.trafficValue}
                      max={Math.max(dashboardMetrics.trafficValue * 1.5, 100)}
                      label="Traffic Value"
                      size="md"
                      color="cyan"
                      showPercentage={false}
                      prefix="$"
                    />
                    <ScoreDial
                      value={dashboardMetrics.organicKeywords}
                      max={Math.max(dashboardMetrics.organicKeywords * 1.5, 100)}
                      label="Organic Keywords"
                      size="md"
                      color="amber"
                      showPercentage={false}
                    />
                    <ScoreDial
                      value={dashboardMetrics.backlinks}
                      max={Math.max(dashboardMetrics.backlinks * 1.2, 1000)}
                      label="Backlinks"
                      size="md"
                      color="primary"
                      showPercentage={false}
                    />
                    <ScoreDial
                      value={dashboardMetrics.referringDomains}
                      max={Math.max(dashboardMetrics.referringDomains * 1.3, 500)}
                      label="Referring Domains"
                      size="md"
                      color="green"
                      showPercentage={false}
                    />
                  </>
                )}
              </div>

              {/* Secondary Stats Row */}
              {dashboardMetrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border/50">
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <p className="text-2xl font-bold text-foreground">{dashboardMetrics.backlinksAllTime.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">All-Time Backlinks</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <p className="text-2xl font-bold text-foreground">{dashboardMetrics.referringDomainsAllTime.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">All-Time Ref. Domains</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <p className="text-2xl font-bold text-foreground">#{dashboardMetrics.ahrefsRank.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Ahrefs Global Rank</p>
                  </div>
                  <div className="flex items-center justify-center p-3 rounded-xl bg-muted/30">
                    <ScoreDial
                      value={overallScore}
                      max={100}
                      label="SEO Score"
                      size="sm"
                      color="primary"
                    />
                  </div>
                </div>
              )}

              {/* Historical Trend Chart - Integrated */}
              {historyData && historyData.length > 0 && (
                <div className="pt-6 border-t border-border/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">2-Year Performance Trend</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Clickable Legend */}
                      <button
                        onClick={() => setChartLines(prev => ({ ...prev, traffic: !prev.traffic }))}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
                          chartLines.traffic ? 'bg-green-500/10' : 'opacity-40'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${chartLines.traffic ? 'bg-green-500' : 'bg-muted'}`} />
                        <span className="text-xs text-muted-foreground">Traffic</span>
                      </button>
                      <button
                        onClick={() => setChartLines(prev => ({ ...prev, keywords: !prev.keywords }))}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
                          chartLines.keywords ? 'bg-amber-500/10' : 'opacity-40'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${chartLines.keywords ? 'bg-amber-500' : 'bg-muted'}`} />
                        <span className="text-xs text-muted-foreground">Keywords</span>
                      </button>
                      <button
                        onClick={() => setChartLines(prev => ({ ...prev, dr: !prev.dr }))}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
                          chartLines.dr ? 'bg-primary/10' : 'opacity-40'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${chartLines.dr ? 'bg-primary' : 'bg-muted'}`} />
                        <span className="text-xs text-muted-foreground">DR</span>
                      </button>
                      <button
                        onClick={() => setChartLines(prev => ({ ...prev, value: !prev.value }))}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
                          chartLines.value ? 'bg-violet-500/10' : 'opacity-40'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${chartLines.value ? 'bg-violet-500' : 'bg-muted'}`} />
                        <span className="text-xs text-muted-foreground">Value</span>
                      </button>
                    </div>
                  </div>

                  <div className="h-[225px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={historyData}
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis
                          dataKey="date"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                          }}
                        />
                        <YAxis
                          yAxisId="left"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                          width={45}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          domain={[0, 100]}
                          width={35}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            fontSize: '12px',
                          }}
                          labelFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                          }}
                          formatter={(value: number, name: string) => {
                            if (name === 'Domain Rating') return [value, name];
                            if (name === 'Traffic Value') return [`$${value.toLocaleString()}`, name];
                            return [value.toLocaleString(), name];
                          }}
                        />
                        {chartLines.traffic && (
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="organicTraffic"
                            name="Organic Traffic"
                            stroke="hsl(142, 76%, 36%)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: "hsl(142, 76%, 36%)" }}
                          />
                        )}
                        {chartLines.keywords && (
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="organicKeywords"
                            name="Keywords"
                            stroke="hsl(38, 92%, 50%)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: "hsl(38, 92%, 50%)" }}
                          />
                        )}
                        {chartLines.dr && (
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="domainRating"
                            name="Domain Rating"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                          />
                        )}
                        {chartLines.value && (
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="trafficValue"
                            name="Traffic Value"
                            stroke="hsl(280, 80%, 60%)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: "hsl(280, 80%, 60%)" }}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </motion.div>


          {/* Website Description Box */}
          {(isProfileLoading || (websiteProfile && (websiteProfile.title || websiteProfile.summary))) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-8"
            >
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  About This Website
                </h2>
                {isProfileLoading ? (
                  <div className="space-y-3">
                    <div className="h-5 w-2/3 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
                  </div>
                ) : websiteProfile && (
                  <div className="space-y-3">
                    {websiteProfile.title && (
                      <h3 className="text-lg font-semibold text-foreground">{websiteProfile.title}</h3>
                    )}
                    {websiteProfile.summary && (
                      <p className="text-muted-foreground leading-relaxed">{websiteProfile.summary}</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Category Scores Overview - Dial Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold mb-6">Technical Health Overview</h2>
            <div className="p-6 rounded-2xl bg-card border border-border/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {auditResults.map((category, i) => {
                  const barColor = category.score >= 80 
                    ? "bg-gradient-to-r from-green-500 to-emerald-400" 
                    : category.score >= 60 
                    ? "bg-gradient-to-r from-amber-500 to-orange-400" 
                    : "bg-gradient-to-r from-red-500 to-rose-400";
                  const passedChecks = category.checks.filter((c) => c.status === "pass").length;
                  const totalChecks = category.checks.length;
                  
                  return (
                    <motion.div
                      key={category.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      className={`p-4 rounded-xl cursor-pointer hover:bg-muted/30 transition-all border border-border/30 ${
                        category.isRealData ? 'ring-1 ring-primary/30' : ''
                      }`}
                      onClick={() => toggleCategory(category.title)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${category.score >= 80 ? 'bg-green-500/20' : category.score >= 60 ? 'bg-amber-500/20' : 'bg-red-500/20'}`}>
                            <category.icon className={`w-4 h-4 ${getScoreColor(category.score)}`} />
                          </div>
                          <span className="text-sm font-medium">{category.title}</span>
                          {category.isRealData && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-primary/20 to-violet-500/20 text-primary font-semibold">
                              LIVE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${getScoreColor(category.score)}`}>
                            {category.score}
                          </span>
                          {expandedCategories.has(category.title) ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${category.score}%` }}
                          transition={{ duration: 0.8, delay: 0.3 + i * 0.05, ease: "easeOut" }}
                          className={`h-full ${barColor} rounded-full`}
                        />
                      </div>
                      
                      {/* Check summary */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{passedChecks}/{totalChecks} checks passed</span>
                        <div className="flex items-center gap-1">
                          {passedChecks === totalChecks ? (
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                          ) : passedChecks >= totalChecks / 2 ? (
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                          <span>
                            {passedChecks === totalChecks ? 'All clear' : passedChecks >= totalChecks / 2 ? 'Needs attention' : 'Critical'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Detailed Results - Collapsible Cards - MOVED ABOVE RECOMMENDATIONS */}
          <div className="space-y-4 mb-8">
            {auditResults.map((category, catIndex) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + catIndex * 0.05 }}
                className="rounded-2xl bg-card border border-border/50 overflow-hidden"
              >
                {/* Header - Always Visible */}
                <button
                  onClick={() => toggleCategory(category.title)}
                  className="w-full p-5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${getScoreGradient(category.score)}/20`}>
                      <category.icon className={`w-5 h-5 ${getScoreColor(category.score)}`} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold">{category.title}</h2>
                        {category.isRealData && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-primary/20 to-violet-500/20 text-primary font-semibold">
                            Live Data
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {category.checks.filter((c) => c.status === "pass").length}/{category.checks.length} checks passed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className={`text-xl font-bold ${getScoreColor(category.score)}`}>
                        {category.score}
                      </span>
                      <span className="text-sm text-muted-foreground">/100</span>
                    </div>
                    {expandedCategories.has(category.title) ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedCategories.has(category.title) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border/50 divide-y divide-border/50">
                        {category.checks.map((check) => (
                          <div
                            key={check.name}
                            className="p-4 flex items-start gap-3 hover:bg-muted/20 transition-colors"
                          >
                            {getStatusIcon(check.status)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-medium">{check.name}</span>
                                {check.value && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                                    {check.value}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {check.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Actionable Recommendations - NOW BELOW DETAILED REPORTS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold">Actionable Recommendations</h2>
              <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 font-semibold">
                {recommendations.filter(r => r.priority === 'high').length} High Priority
              </span>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {recommendations.map((rec, i) => (
                <motion.div
                  key={rec.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className={`p-5 rounded-2xl border ${
                    rec.priority === 'high' 
                      ? 'bg-gradient-to-br from-red-500/5 to-orange-500/5 border-red-500/20' 
                      : rec.priority === 'medium'
                      ? 'bg-gradient-to-br from-amber-500/5 to-yellow-500/5 border-amber-500/20'
                      : 'bg-card border-border/50'
                  }`}
                >
                  {/* Magazine-style layout for BRON and CADE with text wrapping around images */}
                  {rec.service ? (
                    <div>
                      {/* Header with icon and badges */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          rec.priority === 'high'
                            ? 'bg-red-500/10'
                            : rec.priority === 'medium'
                            ? 'bg-amber-500/10'
                            : 'bg-primary/10'
                        }`}>
                          <rec.icon className={`w-5 h-5 ${
                            rec.priority === 'high'
                              ? 'text-red-500'
                              : rec.priority === 'medium'
                              ? 'text-amber-500'
                              : 'text-primary'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-lg">{rec.title}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              rec.service === 'BRON'
                                ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-400'
                                : 'bg-gradient-to-r from-primary/20 to-cyan-500/20 text-primary'
                            }`}>
                              {rec.service}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              rec.priority === 'high'
                                ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                                : rec.priority === 'medium'
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                : 'bg-primary/20 text-primary'
                            }`}>
                              {rec.priority === 'high' ? 'High Priority' : rec.priority === 'medium' ? 'Medium' : 'Low'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {rec.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Text with floated image */}
                      <div className="mb-4">
                        {/* Floated image on the right */}
                        <div className={`float-right ml-4 mb-2 w-36 sm:w-44 rounded-xl overflow-hidden border ${
                          rec.service === 'BRON' 
                            ? 'border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/10' 
                            : 'border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-primary/10'
                        }`}>
                          <img 
                            src={rec.service === 'BRON' ? bronDiamondFlow : cadeContentAutomation} 
                            alt={rec.service === 'BRON' ? 'BRON Diamond Flow Architecture' : 'CADE Content Automation'}
                            className="w-full h-auto object-contain"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{rec.description}</p>
                      </div>
                      
                      {/* Clear float and full-width action list */}
                      <div className="clear-both pt-2 border-t border-border/30">
                        <div className="flex flex-wrap gap-2 mt-3">
                          {rec.actions.map((action, j) => (
                            <span 
                              key={j}
                              className="text-xs px-2 py-1 rounded-md bg-muted/50 text-foreground flex items-center gap-1"
                            >
                              <Check className="w-3 h-3 text-green-500" />
                              {action}
                            </span>
                          ))}
                          {rec.comingSoon?.map((feature, j) => (
                            <span 
                              key={`coming-${j}`}
                              className="text-xs px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1 border border-amber-500/20"
                            >
                              <Clock className="w-3 h-3" />
                              {feature}
                              <span className="text-[9px] font-semibold">Coming Soon</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Standard layout for non-service recommendations */
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg shrink-0 ${
                        rec.priority === 'high'
                          ? 'bg-red-500/10'
                          : rec.priority === 'medium'
                          ? 'bg-amber-500/10'
                          : 'bg-primary/10'
                      }`}>
                        <rec.icon className={`w-5 h-5 ${
                          rec.priority === 'high'
                            ? 'text-red-500'
                            : rec.priority === 'medium'
                            ? 'text-amber-500'
                            : 'text-primary'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold">{rec.title}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            rec.priority === 'high'
                              ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                              : rec.priority === 'medium'
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                              : 'bg-primary/20 text-primary'
                          }`}>
                            {rec.priority === 'high' ? 'High Priority' : rec.priority === 'medium' ? 'Medium' : 'Low'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {rec.category}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {rec.actions.map((action, j) => (
                            <span 
                              key={j}
                              className="text-xs px-2 py-1 rounded-md bg-muted/50 text-foreground flex items-center gap-1"
                            >
                              <Check className="w-3 h-3 text-green-500" />
                              {action}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-violet-500/10 to-primary/10 border border-primary/20">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg mb-1">BRON + CADE included with every dashboard subscription</h3>
                  <p className="text-sm text-muted-foreground">
                    <strong>BRON</strong> (Backlink Ranking Optimization Network): Diamond Flow links, DR/DA boosting, weekly ranking reports. 
                    <strong className="ml-2">CADE</strong> (Content Automation and Domain Enhancement): 7 blog types, FAQ URLs, social signals, competitor analysis.
                  </p>
                </div>
                <Button className="shrink-0 gap-2" asChild>
                  <a href="https://calendly.com/d/csmt-vs9-zq6/seo-local-book-demo" target="_blank" rel="noopener noreferrer">
                    <Phone className="w-4 h-4" />
                    Book a Free Consultation
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>



          {/* Pricing Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3">
                Fix These Issues with{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-violet-500 to-amber-400 bg-clip-text text-transparent">
                  Professional SEO
                </span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Let our team of experts improve your SEO scores and boost your search rankings with our comprehensive plans.
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-10">
              <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Monthly
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                  isYearly ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <motion.div
                  className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md"
                  animate={{ x: isYearly ? 28 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
              <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Yearly
              </span>
              <span className="bg-gradient-to-r from-cyan-400 to-violet-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Save 20%
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                    plan.highlighted
                      ? "bg-gradient-to-b from-primary/20 to-primary/5 border-2 border-primary shadow-[0_0_40px_hsl(var(--primary)/0.2)]"
                      : "glass-card border border-white/10"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-cyan-400 to-violet-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    <p className="text-muted-foreground text-xs mb-3">{plan.description}</p>
                    
                    <div className="flex items-baseline justify-center gap-2">
                      {plan.originalPrice && !isYearly && (
                        <span className="text-lg text-muted-foreground line-through">
                          ${plan.originalPrice}
                        </span>
                      )}
                      <span className="text-3xl font-bold">
                        ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-muted-foreground text-sm">/mo</span>
                    </div>
                    
                    {plan.originalPrice && !isYearly && (
                      <span className="inline-block mt-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        50% OFF
                      </span>
                    )}
                    
                    {plan.hasScarcity && (
                      <div className="mt-3 flex items-center justify-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500 animate-pulse" />
                        <span className="text-xs font-medium text-orange-500">
                          Only {positionsLeft} spots left!
                        </span>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2 mb-6 text-sm">
                    {plan.features.slice(0, 6).map((feature) => {
                      const premium = premiumFeatures[feature];
                      return (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-muted-foreground text-xs flex items-center gap-1 flex-wrap">
                            {feature}
                            {premium && (
                              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-white bg-gradient-to-r ${premium.color}`}>
                                {premium.label}
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                    {plan.features.length > 6 && (
                      <li className="text-xs text-primary font-medium pl-6">
                        +{plan.features.length - 6} more features
                      </li>
                    )}
                  </ul>

                  {/* Add-ons */}
                  <div className="mb-4 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-1 mb-2">
                      <Plus className="w-3 h-3 text-primary" />
                      <span className="text-xs font-semibold">Add-ons</span>
                    </div>
                    <ul className="space-y-1">
                      {addOns.map((addon) => (
                        <li key={addon.name} className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{addon.name}</span>
                          <span className="text-primary text-[10px]">Contact</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.buttonText === "Book a Call" ? (
                    <Button variant="heroOutline" className="w-full" size="sm" asChild>
                      <a href="https://calendly.com/d/csmt-vs9-zq6/seo-local-book-demo" target="_blank" rel="noopener noreferrer">
                        {plan.buttonText}
                      </a>
                    </Button>
                  ) : (
                    <Button
                      variant={plan.highlighted ? "hero" : "heroOutline"}
                      className="w-full"
                      size="sm"
                    >
                      Get Started
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>

            

            {/* Trust Indicators */}
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: ShieldCheck, title: "30-Day Money Back" },
                { icon: CreditCard, title: "Secure Payments" },
                { icon: Clock, title: "Cancel Anytime" },
                { icon: HeadphonesIcon, title: "24/7 Support" },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-center gap-2 p-3 rounded-xl glass-card border border-white/10"
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium">{item.title}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* SEO Resources Section - Glossary Terms & Learning Guides */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-16 mb-8"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3">
                Learn More About{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-violet-500 to-amber-400 bg-clip-text text-transparent">
                  SEO Best Practices
                </span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explore our learning center guides and glossary terms relevant to improving your website's performance.
              </p>
            </div>

            {/* Learning Center Guides */}
            {matchedLearningGuides.length > 0 && (
              <div className="mb-10">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Recommended Guides
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matchedLearningGuides.map((guide, index) => (
                    <motion.div
                      key={guide.href}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <Link
                        to={guide.href}
                        className="group block p-5 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold group-hover:text-primary transition-colors">
                            {guide.title}
                          </h4>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {guide.description}
                        </p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Glossary Terms */}
            {matchedGlossaryTerms.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  Relevant SEO Concepts
                </h3>
                <div className="p-6 rounded-2xl bg-card border border-border/50">
                  <div className="flex flex-wrap gap-2">
                    {matchedGlossaryTerms.map((term) => (
                      <GlossaryTooltip key={term.slug} term={term.term}>
                        <Link
                          to={`/learn/glossary/${term.slug}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-gradient-to-r from-primary/10 to-violet-500/10 text-primary hover:from-primary/20 hover:to-violet-500/20 transition-colors border border-primary/20"
                        >
                          <Tag className="w-3 h-3" />
                          {term.term}
                        </Link>
                      </GlossaryTooltip>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Explore our full SEO glossary with 40+ terms and definitions.
                    </p>
                    <Link
                      to="/learn/glossary"
                      className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
                    >
                      View All Terms
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Email Capture Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Get a Free Do-Follow Backlink
            </DialogTitle>
            <DialogDescription>
              Save your audit to our website and we'll give you a <span className="font-semibold text-primary">free do-follow backlink</span> to your site! Just enter your email below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-violet-500/10 border border-primary/20">
              <div className="flex items-start gap-3">
                <Link2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">What you get:</p>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>• Your audit saved permanently on our site</li>
                    <li>• A do-follow backlink from our domain</li>
                    <li>• Featured in our Website Audits directory</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Your Business Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={`you@${decodedDomain?.replace(/^www\./, '').split('.').slice(-2).join('.') || 'yourdomain.com'}`}
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-amber-500 font-medium">Required:</span> Use an email from <span className="font-semibold">@{decodedDomain?.replace(/^www\./, '').split('.').slice(-2).join('.')}</span> to verify you own this domain.
              </p>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowEmailDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={saveAudit}
                disabled={isSaving || !submitterEmail.trim()}
                className="flex-1 gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save & Claim Backlink
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default AuditResults;
