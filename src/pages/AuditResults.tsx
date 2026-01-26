import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
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
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { glossaryTerms } from "@/data/glossaryData";
import { WebsiteProfileSection } from "@/components/audit/WebsiteProfileSection";
import { ProgressIndicator, ProgressSummaryBanner } from "@/components/audit/ProgressIndicator";
import { ContentReadabilitySection } from "@/components/audit/ContentReadabilitySection";
import { InternalLinkingSection } from "@/components/audit/InternalLinkingSection";
import { CoreWebVitalsSection } from "@/components/audit/CoreWebVitalsSection";
import { CompetitorGapSection } from "@/components/audit/CompetitorGapSection";
import { LocalSEOSection } from "@/components/audit/LocalSEOSection";
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
  MapPin,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FloatingExportPDF from "@/components/ui/floating-export-pdf";
import { generateAuditPDF } from "@/lib/generateAuditPDF";

// Baseline metrics from first audit for progress tracking
interface BaselineMetrics {
  domainRating: number;
  organicTraffic: number;
  organicKeywords: number;
  backlinks: number;
  referringDomains: number;
  trafficValue: number;
  snapshotDate: string;
}

interface TechnicalSEO {
  hasTitle: boolean;
  titleLength: number;
  hasMetaDescription: boolean;
  descriptionLength: number;
  hasCanonical: boolean;
  canonicalUrl: string | null;
  hasViewport: boolean;
  hasRobotsMeta: boolean;
  robotsContent: string | null;
  hasOgTitle: boolean;
  hasOgDescription: boolean;
  hasOgImage: boolean;
  hasOgUrl: boolean;
  hasTwitterCard: boolean;
  h1Count: number;
  h1Text: string[];
  h2Count: number;
  h3Count: number;
  hasProperHeadingHierarchy: boolean;
  totalImages: number;
  imagesWithAlt: number;
  imagesWithoutAlt: number;
  altCoverage: number;
  hasSchemaMarkup: boolean;
  schemaTypes: string[];
  internalLinks: number;
  externalLinks: number;
  isHttps: boolean;
  hasSitemapLink: boolean;
  hasLangAttribute: boolean;
  langValue: string | null;
}

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
  technicalSEO?: TechnicalSEO;
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

// Next Report Countdown Component for Case Studies
const NextReportCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  useEffect(() => {
    // Calculate next report date (28 days from now, at midnight)
    const getNextReportDate = () => {
      const now = new Date();
      const nextReport = new Date(now);
      nextReport.setDate(nextReport.getDate() + 28);
      nextReport.setHours(0, 0, 0, 0);
      return nextReport;
    };
    
    const nextReport = getNextReportDate();
    
    const updateCountdown = () => {
      const now = new Date();
      const diff = nextReport.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft({ days, hours, minutes, seconds });
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <motion.div 
      className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-gradient-to-br from-primary/15 via-violet-500/10 to-cyan-500/10 border border-primary/30 shadow-lg shadow-primary/10 min-w-[280px]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
    >
      <div className="relative">
        <motion.div
          className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary/30 to-violet-500/30 blur-sm"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div className="relative p-3 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/30">
          <Calendar className="w-6 h-6 text-primary" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-foreground">Case Studies on Autopilot</span>
        <span className="text-xs text-muted-foreground">Next report update in:</span>
        <div className="flex items-center gap-1 font-mono text-base font-bold mt-1">
          <span className="px-2.5 py-1 rounded-lg bg-gradient-to-b from-primary/30 to-primary/20 text-primary border border-primary/30 shadow-sm">{timeLeft.days}d</span>
          <span className="text-primary/60 font-bold">:</span>
          <span className="px-2.5 py-1 rounded-lg bg-gradient-to-b from-primary/30 to-primary/20 text-primary border border-primary/30 shadow-sm">{String(timeLeft.hours).padStart(2, '0')}h</span>
          <span className="text-primary/60 font-bold">:</span>
          <span className="px-2.5 py-1 rounded-lg bg-gradient-to-b from-primary/30 to-primary/20 text-primary border border-primary/30 shadow-sm">{String(timeLeft.minutes).padStart(2, '0')}m</span>
          <span className="text-primary/60 font-bold">:</span>
          <motion.span 
            className="px-2.5 py-1 rounded-lg bg-gradient-to-b from-cyan-500/30 to-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm"
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {String(timeLeft.seconds).padStart(2, '0')}s
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
};

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
  showFullNumber = false,
}: {
  value: number;
  max?: number;
  label: string;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "green" | "amber" | "violet" | "cyan";
  showPercentage?: boolean;
  prefix?: string;
  suffix?: string;
  showFullNumber?: boolean;
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
    if (showFullNumber) return val.toLocaleString();
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

// Generate audit results - now accepts optional real Ahrefs data and technical SEO data
const generateAuditResults = (
  domain: string, 
  ahrefsData?: AhrefsMetrics | null,
  technicalSEO?: TechnicalSEO | null
): AuditCategory[] => {
  const hash = domain.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const randomScore = (base: number, variance: number) => {
    const offset = ((hash % 100) / 100) * variance * 2 - variance;
    return Math.min(100, Math.max(0, Math.round(base + offset)));
  };

  const randomValue = (min: number, max: number) => {
    return Math.round(min + ((hash % 100) / 100) * (max - min));
  };

  const speedScore = randomScore(72, 20);
  
  // Calculate scores from real technical SEO data when available
  const hasRealTechnicalData = !!technicalSEO;
  
  // Schema score from real data
  let schemaScore: number;
  if (technicalSEO) {
    schemaScore = technicalSEO.hasSchemaMarkup ? 
      (technicalSEO.schemaTypes.length >= 3 ? 85 : technicalSEO.schemaTypes.length >= 1 ? 60 : 40) : 20;
  } else {
    schemaScore = randomScore(45, 30);
  }
  
  // Meta tags score from real data
  let metaScore: number;
  if (technicalSEO) {
    let metaPoints = 0;
    if (technicalSEO.hasTitle && technicalSEO.titleLength >= 30 && technicalSEO.titleLength <= 60) metaPoints += 25;
    else if (technicalSEO.hasTitle) metaPoints += 15;
    if (technicalSEO.hasMetaDescription && technicalSEO.descriptionLength >= 120 && technicalSEO.descriptionLength <= 160) metaPoints += 25;
    else if (technicalSEO.hasMetaDescription) metaPoints += 15;
    if (technicalSEO.hasOgTitle && technicalSEO.hasOgDescription && technicalSEO.hasOgImage) metaPoints += 25;
    else if (technicalSEO.hasOgTitle || technicalSEO.hasOgDescription) metaPoints += 10;
    if (technicalSEO.hasTwitterCard) metaPoints += 15;
    if (technicalSEO.hasViewport) metaPoints += 10;
    metaScore = Math.min(100, metaPoints);
  } else {
    metaScore = randomScore(68, 25);
  }
  
  // Security score from real data
  let securityScore: number;
  if (technicalSEO) {
    securityScore = technicalSEO.isHttps ? 85 : 30;
  } else {
    securityScore = randomScore(85, 15);
  }
  
  // Technical SEO score from real data
  let technicalScore: number;
  if (technicalSEO) {
    let techPoints = 0;
    if (technicalSEO.hasViewport) techPoints += 20; // Mobile friendliness
    if (technicalSEO.hasProperHeadingHierarchy) techPoints += 20;
    if (technicalSEO.altCoverage >= 80) techPoints += 20;
    else if (technicalSEO.altCoverage >= 50) techPoints += 10;
    if (technicalSEO.hasCanonical) techPoints += 20;
    if (technicalSEO.hasLangAttribute) techPoints += 10;
    if (technicalSEO.hasSitemapLink) techPoints += 10;
    technicalScore = Math.min(100, techPoints);
  } else {
    technicalScore = randomScore(65, 25);
  }

  // Calculate backlink score from real Ahrefs data or use simulated
  let backlinkScore: number;
  let hasRealBacklinkData = false;
  
  if (ahrefsData) {
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
      isRealData: hasRealTechnicalData,
      checks: technicalSEO ? [
        {
          name: "Mobile Friendliness (Viewport)",
          status: technicalSEO.hasViewport ? "pass" : "fail",
          value: technicalSEO.hasViewport ? "Viewport configured" : "Missing viewport meta",
          description: "Site must have viewport meta for mobile-first indexing (real data)",
        },
        {
          name: "Heading Structure (H1-H6)",
          status: technicalSEO.hasProperHeadingHierarchy ? "pass" : technicalSEO.h1Count > 0 ? "warning" : "fail",
          value: technicalSEO.h1Count === 1 ? "Valid hierarchy (1 H1)" : `${technicalSEO.h1Count} H1 tags found`,
          description: "Proper heading hierarchy helps search engines understand content (real data)",
        },
        {
          name: "Image Alt Attributes",
          status: technicalSEO.altCoverage >= 80 ? "pass" : technicalSEO.altCoverage >= 50 ? "warning" : "fail",
          value: `${technicalSEO.altCoverage}% coverage (${technicalSEO.imagesWithAlt}/${technicalSEO.totalImages} images)`,
          description: "Alt text improves accessibility and image SEO (real data)",
        },
        {
          name: "Sitemap Reference",
          status: technicalSEO.hasSitemapLink ? "pass" : "warning",
          value: technicalSEO.hasSitemapLink ? "Sitemap linked" : "No sitemap link found in HTML",
          description: "XML sitemap helps search engines discover and index pages (real data)",
        },
        {
          name: "Canonical Tags",
          status: technicalSEO.hasCanonical ? "pass" : "fail",
          value: technicalSEO.hasCanonical ? (technicalSEO.canonicalUrl || "Set").substring(0, 50) : "Missing",
          description: "Canonicals prevent duplicate content issues (real data)",
        },
        {
          name: "Language Attribute",
          status: technicalSEO.hasLangAttribute ? "pass" : "warning",
          value: technicalSEO.hasLangAttribute ? `lang="${technicalSEO.langValue}"` : "Missing lang attribute",
          description: "Language attribute helps search engines serve correct language (real data)",
        },
      ] : [
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
      isRealData: hasRealTechnicalData,
      checks: technicalSEO ? [
        {
          name: "JSON-LD Present",
          status: technicalSEO.hasSchemaMarkup ? "pass" : "fail",
          value: technicalSEO.hasSchemaMarkup ? `${technicalSEO.schemaTypes.length} schema type(s) found` : "Not detected",
          description: "JSON-LD structured data helps search engines understand your content (real data)",
        },
        {
          name: "Schema Types Detected",
          status: technicalSEO.schemaTypes.length >= 2 ? "pass" : technicalSEO.schemaTypes.length >= 1 ? "warning" : "fail",
          value: technicalSEO.schemaTypes.length > 0 ? technicalSEO.schemaTypes.slice(0, 3).join(", ") : "None",
          description: "Multiple schema types provide richer search results (real data)",
        },
        {
          name: "Local Business Schema",
          status: technicalSEO.schemaTypes.some(t => t.toLowerCase().includes('localbusiness') || t.toLowerCase().includes('organization')) ? "pass" : "fail",
          description: "Local business/organization schema is essential for local SEO visibility (real data)",
        },
      ] : [
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
      isRealData: hasRealTechnicalData,
      checks: technicalSEO ? [
        {
          name: "Title Tag",
          status: technicalSEO.hasTitle ? 
            (technicalSEO.titleLength >= 30 && technicalSEO.titleLength <= 60 ? "pass" : "warning") : "fail",
          value: technicalSEO.hasTitle ? `${technicalSEO.titleLength} characters` : "Missing",
          description: "Title should be 30-60 characters for optimal display (real data)",
        },
        {
          name: "Meta Description",
          status: technicalSEO.hasMetaDescription ? 
            (technicalSEO.descriptionLength >= 120 && technicalSEO.descriptionLength <= 160 ? "pass" : "warning") : "fail",
          value: technicalSEO.hasMetaDescription ? `${technicalSEO.descriptionLength} characters` : "Missing",
          description: "Meta description should be 120-160 characters (real data)",
        },
        {
          name: "Open Graph Tags",
          status: (technicalSEO.hasOgTitle && technicalSEO.hasOgDescription && technicalSEO.hasOgImage) ? "pass" : 
                  (technicalSEO.hasOgTitle || technicalSEO.hasOgDescription) ? "warning" : "fail",
          value: [
            technicalSEO.hasOgTitle ? "title" : null,
            technicalSEO.hasOgDescription ? "desc" : null,
            technicalSEO.hasOgImage ? "image" : null,
            technicalSEO.hasOgUrl ? "url" : null,
          ].filter(Boolean).join(", ") || "None",
          description: "OG tags control how content appears when shared on social media (real data)",
        },
        {
          name: "Twitter Card Tags",
          status: technicalSEO.hasTwitterCard ? "pass" : "fail",
          value: technicalSEO.hasTwitterCard ? "Configured" : "Missing",
          description: "Twitter cards enhance link previews on Twitter/X (real data)",
        },
        {
          name: "Viewport Meta Tag",
          status: technicalSEO.hasViewport ? "pass" : "fail",
          value: technicalSEO.hasViewport ? "Configured" : "Missing",
          description: "Viewport meta enables proper mobile rendering (real data)",
        },
      ] : [
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
      isRealData: hasRealTechnicalData,
      checks: technicalSEO ? [
        {
          name: "HTTPS Enabled",
          status: technicalSEO.isHttps ? "pass" : "fail",
          value: technicalSEO.isHttps ? "Secure connection" : "HTTP only",
          description: "HTTPS is required for secure data transmission and SEO (real data)",
        },
        {
          name: "SSL Certificate",
          status: technicalSEO.isHttps ? "pass" : "fail",
          value: technicalSEO.isHttps ? "Valid SSL" : "No SSL detected",
          description: "SSL certificate enables HTTPS connections (real data)",
        },
      ] : [
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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isEmbedMode = searchParams.get('embed') === 'true';
  const isCaseStudyMode = location.pathname.startsWith('/case-study/');
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
  
  // Store the actual domain from the database (not the URL slug)
  const [actualDomain, setActualDomain] = useState<string | null>(null);
  
  // Chart line visibility toggles
  const [chartLines, setChartLines] = useState({
    traffic: true,
    keywords: true,
    dr: true,
    value: true,
  });
  
  // Baseline metrics for progress tracking (first audit snapshot)
  const [baselineMetrics, setBaselineMetrics] = useState<BaselineMetrics | null>(null);
  
  // PageSpeed Insights metrics (real Core Web Vitals data)
  const [pageSpeedMetrics, setPageSpeedMetrics] = useState<{
    lcp: { value: number; rating: "good" | "needs-improvement" | "poor"; element?: string };
    fid: { value: number; rating: "good" | "needs-improvement" | "poor" };
    cls: { value: number; rating: "good" | "needs-improvement" | "poor"; element?: string };
    inp: { value: number; rating: "good" | "needs-improvement" | "poor" };
    ttfb: { value: number; rating: "good" | "needs-improvement" | "poor" };
    fcp: { value: number; rating: "good" | "needs-improvement" | "poor" };
    mobile: { score: number; lcp: number; cls: number; fid: number };
    desktop: { score: number; lcp: number; cls: number; fid: number };
    recommendations: string[];
  } | null>(null);
  const [isPageSpeedLoading, setIsPageSpeedLoading] = useState(false);
  
  // All saved case studies for the selector
  const [allCaseStudies, setAllCaseStudies] = useState<Array<{ slug: string; domain: string; favicon_url: string | null }>>([]);

  const decodedDomain = domain ? decodeURIComponent(domain) : "";
  
  // For display purposes, prefer the actual domain from DB over the URL slug
  const displayDomain = actualDomain || decodedDomain;
  const contentMetrics = useMemo(() => {
    if (!websiteProfile) return null;
    
    // Use real content metrics from enhanced scrape-website edge function
    const scraped = (websiteProfile as any).contentMetrics;
    if (scraped && scraped.wordCount > 0) {
      return {
        wordCount: scraped.wordCount,
        sentenceCount: scraped.sentenceCount,
        paragraphCount: scraped.paragraphCount,
        avgWordsPerSentence: scraped.avgWordsPerSentence,
        readingLevel: scraped.readingLevel,
        readingScore: scraped.fleschKincaidScore,
        readingGrade: scraped.readingGrade,
        keywordDensity: scraped.keywordDensity || [],
        thinContentWarning: scraped.wordCount < 300,
        longSentences: scraped.longSentences || 0,
        shortSentences: scraped.shortSentences || 0,
        isRealData: true
      };
    }
    
    // Fallback to simulated data if real data not available
    const tech = websiteProfile.technicalSEO;
    if (!tech) return null;
    
    const hash = decodedDomain.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const wordCount = 300 + (hash % 1200);
    const sentenceCount = Math.round(wordCount / 15);
    const avgWordsPerSentence = wordCount / sentenceCount;
    const readingScore = Math.max(30, Math.min(80, 70 - (avgWordsPerSentence - 15) * 2));
    const readingLevel = readingScore >= 60 ? "Easy" : readingScore >= 40 ? "Standard" : "Difficult";
    
    return {
      wordCount,
      sentenceCount,
      paragraphCount: Math.round(sentenceCount / 4),
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      readingLevel,
      readingScore: Math.round(readingScore),
      readingGrade: readingScore >= 60 ? '6th-7th Grade' : readingScore >= 40 ? '8th-9th Grade' : 'College Level',
      keywordDensity: [],
      thinContentWarning: wordCount < 300,
      longSentences: 0,
      shortSentences: 0,
      isRealData: false
    };
  }, [websiteProfile, decodedDomain]);

  // Internal linking metrics - NOW USES REAL DATA FROM ENHANCED SCRAPING
  const internalLinkingMetrics = useMemo(() => {
    if (!websiteProfile?.technicalSEO) return null;
    const tech = websiteProfile.technicalSEO;
    
    // Use real internal linking metrics from enhanced scrape-website edge function
    const scraped = (websiteProfile as any).internalLinkingMetrics;
    if (scraped && (scraped.totalInternalLinks > 0 || scraped.totalExternalLinks > 0)) {
      return {
        totalInternalLinks: scraped.totalInternalLinks,
        totalExternalLinks: scraped.totalExternalLinks,
        uniqueInternalLinks: scraped.uniqueInternalLinks,
        uniqueExternalLinks: scraped.uniqueExternalLinks,
        brokenLinks: scraped.brokenLinkCandidates?.length || 0,
        orphanPages: scraped.orphanRisk ? 1 : 0,
        avgLinkDepth: scraped.maxLinkDepth || 1,
        anchorTextDistribution: scraped.anchorTextDistribution || [],
        linkEquityScore: Math.min(100, Math.max(30, 50 + (scraped.uniqueInternalLinks * 3) - (scraped.brokenLinkCandidates?.length || 0) * 10)),
        hasNavigationLinks: scraped.hasNavigationLinks,
        hasFooterLinks: scraped.hasFooterLinks,
        linksPerSection: scraped.linksPerSection,
        isRealData: true
      };
    }
    
    // Fallback to data from basic technicalSEO if enhanced data not available
    const hash = decodedDomain.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    return {
      totalInternalLinks: tech.internalLinks,
      totalExternalLinks: tech.externalLinks,
      uniqueInternalLinks: Math.round(tech.internalLinks * 0.7),
      uniqueExternalLinks: Math.round(tech.externalLinks * 0.8),
      brokenLinks: 0,
      orphanPages: 0,
      avgLinkDepth: 1.5 + (hash % 30) / 10,
      anchorTextDistribution: [
        { text: "Home", count: 2 + (hash % 3) },
        { text: "About", count: 1 + (hash % 2) },
        { text: "Services", count: 1 + (hash % 3) },
        { text: "Contact", count: 1 + (hash % 2) },
      ].filter(a => a.count > 0),
      linkEquityScore: Math.min(100, Math.max(30, 60 + (tech.internalLinks * 2) - (tech.externalLinks))),
      hasNavigationLinks: true,
      hasFooterLinks: true,
      linksPerSection: tech.internalLinks / 5,
      isRealData: false
    };
  }, [websiteProfile, decodedDomain]);

  const coreWebVitalsMetrics = useMemo(() => {
    // Use real PageSpeed data if available
    if (pageSpeedMetrics) {
      return pageSpeedMetrics;
    }
    
    // Fallback to simulated data
    const hash = decodedDomain.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const getRating = (value: number, good: number, poor: number): "good" | "needs-improvement" | "poor" => {
      if (value <= good) return "good";
      if (value <= poor) return "needs-improvement";
      return "poor";
    };
    
    const lcp = 1.5 + (hash % 30) / 10;
    const fid = 50 + (hash % 150);
    const cls = (hash % 20) / 100;
    const inp = 100 + (hash % 200);
    const ttfb = 200 + (hash % 600);
    const fcp = 0.8 + (hash % 20) / 10;
    
    const mobileScore = Math.max(30, 90 - Math.round((lcp - 2.5) * 10) - Math.round(cls * 100) - Math.round((fid - 100) / 10));
    const desktopScore = Math.min(100, mobileScore + 15);
    
    return {
      lcp: { value: lcp, rating: getRating(lcp, 2.5, 4), element: "img.hero-image" },
      fid: { value: fid, rating: getRating(fid, 100, 300) },
      cls: { value: cls, rating: getRating(cls, 0.1, 0.25), element: cls > 0.1 ? "div.ad-container" : undefined },
      inp: { value: inp, rating: getRating(inp, 200, 500) },
      ttfb: { value: ttfb, rating: getRating(ttfb, 800, 1800) },
      fcp: { value: fcp, rating: getRating(fcp, 1.8, 3) },
      mobile: { score: mobileScore, lcp: lcp + 0.5, cls: cls + 0.02, fid: fid + 20 },
      desktop: { score: desktopScore, lcp, cls, fid },
      recommendations: [
        lcp > 2.5 ? "Optimize largest image above the fold with lazy loading" : null,
        cls > 0.1 ? "Reserve space for dynamic content to prevent layout shifts" : null,
        fid > 100 ? "Reduce JavaScript execution time on main thread" : null,
        ttfb > 800 ? "Improve server response time with caching" : null,
        fcp > 1.8 ? "Eliminate render-blocking resources" : null,
      ].filter(Boolean) as string[]
    };
  }, [decodedDomain, pageSpeedMetrics]);

  const competitorGapMetrics = useMemo(() => {
    if (!dashboardMetrics) return null;
    const hash = decodedDomain.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Generate simulated competitor data
    const competitors = [
      { domain: `competitor1-${hash % 100}.com`, domainRating: dashboardMetrics.domainRating + 10 + (hash % 15), organicTraffic: dashboardMetrics.organicTraffic * (1.5 + (hash % 10) / 10), organicKeywords: dashboardMetrics.organicKeywords * 2, backlinks: dashboardMetrics.backlinks * 3 },
      { domain: `competitor2-${hash % 100}.com`, domainRating: dashboardMetrics.domainRating + 5 + (hash % 10), organicTraffic: dashboardMetrics.organicTraffic * (1.2 + (hash % 8) / 10), organicKeywords: dashboardMetrics.organicKeywords * 1.5, backlinks: dashboardMetrics.backlinks * 2 },
      { domain: `competitor3-${hash % 100}.com`, domainRating: dashboardMetrics.domainRating + (hash % 8), organicTraffic: dashboardMetrics.organicTraffic * (1 + (hash % 5) / 10), organicKeywords: dashboardMetrics.organicKeywords * 1.2, backlinks: dashboardMetrics.backlinks * 1.5 },
    ];
    
    const keywordGaps = [
      { keyword: `${websiteProfile?.detectedCategory || 'business'} services`, volume: 1200 + hash % 500, difficulty: 30 + hash % 30, competitorRank: 3, yourRank: null, opportunity: "high" as const },
      { keyword: `best ${websiteProfile?.detectedCategory || 'local'} near me`, volume: 800 + hash % 300, difficulty: 25 + hash % 20, competitorRank: 5, yourRank: null, opportunity: "high" as const },
      { keyword: `${decodedDomain.split('.')[0]} reviews`, volume: 400 + hash % 200, difficulty: 15 + hash % 15, competitorRank: 8, yourRank: 15 + hash % 10, opportunity: "medium" as const },
      { keyword: `affordable ${websiteProfile?.detectedCategory || 'services'}`, volume: 600 + hash % 250, difficulty: 35 + hash % 25, competitorRank: 4, yourRank: null, opportunity: "medium" as const },
    ];
    
    const serpFeatures = [
      { feature: "Featured Snippet", hasIt: hash % 10 === 0, competitorsHaveIt: 2 },
      { feature: "Local Pack", hasIt: websiteProfile?.detectedCategory === 'local_business', competitorsHaveIt: 3 },
      { feature: "FAQ Rich Result", hasIt: websiteProfile?.technicalSEO?.schemaTypes?.some(s => s.toLowerCase().includes('faq')) || false, competitorsHaveIt: 2 },
      { feature: "Review Stars", hasIt: websiteProfile?.technicalSEO?.schemaTypes?.some(s => s.toLowerCase().includes('review')) || false, competitorsHaveIt: 4 },
      { feature: "Sitelinks", hasIt: dashboardMetrics.domainRating >= 40, competitorsHaveIt: 3 },
    ];
    
    return {
      competitors,
      keywordGaps,
      serpFeatures,
      totalKeywordGap: 50 + hash % 100,
      trafficOpportunity: Math.round(dashboardMetrics.organicTraffic * 0.5 + 500)
    };
  }, [dashboardMetrics, websiteProfile, decodedDomain]);

  // Local SEO metrics - NOW USES REAL DATA FROM ENHANCED SCRAPING
  const localSEOMetrics = useMemo(() => {
    // Also show for healthcare (dentist, etc.) since that category often has local signals
    const isLocalBusiness = websiteProfile?.detectedCategory === 'local_business' || 
                            websiteProfile?.detectedCategory === 'healthcare' ||
                            websiteProfile?.detectedCategory === 'hospitality' ||
                            websiteProfile?.detectedCategory === 'real_estate';
    
    if (!websiteProfile || !isLocalBusiness) return null;
    
    // Use real local SEO signals from enhanced scrape-website edge function
    const scraped = (websiteProfile as any).localSEOSignals;
    const tech = websiteProfile.technicalSEO;
    
    if (scraped) {
      // Extract local keywords from text
      const text = `${websiteProfile.title || ''} ${websiteProfile.description || ''} ${websiteProfile.summary || ''}`.toLowerCase();
      const localKeywords: string[] = [];
      const cityPatterns = ['near', 'local', 'area', 'city', 'town', 'region', 'dental', 'dentist', 'clinic'];
      cityPatterns.forEach(p => { if (text.includes(p)) localKeywords.push(p); });
      
      const overallScore = Math.round(
        (scraped.hasLocalSchema ? 20 : 0) +
        (scraped.hasPhone ? 15 : 0) +
        (scraped.hasAddress ? 15 : 0) +
        (scraped.hasGoogleMapsEmbed ? 15 : 0) +
        (scraped.hasBusinessHours ? 10 : 0) +
        (scraped.hasReviewsSection ? 10 : 0) +
        (scraped.hasGMBLink ? 10 : 0) +
        (localKeywords.length > 0 ? 5 : 0)
      );
      
      return {
        hasLocalSchema: scraped.hasLocalSchema,
        localSchemaType: scraped.localSchemaType,
        hasNAP: scraped.hasPhone || scraped.hasAddress,
        napConsistent: scraped.napConsistent,
        hasGoogleMapsEmbed: scraped.hasGoogleMapsEmbed,
        hasLocalKeywords: localKeywords.length > 0,
        localKeywords,
        hasBusinessHours: scraped.hasBusinessHours,
        hoursText: scraped.hoursText,
        hasReviews: scraped.hasReviewsSection,
        estimatedReviewCount: scraped.hasReviewsSection ? 15 : 0,
        hasServiceArea: scraped.hasServiceArea,
        serviceAreaText: scraped.serviceAreaText,
        citationScore: Math.round(overallScore * 1.2),
        gmbSignals: {
          hasGMBLink: scraped.hasGMBLink,
          gmbUrl: scraped.gmbUrl
        },
        overallScore,
        isRealData: true
      };
    }
    
    // Fallback to basic analysis
    const hash = decodedDomain.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const hasLocalSchema = tech?.schemaTypes?.some(s => 
      s.toLowerCase().includes('localbusiness') || s.toLowerCase().includes('organization') || s.toLowerCase().includes('dentist')
    ) || false;
    
    const hasNAP = !!(websiteProfile.contactInfo?.phone || websiteProfile.contactInfo?.email);
    
    const text = `${websiteProfile.title || ''} ${websiteProfile.description || ''} ${websiteProfile.summary || ''}`.toLowerCase();
    const localKeywords: string[] = [];
    const cityPatterns = ['near', 'local', 'area', 'city', 'town', 'region'];
    cityPatterns.forEach(p => { if (text.includes(p)) localKeywords.push(p); });
    
    const overallScore = Math.round(
      (hasLocalSchema ? 20 : 0) +
      (hasNAP ? 20 : 0) +
      (websiteProfile.contactInfo?.address ? 15 : 0) +
      (localKeywords.length > 0 ? 10 : 0)
    );
    
    return {
      hasLocalSchema,
      localSchemaType: null,
      hasNAP,
      napConsistent: hasNAP,
      hasGoogleMapsEmbed: false,
      hasLocalKeywords: localKeywords.length > 0,
      localKeywords,
      hasBusinessHours: false,
      hoursText: null,
      hasReviews: false,
      estimatedReviewCount: 0,
      hasServiceArea: false,
      serviceAreaText: null,
      citationScore: 40 + hash % 40,
      gmbSignals: {
        hasGMBLink: false,
        gmbUrl: null
      },
      overallScore,
      isRealData: false
    };
  }, [websiteProfile, decodedDomain]);
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

  // Fetch website profile - for case studies, also load saved data from DB
  // OPTIMIZED: Run DB query and scrape in parallel for faster loading
  useEffect(() => {
    if (!decodedDomain) return;
    
    // Reset profile when domain changes
    setWebsiteProfile(null);
    
    const fetchWebsiteProfile = async () => {
      setIsProfileLoading(true);
      try {
        const slug = decodedDomain.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        
        // For case studies, run both queries in parallel for speed
        if (isCaseStudyMode) {
          // Start both fetches simultaneously
          const [savedAuditResult, scrapeResult] = await Promise.all([
            supabase
              .from('saved_audits')
              .select('*')
              .eq('slug', slug)
              .maybeSingle(),
            supabase.functions.invoke('scrape-website', {
              body: { url: decodedDomain },
            }),
          ]);

          const savedAudit = savedAuditResult.data;
          const scrapeData = scrapeResult.data;
          const scrapeError = scrapeResult.error;

          // IMPORTANT: Case Study pages need enhanced scrape data (technicalSEO, contentMetrics,
          // internalLinkingMetrics, localSEOSignals) for the advanced sections to render.
          // So even if we have basic profile data in the DB, we still scrape and merge.
          if (savedAudit) {
            // Store the actual domain from the database for display
            setActualDomain(savedAudit.domain);
            
            type AuditCategoryEnum = Database["public"]["Enums"]["audit_category"];
            const auditCategoryValues: AuditCategoryEnum[] = [
              'ecommerce',
              'saas',
              'local_business',
              'blog_media',
              'professional_services',
              'healthcare',
              'finance',
              'education',
              'real_estate',
              'hospitality',
              'nonprofit',
              'technology',
              'other',
            ];
            const toAuditCategory = (value: unknown): AuditCategoryEnum => {
              if (typeof value !== 'string') return 'other';
              return (auditCategoryValues as readonly string[]).includes(value) ? (value as AuditCategoryEnum) : 'other';
            };

            const emptyTechnicalSEO: TechnicalSEO = {
              hasTitle: false,
              titleLength: 0,
              hasMetaDescription: false,
              descriptionLength: 0,
              hasCanonical: false,
              canonicalUrl: null,
              hasViewport: false,
              hasRobotsMeta: false,
              robotsContent: null,
              hasOgTitle: false,
              hasOgDescription: false,
              hasOgImage: false,
              hasOgUrl: false,
              hasTwitterCard: false,
              h1Count: 0,
              h1Text: [],
              h2Count: 0,
              h3Count: 0,
              hasProperHeadingHierarchy: false,
              totalImages: 0,
              imagesWithAlt: 0,
              imagesWithoutAlt: 0,
              altCoverage: 0,
              hasSchemaMarkup: false,
              schemaTypes: [],
              internalLinks: 0,
              externalLinks: 0,
              isHttps: true,
              hasSitemapLink: false,
              hasLangAttribute: false,
              langValue: null,
            };

            const baseProfileFromDb: WebsiteProfile = {
              title: savedAudit.site_title || null,
              description: savedAudit.site_description || null,
              summary: savedAudit.site_summary || null,
              favicon: savedAudit.favicon_url || null,
              logo: savedAudit.logo_url || null,
              socialLinks: {
                facebook: savedAudit.social_facebook || null,
                twitter: savedAudit.social_twitter || null,
                linkedin: savedAudit.social_linkedin || null,
                instagram: savedAudit.social_instagram || null,
                youtube: savedAudit.social_youtube || null,
                tiktok: savedAudit.social_tiktok || null,
              },
              contactInfo: {
                email: savedAudit.contact_email || null,
                phone: savedAudit.contact_phone || null,
                address: savedAudit.contact_address || null,
              },
              detectedCategory: savedAudit.category || 'other',
              // Enables simulated fallbacks if scrape fails
              technicalSEO: emptyTechnicalSEO,
            };

            // Use the parallel scrape result instead of fetching again
            if (!scrapeError && scrapeData?.profile) {
              const scrapedProfile = scrapeData.profile as WebsiteProfile & Record<string, unknown>;

              const mergedProfile: WebsiteProfile & Record<string, unknown> = {
                ...scrapedProfile,
                // Prefer DB fields for “About This Website” so it always matches the selected domain record
                title: baseProfileFromDb.title || scrapedProfile.title || null,
                description: baseProfileFromDb.description || scrapedProfile.description || null,
                summary: baseProfileFromDb.summary || scrapedProfile.summary || null,
                favicon: baseProfileFromDb.favicon || scrapedProfile.favicon || null,
                logo: baseProfileFromDb.logo || scrapedProfile.logo || null,
                detectedCategory: baseProfileFromDb.detectedCategory || scrapedProfile.detectedCategory || 'other',
                socialLinks: {
                  facebook: baseProfileFromDb.socialLinks?.facebook ?? scrapedProfile.socialLinks?.facebook ?? null,
                  twitter: baseProfileFromDb.socialLinks?.twitter ?? scrapedProfile.socialLinks?.twitter ?? null,
                  linkedin: baseProfileFromDb.socialLinks?.linkedin ?? scrapedProfile.socialLinks?.linkedin ?? null,
                  instagram: baseProfileFromDb.socialLinks?.instagram ?? scrapedProfile.socialLinks?.instagram ?? null,
                  youtube: baseProfileFromDb.socialLinks?.youtube ?? scrapedProfile.socialLinks?.youtube ?? null,
                  tiktok: baseProfileFromDb.socialLinks?.tiktok ?? scrapedProfile.socialLinks?.tiktok ?? null,
                },
                contactInfo: {
                  email: baseProfileFromDb.contactInfo?.email ?? scrapedProfile.contactInfo?.email ?? null,
                  phone: baseProfileFromDb.contactInfo?.phone ?? scrapedProfile.contactInfo?.phone ?? null,
                  address: baseProfileFromDb.contactInfo?.address ?? scrapedProfile.contactInfo?.address ?? null,
                },
              };

              setWebsiteProfile(mergedProfile);

              // If the DB record lacks profile fields, backfill them for future loads
              const missingDbProfile = !(savedAudit.site_title || savedAudit.site_description || savedAudit.site_summary);
              // Backfill DB in background - fire and forget (don't block UI)
              if (missingDbProfile) {
                supabase
                  .from('saved_audits')
                  .update({
                    site_title: mergedProfile.title,
                    site_description: mergedProfile.description,
                    site_summary: mergedProfile.summary,
                    favicon_url: mergedProfile.favicon,
                    logo_url: mergedProfile.logo,
                    social_facebook: mergedProfile.socialLinks?.facebook,
                    social_twitter: mergedProfile.socialLinks?.twitter,
                    social_linkedin: mergedProfile.socialLinks?.linkedin,
                    social_instagram: mergedProfile.socialLinks?.instagram,
                    social_youtube: mergedProfile.socialLinks?.youtube,
                    social_tiktok: mergedProfile.socialLinks?.tiktok,
                    contact_email: mergedProfile.contactInfo?.email,
                    contact_phone: mergedProfile.contactInfo?.phone,
                    contact_address: mergedProfile.contactInfo?.address,
                    category: toAuditCategory(mergedProfile.detectedCategory),
                  })
                  .eq('slug', slug);
              }

              return;
            }

            // Scrape failed — fall back to DB-only profile
            if (savedAudit.site_title || savedAudit.site_description || savedAudit.site_summary) {
              setWebsiteProfile(baseProfileFromDb);
              return;
            }
          }
          
          // No saved audit found but scrape succeeded - use scrape data
          if (!scrapeError && scrapeData?.profile) {
            setWebsiteProfile(scrapeData.profile);
            return;
          }
        }
        
        // Fall back to live scraping for regular audits or when case study lookup fails
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
  }, [decodedDomain, isCaseStudyMode]);

  // Fetch PageSpeed Insights data (real Core Web Vitals) - with client-side caching
  useEffect(() => {
    if (!decodedDomain) return;
    
    const CACHE_KEY = `pagespeed_cache_${decodedDomain.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const CACHE_DURATION_MS = 28 * 24 * 60 * 60 * 1000; // 28 days
    
    const fetchPageSpeedData = async () => {
      // Check client-side cache first
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          if (age < CACHE_DURATION_MS && cachedData?.metrics) {
            console.log('[PageSpeed] Using cached data (age:', Math.round(age / 1000 / 60), 'min)');
            setPageSpeedMetrics(cachedData.metrics);
            setIsPageSpeedLoading(false);
            return;
          }
        }
      } catch {
        // Ignore cache read errors
      }
      
      setIsPageSpeedLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('pagespeed-insights', {
          body: { url: decodedDomain },
        });
        
        if (error) {
          console.error('PageSpeed Insights error:', error);
          return;
        }
        
        if (data?.metrics) {
          setPageSpeedMetrics(data.metrics);
          console.log('PageSpeed Insights data loaded:', data.metrics);
          
          // Cache the result
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
          } catch {
            // Ignore cache write errors (e.g., quota exceeded)
          }
        } else if (data?.error) {
          console.warn('PageSpeed API issue:', data.error);
        }
      } catch (err) {
        console.error('PageSpeed fetch error:', err);
      } finally {
        setIsPageSpeedLoading(false);
      }
    };
    
    fetchPageSpeedData();
  }, [decodedDomain]);
  useEffect(() => {
    if (!websiteProfile?.technicalSEO || !decodedDomain || isLoading) return;
    
    // Re-generate audit results with real technical SEO data
    const ahrefsData = dashboardMetrics?.isReal ? {
      domainRating: dashboardMetrics.domainRating,
      backlinks: dashboardMetrics.backlinks,
      referringDomains: dashboardMetrics.referringDomains,
      organicTraffic: dashboardMetrics.organicTraffic,
      organicKeywords: dashboardMetrics.organicKeywords,
    } : null;
    
    setAuditResults(generateAuditResults(decodedDomain, ahrefsData, websiteProfile.technicalSEO));
    console.log('Updated audit results with real technical SEO data');
  }, [websiteProfile?.technicalSEO, decodedDomain, dashboardMetrics, isLoading]);

  // Report height to parent iframe for dynamic sizing
  useEffect(() => {
    if (!isEmbedMode) return;
    
    const sendHeight = () => {
      // Get actual content height more accurately
      const body = document.body;
      const html = document.documentElement;
      const height = Math.max(
        body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight
      );
      window.parent.postMessage({ type: 'iframe-height', height }, '*');
    };
    
    // Send height multiple times as content loads
    const timers = [
      setTimeout(sendHeight, 300),
      setTimeout(sendHeight, 800),
      setTimeout(sendHeight, 1500),
      setTimeout(sendHeight, 3000),
    ];
    
    // Re-send on resize or content changes
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(sendHeight, 50);
    });
    resizeObserver.observe(document.body);
    
    // Mutation observer for dynamic content
    const mutationObserver = new MutationObserver(() => {
      setTimeout(sendHeight, 100);
    });
    mutationObserver.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true 
    });
    
    return () => {
      timers.forEach(clearTimeout);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [isEmbedMode, isLoading, isProfileLoading, dashboardMetrics, websiteProfile]);

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

  // Fetch all case studies for the selector (only in case study mode)
  useEffect(() => {
    if (!isCaseStudyMode) return;
    
    const fetchAllCaseStudies = async () => {
      try {
        const { data, error } = await supabase
          .from('saved_audits')
          .select('slug, domain, favicon_url')
          .order('domain', { ascending: true });
        
        if (error) {
          console.error('Error fetching case studies:', error);
          return;
        }
        
        if (data) {
          setAllCaseStudies(data);
        }
      } catch (err) {
        console.error('Case studies fetch error:', err);
      }
    };
    
    fetchAllCaseStudies();
  }, [isCaseStudyMode]);

  // Fetch baseline metrics from first audit history snapshot
  useEffect(() => {
    if (!decodedDomain) return;
    
    const fetchBaseline = async () => {
      try {
        // Get the earliest audit history record for this domain
        const { data, error } = await supabase
          .from('audit_history')
          .select('*')
          .eq('domain', decodedDomain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0])
          .order('snapshot_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching baseline:', error);
          return;
        }
        
        if (data) {
          setBaselineMetrics({
            domainRating: data.domain_rating || 0,
            organicTraffic: Number(data.organic_traffic) || 0,
            organicKeywords: Number(data.organic_keywords) || 0,
            backlinks: Number(data.backlinks) || 0,
            referringDomains: Number(data.referring_domains) || 0,
            trafficValue: Number(data.traffic_value) || 0,
            snapshotDate: data.snapshot_at,
          });
        }
      } catch (err) {
        console.error('Baseline fetch error:', err);
      }
    };
    
    fetchBaseline();
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
          setAuditResults(generateAuditResults(decodedDomain, null, null));
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
          
          setAuditResults(generateAuditResults(decodedDomain, ahrefsData, null));
        }
      } catch (err) {
        console.error('Audit fetch error:', err);
        setAuditResults(generateAuditResults(decodedDomain, null, null));
        toast.error('Error fetching audit data');
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch immediately - no artificial delay for performance
    fetchAuditData();
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
          title={`Analyzing ${displayDomain} | Free Domain Audit`}
          description={`Running comprehensive domain audit for ${displayDomain}`}
          noIndex
        />
        {!isEmbedMode && <Navbar />}
        <main className={isEmbedMode ? "py-8" : "pt-24 pb-16"}>
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
              <h1 className="text-2xl font-bold mb-2">Analyzing {displayDomain}</h1>
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
        title={`Domain Audit Results for ${displayDomain} | Webstack.ceo`}
        description={`Comprehensive domain audit results for ${displayDomain}. Check page speed, backlinks, schema markup, meta tags, and security analysis.`}
        noIndex
      />
      {!isEmbedMode && <Navbar />}
      
      {/* Case Study Selector Bar - only in case study mode */}
      {!isEmbedMode && isCaseStudyMode && allCaseStudies.length > 0 && (
        <div className="sticky top-16 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <Select
                  value={decodedDomain.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}
                  onValueChange={(slug) => navigate(`/case-study/${slug}`)}
                >
                  <SelectTrigger className="w-[220px] h-8 text-sm bg-background border-border">
                    <SelectValue placeholder="Select case study" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50 max-h-[300px]">
                    {allCaseStudies.map((cs) => (
                      <SelectItem key={cs.slug} value={cs.slug} className="text-sm">
                        <div className="flex items-center gap-2">
                          {cs.favicon_url && (
                            <img src={cs.favicon_url} alt="" className="w-4 h-4 rounded object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          )}
                          <span className="truncate max-w-[180px]">{cs.domain}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-px h-5 bg-border" />
              <span className="text-xs text-muted-foreground">
                {allCaseStudies.length} case {allCaseStudies.length === 1 ? 'study' : 'studies'} available
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                <Link to="/case-studies">
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                  View All
                </Link>
              </Button>
              <Button size="sm" className="h-8 text-xs gap-1.5" asChild>
                <a href="/pricing">
                  <Sparkles className="w-3.5 h-3.5" />
                  Get Started
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <main className={isEmbedMode ? "py-2 px-4" : cn("pb-16", isCaseStudyMode ? "pt-20" : "pt-8")}>
        <div className={isEmbedMode ? "w-full" : "max-w-6xl mx-auto px-6"}>
          {/* Back Button - hide in embed mode */}
          {!isEmbedMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(isCaseStudyMode ? "/visitor-intelligence-dashboard" : "/")}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isCaseStudyMode ? "Visitor Intelligence" : "Back to Home"}
            </Button>
          )}

          {/* Combined Hero Section: Free Website Audit + Website Profile - High-Tech Design */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-10"
          >
            {/* Outer Glow Container */}
            <div className="relative group">
              {/* Animated gradient glow background */}
              <motion.div
                className="absolute -inset-[2px] rounded-[26px] opacity-60 group-hover:opacity-90 transition-opacity duration-500 blur-md"
                animate={{
                  background: [
                    "linear-gradient(0deg, rgba(34,211,238,0.4), rgba(139,92,246,0.4), rgba(251,191,36,0.3))",
                    "linear-gradient(90deg, rgba(139,92,246,0.4), rgba(251,191,36,0.3), rgba(34,211,238,0.4))",
                    "linear-gradient(180deg, rgba(251,191,36,0.3), rgba(34,211,238,0.4), rgba(139,92,246,0.4))",
                    "linear-gradient(270deg, rgba(34,211,238,0.4), rgba(139,92,246,0.4), rgba(251,191,36,0.3))",
                    "linear-gradient(360deg, rgba(34,211,238,0.4), rgba(139,92,246,0.4), rgba(251,191,36,0.3))",
                  ],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Main Card */}
              <div className="relative p-8 rounded-3xl bg-gradient-to-br from-card via-card/98 to-primary/5 border border-border/50 backdrop-blur-xl overflow-hidden">
                {/* Animated scanning line */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none"
                  animate={{ y: ["-100%", "200%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Grid pattern overlay */}
                <div 
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                  }}
                />
                
                {/* Corner accents */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/10 via-violet-500/5 to-transparent rounded-bl-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-cyan-500/10 via-primary/5 to-transparent rounded-tr-[80px] pointer-events-none" />
                
                {/* Floating particles */}
                <motion.div
                  className="absolute top-6 right-10 w-2 h-2 rounded-full bg-cyan-400/70"
                  animate={{ y: [0, -12, 0], opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute top-14 right-20 w-1.5 h-1.5 rounded-full bg-violet-400/70"
                  animate={{ y: [0, -10, 0], opacity: [0.4, 0.9, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
                />
                <motion.div
                  className="absolute top-10 right-32 w-1 h-1 rounded-full bg-amber-400/70"
                  animate={{ y: [0, -8, 0], opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
                />
                <motion.div
                  className="absolute bottom-10 right-14 w-1.5 h-1.5 rounded-full bg-primary/70"
                  animate={{ y: [0, -6, 0], x: [0, 3, 0], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2.8, repeat: Infinity, delay: 0.5 }}
                />

                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6 relative z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      {/* Logo with animated ring */}
                      <div className="relative">
                        <motion.div
                          className="absolute -inset-2 rounded-xl border border-primary/40"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        />
                        <motion.div
                          className="absolute -inset-1.5 rounded-lg border border-cyan-400/20"
                          animate={{ rotate: -360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        />
                        {websiteProfile?.favicon ? (
                          <img 
                            src={websiteProfile.favicon} 
                            alt="" 
                            className="w-14 h-14 rounded-xl object-contain bg-gradient-to-br from-muted to-muted/50 p-2 shadow-lg shadow-primary/10 border border-border/50"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 via-violet-500/15 to-cyan-500/10 flex items-center justify-center shadow-lg shadow-primary/10 border border-primary/20">
                            <Globe className="w-7 h-7 text-primary" />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        {/* Domain Name with badges */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {isSaved ? (
                            <motion.a 
                              href={`https://${displayDomain}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-3xl md:text-4xl font-bold hover:text-primary transition-colors flex items-center gap-2 group/link"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 }}
                            >
                              {displayDomain}
                              <ExternalLink className="w-5 h-5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                            </motion.a>
                          ) : (
                            <motion.h1 
                              className="text-3xl md:text-4xl font-bold"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 }}
                            >
                              {displayDomain}
                            </motion.h1>
                          )}
                          
                          {/* Badges */}
                          <div className="flex items-center gap-2">
                            {isCaseStudyMode && (
                              <motion.span 
                                className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 font-semibold flex items-center gap-1.5 border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                              >
                                <BarChart3 className="w-3.5 h-3.5" />
                                Case Study
                              </motion.span>
                            )}
                            {dashboardMetrics?.isReal && (
                              <motion.span 
                                className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 font-semibold flex items-center gap-1.5 border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.25 }}
                              >
                                <motion.span
                                  className="w-2 h-2 rounded-full bg-emerald-500"
                                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                />
                                Live Data
                              </motion.span>
                            )}
                          </div>
                        </div>
                        
                        {/* Subtitle */}
                        <motion.p 
                          className="text-sm text-muted-foreground mt-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          {isCaseStudyMode ? 'Monthly SEO Progress Tracking' : 'Free Website Audit Tool'}
                          {dashboardMetrics?.ahrefsRank > 0 && (
                            <span className="ml-2 text-xs px-2.5 py-1 rounded-lg bg-gradient-to-r from-muted to-muted/50 border border-border/50 font-medium">
                              Ahrefs Rank: <span className="text-primary">#{dashboardMetrics.ahrefsRank.toLocaleString()}</span>
                            </span>
                          )}
                        </motion.p>
                      </div>
                    </div>
                    
                    {/* Website Description */}
                    {(websiteProfile?.summary || websiteProfile?.description) && (
                      <motion.div 
                        className="flex items-start gap-3 mt-4 p-4 rounded-xl bg-gradient-to-r from-muted/30 to-transparent border-l-2 border-primary/50"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/10 shrink-0">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                          {websiteProfile.summary || websiteProfile.description}
                        </p>
                      </motion.div>
                    )}
                    
                    {/* Claimed Notification */}
                    {isClaimed && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 mt-4 w-fit shadow-lg shadow-green-500/10"
                      >
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 0.7, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                          className="text-green-500 shrink-0"
                        >
                          <ArrowRight className="w-3.5 h-3.5 rotate-[225deg]" />
                        </motion.div>
                        <Link2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                        <span className="text-xs font-medium text-green-400">
                          {justClaimed 
                            ? "Your do-follow link is now active! Click the domain to visit."
                            : "This website owner claimed their free do-follow link!"
                          }
                        </span>
                      </motion.div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <motion.div 
                    className="flex items-start gap-3 shrink-0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex flex-col items-end gap-3">
                      {/* Buttons Row */}
                      <div className="flex items-center gap-3">
                        {!isClaimed && !isCaseStudyMode && (
                          <Button 
                            variant="outline" 
                            className="gap-2 justify-center border-primary/30 hover:border-primary/60 hover:bg-primary/10" 
                            onClick={handleSaveClick}
                          >
                            <Gift className="w-4 h-4 text-primary" />
                            Save & Get Free Backlink
                          </Button>
                        )}
                        <Button className="gap-2 min-w-[140px] justify-center bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-lg shadow-primary/20" asChild>
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
                      {/* Timer Box - offset down and left */}
                      <div className="mt-20 -mr-24">
                        <NextReportCountdown />
                      </div>
                      {/* Trust Badges - under timer, same offset */}
                      <motion.div 
                        className="flex items-center gap-2 -mr-24"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <div className="flex flex-col items-center justify-center px-3 h-14 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 shadow-sm hover:scale-105 hover:shadow-cyan-500/30 hover:shadow-md transition-all duration-300 cursor-default">
                          <Users className="w-5 h-5 text-cyan-500" />
                          <span className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 mt-0.5 whitespace-nowrap">100+ Agencies</span>
                        </div>
                        <div className="flex flex-col items-center justify-center px-3 h-14 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-500/40 shadow-sm hover:scale-105 hover:shadow-amber-500/30 hover:shadow-md transition-all duration-300 cursor-default">
                          <Crown className="w-5 h-5 text-amber-500" />
                          <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 mt-0.5 whitespace-nowrap">1,000+ CEOs</span>
                        </div>
                        <div className="flex flex-col items-center justify-center px-3 h-14 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/40 shadow-sm hover:scale-105 hover:shadow-violet-500/30 hover:shadow-md transition-all duration-300 cursor-default">
                          <Bot className="w-5 h-5 text-violet-500 animate-[pulse_2s_ease-in-out_infinite]" />
                          <span className="text-[9px] font-bold text-violet-600 dark:text-violet-400 mt-0.5 whitespace-nowrap">Agentic AI</span>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>

                {/* Divider with animated gradient */}
                {websiteProfile && (Object.entries(websiteProfile.socialLinks || {}).some(([_, v]) => v) || websiteProfile.contactInfo?.email || websiteProfile.contactInfo?.phone) && (
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/30" />
                    </div>
                    <motion.div 
                      className="absolute inset-0 flex items-center"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                    </motion.div>
                  </div>
                )}

                {/* Social Links & Contact Row */}
                {websiteProfile && (Object.entries(websiteProfile.socialLinks || {}).some(([_, v]) => v) || websiteProfile.contactInfo?.email || websiteProfile.contactInfo?.phone) && (
                  <motion.div 
                    className="flex flex-wrap items-center gap-6 relative z-10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {/* Social Links */}
                    {Object.entries(websiteProfile.socialLinks || {}).some(([_, v]) => v) && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Social</span>
                        <div className="flex items-center gap-2">
                          {websiteProfile.socialLinks?.facebook && (
                            <motion.a 
                              href={websiteProfile.socialLinks.facebook} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 border border-border/50 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary"
                              whileHover={{ scale: 1.1, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            </motion.a>
                          )}
                          {websiteProfile.socialLinks?.twitter && (
                            <motion.a 
                              href={websiteProfile.socialLinks.twitter} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 border border-border/50 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary"
                              whileHover={{ scale: 1.1, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            </motion.a>
                          )}
                          {websiteProfile.socialLinks?.linkedin && (
                            <motion.a 
                              href={websiteProfile.socialLinks.linkedin} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 border border-border/50 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary"
                              whileHover={{ scale: 1.1, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                            </motion.a>
                          )}
                          {websiteProfile.socialLinks?.instagram && (
                            <motion.a 
                              href={websiteProfile.socialLinks.instagram} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 border border-border/50 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary"
                              whileHover={{ scale: 1.1, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                            </motion.a>
                          )}
                          {websiteProfile.socialLinks?.youtube && (
                            <motion.a 
                              href={websiteProfile.socialLinks.youtube} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 border border-border/50 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary"
                              whileHover={{ scale: 1.1, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                            </motion.a>
                          )}
                          {websiteProfile.socialLinks?.tiktok && (
                            <motion.a 
                              href={websiteProfile.socialLinks.tiktok} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 border border-border/50 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary"
                              whileHover={{ scale: 1.1, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                            </motion.a>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Contact Info */}
                    {websiteProfile.contactInfo?.email && (
                      <motion.a 
                        href={`mailto:${websiteProfile.contactInfo.email}`} 
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 hover:bg-primary/10 border border-border/50 hover:border-primary/30 transition-all text-sm text-muted-foreground hover:text-primary"
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Mail className="w-4 h-4" />
                        {websiteProfile.contactInfo.email}
                      </motion.a>
                    )}
                    {websiteProfile.contactInfo?.phone && (
                      <motion.a 
                        href={`tel:${websiteProfile.contactInfo.phone}`} 
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 hover:bg-primary/10 border border-border/50 hover:border-primary/30 transition-all text-sm text-muted-foreground hover:text-primary"
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Phone className="w-4 h-4" />
                        {websiteProfile.contactInfo.phone}
                      </motion.a>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Technical Health Overview - Moved above dials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
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
                      transition={{ delay: 0.1 + i * 0.05 }}
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
                          transition={{ duration: 0.8, delay: 0.15 + i * 0.05, ease: "easeOut" }}
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

          {/* Dashboard Metrics Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <div className="p-6 rounded-2xl bg-card border border-border/50">

              {/* Floating Export PDF Button - hide in embed mode */}
              {!isEmbedMode && (
                <FloatingExportPDF 
                  domain={displayDomain} 
                  onExport={() => {
                    generateAuditPDF({
                      domain: displayDomain,
                      overallScore,
                      dashboardMetrics,
                      auditResults,
                      historyData: historyData || undefined,
                    });
                  }}
                />
              )}

              {/* Progress Summary Banner - shows when there's historical data */}
              {baselineMetrics && dashboardMetrics && (
                <ProgressSummaryBanner
                  metrics={{
                    domainRating: { current: dashboardMetrics.domainRating, baseline: baselineMetrics.domainRating },
                    organicTraffic: { current: dashboardMetrics.organicTraffic, baseline: baselineMetrics.organicTraffic },
                    organicKeywords: { current: dashboardMetrics.organicKeywords, baseline: baselineMetrics.organicKeywords },
                    backlinks: { current: dashboardMetrics.backlinks, baseline: baselineMetrics.backlinks },
                    referringDomains: { current: dashboardMetrics.referringDomains, baseline: baselineMetrics.referringDomains },
                    trafficValue: { current: dashboardMetrics.trafficValue, baseline: baselineMetrics.trafficValue },
                  }}
                  baselineDate={baselineMetrics.snapshotDate}
                />
              )}

              {/* Main Dials Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-6">
                {dashboardMetrics && (
                  <>
                    <div className="flex flex-col items-center">
                      <ScoreDial
                        value={dashboardMetrics.domainRating}
                        max={100}
                        label="Domain Rating"
                        size="md"
                        color="violet"
                      />
                      {baselineMetrics && dashboardMetrics.domainRating !== baselineMetrics.domainRating && (
                        <div className="mt-2">
                          <ProgressIndicator
                            current={dashboardMetrics.domainRating}
                            baseline={baselineMetrics.domainRating}
                            showPercent={false}
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      <ScoreDial
                        value={dashboardMetrics.organicTraffic}
                        max={Math.max(dashboardMetrics.organicTraffic * 1.5, 1000)}
                        label="Organic Traffic"
                        size="md"
                        color="green"
                        showPercentage={false}
                        suffix="/mo"
                      />
                      {baselineMetrics && dashboardMetrics.organicTraffic !== baselineMetrics.organicTraffic && (
                        <div className="mt-2">
                          <ProgressIndicator
                            current={dashboardMetrics.organicTraffic}
                            baseline={baselineMetrics.organicTraffic}
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      <ScoreDial
                        value={dashboardMetrics.trafficValue}
                        max={Math.max(dashboardMetrics.trafficValue * 1.5, 100)}
                        label="Traffic Value"
                        size="md"
                        color="cyan"
                        showPercentage={false}
                        prefix="$"
                        showFullNumber={true}
                      />
                      {baselineMetrics && dashboardMetrics.trafficValue !== baselineMetrics.trafficValue && (
                        <div className="mt-2">
                          <ProgressIndicator
                            current={dashboardMetrics.trafficValue}
                            baseline={baselineMetrics.trafficValue}
                            format="currency"
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      <ScoreDial
                        value={dashboardMetrics.organicKeywords}
                        max={Math.max(dashboardMetrics.organicKeywords * 1.5, 100)}
                        label="Organic Keywords"
                        size="md"
                        color="amber"
                        showPercentage={false}
                      />
                      {baselineMetrics && dashboardMetrics.organicKeywords !== baselineMetrics.organicKeywords && (
                        <div className="mt-2">
                          <ProgressIndicator
                            current={dashboardMetrics.organicKeywords}
                            baseline={baselineMetrics.organicKeywords}
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      <ScoreDial
                        value={dashboardMetrics.backlinks}
                        max={Math.max(dashboardMetrics.backlinks * 1.2, 1000)}
                        label="Backlinks"
                        size="md"
                        color="primary"
                        showPercentage={false}
                      />
                      {baselineMetrics && dashboardMetrics.backlinks !== baselineMetrics.backlinks && (
                        <div className="mt-2">
                          <ProgressIndicator
                            current={dashboardMetrics.backlinks}
                            baseline={baselineMetrics.backlinks}
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      <ScoreDial
                        value={dashboardMetrics.referringDomains}
                        max={Math.max(dashboardMetrics.referringDomains * 1.3, 500)}
                        label="Referring Domains"
                        size="md"
                        color="green"
                        showPercentage={false}
                      />
                      {baselineMetrics && dashboardMetrics.referringDomains !== baselineMetrics.referringDomains && (
                        <div className="mt-2">
                          <ProgressIndicator
                            current={dashboardMetrics.referringDomains}
                            baseline={baselineMetrics.referringDomains}
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
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
                          chartLines.traffic ? 'bg-muted/40' : 'opacity-40'
                        }`}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: chartLines.traffic ? 'hsl(var(--chart-traffic))' : 'hsl(var(--muted))' }}
                        />
                        <span className="text-xs text-muted-foreground">Traffic</span>
                      </button>
                      <button
                        onClick={() => setChartLines(prev => ({ ...prev, keywords: !prev.keywords }))}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
                          chartLines.keywords ? 'bg-muted/40' : 'opacity-40'
                        }`}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: chartLines.keywords ? 'hsl(var(--chart-keywords))' : 'hsl(var(--muted))' }}
                        />
                        <span className="text-xs text-muted-foreground">Keywords</span>
                      </button>
                      <button
                        onClick={() => setChartLines(prev => ({ ...prev, dr: !prev.dr }))}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
                          chartLines.dr ? 'bg-muted/40' : 'opacity-40'
                        }`}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: chartLines.dr ? 'hsl(var(--chart-dr))' : 'hsl(var(--muted))' }}
                        />
                        <span className="text-xs text-muted-foreground">DR</span>
                      </button>
                      <button
                        onClick={() => setChartLines(prev => ({ ...prev, value: !prev.value }))}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
                          chartLines.value ? 'bg-muted/40' : 'opacity-40'
                        }`}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: chartLines.value ? 'hsl(var(--chart-value))' : 'hsl(var(--muted))' }}
                        />
                        <span className="text-xs text-muted-foreground">Value</span>
                      </button>
                    </div>
                  </div>

                  <div className="h-[280px] w-full">
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
                          yAxisId="traffic"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                          width={45}
                        />
                        <YAxis
                          yAxisId="dr"
                          orientation="right"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          domain={[0, 100]}
                          hide
                        />
                        <YAxis
                          yAxisId="value"
                          orientation="right"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tickFormatter={(value) => {
                            if (typeof value !== 'number') return value;
                            if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                            if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
                            return `$${value}`;
                          }}
                          width={60}
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
                            yAxisId="traffic"
                            type="monotone"
                            dataKey="organicTraffic"
                            name="Organic Traffic"
                            stroke="hsl(var(--chart-traffic))"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: "hsl(var(--chart-traffic))" }}
                          />
                        )}
                        {chartLines.keywords && (
                          <Line
                            yAxisId="traffic"
                            type="monotone"
                            dataKey="organicKeywords"
                            name="Organic Keywords"
                            stroke="hsl(var(--chart-keywords))"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: "hsl(var(--chart-keywords))" }}
                          />
                        )}
                        {chartLines.dr && (
                          <Line
                            yAxisId="dr"
                            type="monotone"
                            dataKey="domainRating"
                            name="Domain Rating"
                            stroke="hsl(var(--chart-dr))"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: "hsl(var(--chart-dr))" }}
                          />
                        )}
                        {chartLines.value && (
                          <Line
                            yAxisId="value"
                            type="monotone"
                            dataKey="trafficValue"
                            name="Traffic Value"
                            stroke="hsl(var(--chart-value))"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: "hsl(var(--chart-value))" }}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </motion.div>


          {/* Content & Readability + Internal Linking - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ContentReadabilitySection 
              metrics={contentMetrics} 
              isLoading={isProfileLoading} 
            />
            <InternalLinkingSection 
              metrics={internalLinkingMetrics} 
              isLoading={isProfileLoading} 
            />
          </div>

          {/* NEW: Core Web Vitals Deep Dive - Uses real PageSpeed Insights data */}
          <CoreWebVitalsSection 
            metrics={coreWebVitalsMetrics} 
            isLoading={isLoading || isPageSpeedLoading} 
          />

          {/* NEW: Competitor Gap Analysis */}
          <CompetitorGapSection 
            metrics={competitorGapMetrics}
            currentDomain={displayDomain}
            currentDR={dashboardMetrics?.domainRating || 0}
            currentTraffic={dashboardMetrics?.organicTraffic || 0}
            isLoading={!dashboardMetrics}
          />

          {/* NEW: Local SEO Score (auto-detect for local businesses) */}
          {localSEOMetrics && (
            <LocalSEOSection 
              metrics={localSEOMetrics}
              businessName={websiteProfile?.title || undefined}
              isLoading={isProfileLoading}
            />
          )}

          {/* SEO Health Scores - Expandable Category Details */}
          <AnimatePresence mode="wait">
            {Array.from(expandedCategories).map((categoryTitle) => {
              const category = auditResults.find(c => c.title === categoryTitle);
              if (!category) return null;
              
              return (
                <motion.div
                  key={categoryTitle}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8 overflow-hidden"
                >
                  <div className="p-6 rounded-2xl bg-card border border-border/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${category.score >= 80 ? 'bg-green-500/20' : category.score >= 60 ? 'bg-amber-500/20' : 'bg-red-500/20'}`}>
                          <category.icon className={`w-5 h-5 ${getScoreColor(category.score)}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{category.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {category.checks.filter(c => c.status === 'pass').length} of {category.checks.length} checks passed
                          </p>
                        </div>
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                        {category.score}/100
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {category.checks.map((check, i) => (
                        <motion.div
                          key={check.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                        >
                          {getStatusIcon(check.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{check.name}</span>
                              {check.value && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  check.status === 'pass' ? 'bg-green-500/20 text-green-400' :
                                  check.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {check.value}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{check.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCategory(categoryTitle)}
                      className="mt-4 w-full"
                    >
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Collapse
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>


          {/* Other Actionable Recommendations */}
          {recommendations.filter(r => !r.service).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mb-8"
            >
              <h2 className="text-lg font-bold mb-4">Additional Recommendations</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recommendations.filter(r => !r.service).map((rec, i) => (
                  <motion.div
                    key={rec.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="p-4 rounded-xl border bg-card border-border/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-lg shrink-0 ${
                        rec.priority === 'high' 
                          ? 'bg-red-500/20' 
                          : rec.priority === 'medium' 
                          ? 'bg-amber-500/20' 
                          : 'bg-green-500/20'
                      }`}>
                        <rec.icon className={`w-4 h-4 ${
                          rec.priority === 'high' 
                            ? 'text-red-400' 
                            : rec.priority === 'medium' 
                            ? 'text-amber-400' 
                            : 'text-green-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-sm">{rec.title}</h3>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            rec.priority === 'high' 
                              ? 'bg-red-500/20 text-red-400' 
                              : rec.priority === 'medium' 
                              ? 'bg-amber-500/20 text-amber-400' 
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{rec.description}</p>
                        <ul className="space-y-0.5">
                          {rec.actions.slice(0, 3).map((action, j) => (
                            <li key={j} className="flex items-center gap-1.5 text-xs">
                              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                              <span className="text-muted-foreground truncate">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Pricing Section - hide in Case Study mode */}
          {!isCaseStudyMode && (
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
          )}


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

      {!isEmbedMode && (
        <>
          <Footer />
          <BackToTop />
        </>
      )}
    </div>
  );
};

export default AuditResults;
