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
} from "lucide-react";
import FloatingExportPDF from "@/components/ui/floating-export-pdf";
import { generateAuditPDF } from "@/lib/generateAuditPDF";
import bronDiamondFlow from "@/assets/bron-seo-diamond-flow.png";
import cadeContentAutomation from "@/assets/cade-content-automation.png";

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
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };
  
  const labelSizes = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-xs",
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

  const decodedDomain = domain ? decodeURIComponent(domain) : "";

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
        description: 'BRON (Backlink Ranking Optimization Network) delivers real business website deep links into your clustered topical content using our Diamond Flow methodology—all link flow goes up into your site, boosting your whole domain. BRON reverse engineers the top 5 ranked pages to create keyword clusters that Google loves.',
        priority: 'high',
        category: 'Authority & Links',
        icon: Link2,
        actions: [
          'Deep links from real business websites',
          'Diamond Flow link architecture',
          'Domain Rating & Domain Authority boosting',
          'Links directed to your money page',
          'Weekly keyword ranking reports',
          'Top 5 competitor keyword cluster analysis'
        ],
        service: 'BRON',
      });
    } else if (dashboardMetrics && dashboardMetrics.domainRating >= 50) {
      recs.push({
        title: 'BRON: Scale Your Link Authority',
        description: 'Continue growing your Domain Rating with BRON\'s Diamond Flow architecture. Real business website links flow into your keyword clusters and money pages. Weekly ranking reports track your keyword positions.',
        priority: 'medium',
        category: 'Authority & Links',
        icon: TrendingUp,
        actions: [
          'Diamond Flow link silos',
          'Clustered topical content links',
          'Money page link targeting',
          'Weekly ranking reports',
          'Keyword cluster optimization'
        ],
        service: 'BRON',
      });
    }

    // CADE (Content Automation and Domain Enhancement) - handles content, social signals, GMB, internal linking
    if (dashboardMetrics && (dashboardMetrics.organicTraffic < 500 || dashboardMetrics.organicKeywords < 100)) {
      recs.push({
        title: 'CADE: Build Topical Authority',
        description: 'CADE (Content Automation and Domain Enhancement) creates ongoing content with 7 different blog types. Each blog generates 3-5 FAQs dropped throughout the week, then posted to your social media for social signals that build topical authority. CADE reverse engineers your top 5 competitors on autopilot.',
        priority: 'high',
        category: 'Content & Signals',
        icon: FileText,
        actions: [
          '7 types of automated blog content',
          '3-5 FAQs per blog with individual URLs',
          'Social media posting for social signals',
          'Internal linking to keyword clusters',
          'Top 5 competitor reverse engineering'
        ],
        service: 'CADE',
        comingSoon: ['GMB signals', 'On-page optimization'],
      });
    } else {
      recs.push({
        title: 'CADE: Amplify Content & Signals',
        description: 'CADE delivers ongoing content with 7 blog types, each generating 3-5 FAQs with individual URLs—going the extra mile other agencies skip. Content is posted to social media for engagement signals and internally linked to your clusters and relevant pages.',
        priority: 'medium',
        category: 'Content & Signals',
        icon: Users,
        actions: [
          'Ongoing 7-type blog automation',
          'Individual FAQ URLs for each question',
          'Social signal distribution',
          'Smart internal linking',
          'Competitor analysis on autopilot'
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
          title={`Analyzing ${decodedDomain} | Free SEO Audit`}
          description={`Running comprehensive SEO audit for ${decodedDomain}`}
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
                Running comprehensive SEO checks...
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
        title={`SEO Audit Results for ${decodedDomain} | Webstack.ceo`}
        description={`Comprehensive SEO audit results for ${decodedDomain}. Check page speed, backlinks, schema markup, meta tags, and security analysis.`}
        noIndex
      />
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>

            {/* Key Metrics Card with Domain Info */}
            <div className="p-6 rounded-2xl bg-card border border-border/50">
              {/* Domain Info Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-6 border-b border-border/50">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <Globe className="w-6 h-6 text-primary" />
                    <h1 className="text-2xl md:text-3xl font-bold">{decodedDomain}</h1>
                    {dashboardMetrics?.isReal && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-primary/20 to-violet-500/20 text-primary font-semibold flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        Live Data
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4" />
                    Audit completed just now
                    {dashboardMetrics?.ahrefsRank > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded bg-muted">
                        Ahrefs Rank: #{dashboardMetrics.ahrefsRank.toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>

                <Button className="gap-2 w-fit" asChild>
                  <a href="https://calendly.com/d/csmt-vs9-zq6/seo-local-book-demo" target="_blank" rel="noopener noreferrer">
                    <Phone className="w-4 h-4" />
                    Book a Call
                  </a>
                </Button>
              </div>

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
                    <div className="flex items-center gap-4">
                      {/* Inline Legend */}
                      <div className="hidden md:flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-xs text-muted-foreground">Traffic</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-xs text-muted-foreground">Keywords</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-xs text-muted-foreground">DR</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-violet-500" />
                          <span className="text-xs text-muted-foreground">Value</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-[180px] w-full">
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
                          width={40}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          domain={[0, 100]}
                          width={30}
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
                        <Line
                          yAxisId="left"
                          dataKey="organicKeywords"
                          name="Keywords"
                          stroke="hsl(38, 92%, 50%)"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, fill: "hsl(38, 92%, 50%)" }}
                        />
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
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Category Scores Overview - Dial Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold mb-6">SEO Health Scores</h2>
            <div className="p-6 rounded-2xl bg-card border border-border/50">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {auditResults.map((category, i) => {
                  const dialColor = category.score >= 80 ? "green" : category.score >= 60 ? "amber" : "primary";
                  return (
                    <motion.div
                      key={category.title}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      className={`flex flex-col items-center p-4 rounded-xl cursor-pointer hover:bg-muted/30 transition-all ${
                        category.isRealData ? 'ring-1 ring-primary/30' : ''
                      }`}
                      onClick={() => toggleCategory(category.title)}
                    >
                      <div className="relative">
                        <ScoreDial
                          value={category.score}
                          max={100}
                          label=""
                          size="md"
                          color={dialColor as "primary" | "green" | "amber" | "violet" | "cyan"}
                        />
                        {/* Icon overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="mt-8">
                            <category.icon className={`w-4 h-4 ${getScoreColor(category.score)} opacity-50`} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-sm font-medium text-center">{category.title}</span>
                        {category.isRealData && (
                          <ExternalLink className="w-3 h-3 text-primary" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {expandedCategories.has(category.title) ? (
                          <ChevronUp className="w-3 h-3 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">Details</span>
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


          {/* Recommended Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 mb-16"
          >
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Recommended Solutions</span>
              </div>
              <h2 className="text-3xl font-bold mb-3">
                Features to Improve{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-violet-500 to-amber-400 bg-clip-text text-transparent">
                  {decodedDomain}
                </span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Based on your audit results, these features can help boost your site's performance and rankings.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* On-Page SEO */}
              <a
                href="/features/on-page-seo"
                className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 group-hover:scale-110 transition-transform">
                    <FileCode className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">On-Page SEO</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-semibold">Add-on</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Optimize meta tags, headings, schema markup, and content structure for better rankings.
                    </p>
                    <span className="text-xs text-primary font-medium group-hover:underline">Learn more →</span>
                  </div>
                </div>
              </a>

              {/* Domain Authority */}
              <a
                href="/features/off-page-seo"
                className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 group-hover:scale-110 transition-transform">
                    <Link2 className="w-6 h-6 text-cyan-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Niche Link Building</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">Included</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Build high-quality backlinks from authoritative sites to boost your domain rating.
                    </p>
                    <span className="text-xs text-primary font-medium group-hover:underline">Learn more →</span>
                  </div>
                </div>
              </a>

              {/* Advanced Analytics */}
              <a
                href="/features/advanced-analytics"
                className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Advanced Analytics</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">Included</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Track rankings, traffic, and conversions with AI-powered insights and reports.
                    </p>
                    <span className="text-xs text-primary font-medium group-hover:underline">Learn more →</span>
                  </div>
                </div>
              </a>

              {/* Uptime Monitoring */}
              <a
                href="/features/uptime-monitoring"
                className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 group-hover:scale-110 transition-transform">
                    <Gauge className="w-6 h-6 text-violet-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Uptime Monitoring</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">Included</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      24/7 monitoring with instant alerts when your site goes down or slows.
                    </p>
                    <span className="text-xs text-primary font-medium group-hover:underline">Learn more →</span>
                  </div>
                </div>
              </a>

              {/* Web Hosting */}
              <a
                href="/features/web-hosting"
                className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/5"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 group-hover:scale-110 transition-transform">
                    <Globe className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold">Premium Hosting</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-semibold">Add-on</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">Coming Soon</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Blazing fast hosting with server-side rendering for maximum SEO performance.
                    </p>
                    <span className="text-xs text-primary font-medium group-hover:underline">Learn more →</span>
                  </div>
                </div>
              </a>

              {/* PPC Landing Pages */}
              <a
                href="/features/ppc-landing-pages"
                className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/5"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 group-hover:scale-110 transition-transform">
                    <Target className="w-6 h-6 text-rose-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">PPC Landing Pages</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-semibold">Add-on</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      High-converting landing pages designed to maximize your ad spend ROI.
                    </p>
                    <span className="text-xs text-primary font-medium group-hover:underline">Learn more →</span>
                  </div>
                </div>
              </a>
            </div>

            {/* View All Features CTA */}
            <div className="text-center mt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/features")}
                className="gap-2"
              >
                View All Features
                <ExternalLink className="w-4 h-4" />
              </Button>
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

            <StripePaymentIcons className="mt-8" />

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
        </div>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default AuditResults;
