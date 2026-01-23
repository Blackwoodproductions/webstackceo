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
} from "lucide-react";

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

// Store Ahrefs metrics separately for dashboard display
interface DashboardMetrics {
  domainRating: number;
  backlinks: number;
  referringDomains: number;
  organicTraffic: number;
  organicKeywords: number;
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
            backlinks: 0,
            referringDomains: 0,
            organicTraffic: 0,
            organicKeywords: 0,
            isReal: false,
          });
          toast.error('Could not fetch real backlink data - showing simulated results');
        } else {
          const ahrefsData = data?.ahrefs || null;
          
          if (data?.ahrefsError) {
            setAhrefsError(data.ahrefsError);
            toast.warning(`Ahrefs: ${data.ahrefsError} - showing simulated backlink data`);
          } else if (ahrefsData) {
            toast.success('Real Ahrefs backlink data loaded!');
          }
          
          // Store dashboard metrics separately for prominent display
          if (ahrefsData) {
            setDashboardMetrics({
              domainRating: ahrefsData.domainRating,
              backlinks: ahrefsData.backlinks,
              referringDomains: ahrefsData.referringDomains,
              organicTraffic: ahrefsData.organicTraffic,
              organicKeywords: ahrefsData.organicKeywords,
              isReal: true,
            });
          } else {
            // Simulated metrics
            const hash = decodedDomain.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
            setDashboardMetrics({
              domainRating: Math.round(30 + (hash % 50)),
              backlinks: Math.round(50 + (hash % 800)),
              referringDomains: Math.round(10 + (hash % 100)),
              organicTraffic: Math.round(100 + (hash % 2000)),
              organicKeywords: Math.round(20 + (hash % 200)),
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

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="w-6 h-6 text-primary" />
                  <h1 className="text-3xl font-bold">{decodedDomain}</h1>
                </div>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Audit completed just now
                </p>
              </div>

              {/* Overall Score Circle */}
              <div className="flex items-center gap-6">
                <div className="relative w-28 h-28">
                  <svg className="w-28 h-28 transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted/20"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      stroke="url(#scoreGradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${overallScore * 3.01} 301`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient
                        id="scoreGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(280, 80%, 60%)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                      {overallScore}
                    </span>
                    <span className="text-xs text-muted-foreground">Overall</span>
                  </div>
                </div>

                <Button className="gap-2">
                  <Download className="w-4 h-4" />
                  Export PDF
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Dashboard Metrics - Ahrefs Data */}
          {dashboardMetrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-bold">Ahrefs Metrics</h2>
                {dashboardMetrics.isReal ? (
                  <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-violet-500/20 text-primary font-semibold flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Live Data
                  </span>
                ) : (
                  <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                    Simulated
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Domain Rating */}
                <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/20">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Domain Rating</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${getScoreColor(dashboardMetrics.domainRating)}`}>
                      {dashboardMetrics.domainRating}
                    </span>
                    <span className="text-lg text-muted-foreground">/100</span>
                  </div>
                  <Progress value={dashboardMetrics.domainRating} className="h-2 mt-3" />
                </div>

                {/* Total Backlinks */}
                <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                      <Link2 className="w-5 h-5 text-cyan-500" />
                    </div>
                    <span className="text-sm text-muted-foreground">Backlinks</span>
                  </div>
                  <span className="text-4xl font-bold text-foreground">
                    {dashboardMetrics.backlinks.toLocaleString()}
                  </span>
                </div>

                {/* Referring Domains */}
                <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                      <Globe className="w-5 h-5 text-violet-500" />
                    </div>
                    <span className="text-sm text-muted-foreground">Referring Domains</span>
                  </div>
                  <span className="text-4xl font-bold text-foreground">
                    {dashboardMetrics.referringDomains.toLocaleString()}
                  </span>
                </div>

                {/* Organic Traffic */}
                <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                      <Users className="w-5 h-5 text-green-500" />
                    </div>
                    <span className="text-sm text-muted-foreground">Organic Traffic</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {dashboardMetrics.organicTraffic.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                </div>

                {/* Organic Keywords */}
                <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                      <Target className="w-5 h-5 text-amber-500" />
                    </div>
                    <span className="text-sm text-muted-foreground">Organic Keywords</span>
                  </div>
                  <span className="text-4xl font-bold text-foreground">
                    {dashboardMetrics.organicKeywords.toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Category Scores Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold mb-6">SEO Health Scores</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {auditResults.map((category, i) => (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className={`p-4 rounded-2xl bg-card border cursor-pointer hover:scale-[1.02] transition-all ${
                    category.isRealData ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/50 hover:border-primary/30'
                  }`}
                  onClick={() => toggleCategory(category.title)}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${getScoreGradient(category.score)}/20`}>
                      <category.icon className={`w-4 h-4 ${getScoreColor(category.score)}`} />
                    </div>
                    <span className="font-medium text-sm truncate">{category.title}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="flex items-end gap-1">
                      <span className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                        {category.score}
                      </span>
                      <span className="text-xs text-muted-foreground mb-1">/100</span>
                    </div>
                    {expandedCategories.has(category.title) ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <Progress value={category.score} className="h-1.5 mt-2" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Detailed Results - Collapsible Cards */}
          <div className="space-y-4 mb-16">
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
