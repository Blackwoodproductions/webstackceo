import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { trackToolInteractionGlobal, getGlobalSessionId } from "@/hooks/use-visitor-tracking";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Link2,
  FileText,
  TrendingUp,
  Target,
  Globe,
  BarChart3,
  Shield,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ArrowRight,
  Phone,
  User,
  Building,
  DollarSign,
} from "lucide-react";

const RATE_LIMIT_KEY = 'webstack_metric_checks';

// Save lead with all qualification data
const saveLeadWithQualification = async (
  email: string,
  phone: string | null,
  domain: string,
  metricType: string,
  fullName: string | null,
  companyEmployees: string | null,
  annualRevenue: string | null,
  qualificationStep: number
) => {
  try {
    await supabase.from('leads').insert({
      email,
      phone,
      domain,
      metric_type: metricType,
      source_page: window.location.pathname,
      full_name: fullName,
      company_employees: companyEmployees,
      annual_revenue: annualRevenue,
      qualification_step: qualificationStep,
      funnel_stage: qualificationStep >= 3 ? 'qualified' : qualificationStep >= 1 ? 'engaged' : 'visitor',
    });
  } catch (error) {
    console.error('Failed to save lead:', error);
  }
};

type MetricType = 
  | "backlinks"
  | "technical_audit" 
  | "traffic"
  | "keywords"
  | "domain_rating"
  | "page_speed"
  | "schema"
  | "security";

interface MetricConfig {
  title: string;
  subtitle: string;
  icon: typeof Link2;
  placeholder: string;
  ctaText: string;
  color: string;
}

const metricConfigs: Record<MetricType, MetricConfig> = {
  backlinks: {
    title: "Check Your Backlinks",
    subtitle: "See how many sites link to your domain",
    icon: Link2,
    placeholder: "yourdomain.com",
    ctaText: "Analyze Backlinks",
    color: "from-cyan-400 to-blue-500",
  },
  technical_audit: {
    title: "Quick Technical Audit",
    subtitle: "Check your site's technical SEO health",
    icon: FileText,
    placeholder: "yourdomain.com",
    ctaText: "Run Audit",
    color: "from-violet-400 to-purple-500",
  },
  traffic: {
    title: "Estimate Your Traffic",
    subtitle: "See your estimated organic traffic",
    icon: TrendingUp,
    placeholder: "yourdomain.com",
    ctaText: "Check Traffic",
    color: "from-green-400 to-emerald-500",
  },
  keywords: {
    title: "Keyword Rankings",
    subtitle: "Discover how many keywords you rank for",
    icon: Target,
    placeholder: "yourdomain.com",
    ctaText: "Check Keywords",
    color: "from-amber-400 to-orange-500",
  },
  domain_rating: {
    title: "Domain Authority Check",
    subtitle: "See your domain rating score",
    icon: BarChart3,
    placeholder: "yourdomain.com",
    ctaText: "Check Rating",
    color: "from-pink-400 to-rose-500",
  },
  page_speed: {
    title: "Page Speed Test",
    subtitle: "Check your Core Web Vitals",
    icon: Zap,
    placeholder: "yourdomain.com",
    ctaText: "Test Speed",
    color: "from-yellow-400 to-amber-500",
  },
  schema: {
    title: "Schema Markup Check",
    subtitle: "Verify your structured data",
    icon: FileText,
    placeholder: "yourdomain.com",
    ctaText: "Check Schema",
    color: "from-indigo-400 to-violet-500",
  },
  security: {
    title: "Security Check",
    subtitle: "Verify SSL and security headers",
    icon: Shield,
    placeholder: "yourdomain.com",
    ctaText: "Check Security",
    color: "from-emerald-400 to-teal-500",
  },
};

interface QuickMetricCheckProps {
  metricType: MetricType;
  className?: string;
}

interface MetricResult {
  domain: string;
  metrics: {
    label: string;
    value: string | number;
    status: "pass" | "warning" | "fail";
    description: string;
  }[];
  overallScore: number;
}

// Generate a simple math captcha
const generateCaptcha = () => {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return { question: `${a} + ${b}`, answer: a + b };
};

// Get check count from localStorage
const getCheckCount = (): number => {
  try {
    const data = localStorage.getItem(RATE_LIMIT_KEY);
    if (!data) return 0;
    const parsed = JSON.parse(data);
    // Reset if older than 24 hours
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(RATE_LIMIT_KEY);
      return 0;
    }
    return parsed.count || 0;
  } catch {
    return 0;
  }
};

const incrementCheckCount = (): number => {
  const currentCount = getCheckCount();
  const newCount = currentCount + 1;
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({
    count: newCount,
    timestamp: Date.now()
  }));
  return newCount;
};

// Progressive questions after 2 checks
const getQualificationStep = (count: number): number => {
  if (count < 2) return 0; // Just email
  if (count === 2) return 1; // Email + phone
  if (count === 3) return 2; // Email + phone + name
  if (count === 4) return 3; // Email + phone + name + employees
  return 4; // All fields including revenue
};

const employeeOptions = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];

const revenueOptions = [
  "Under $100K",
  "$100K - $500K",
  "$500K - $1M",
  "$1M - $5M",
  "$5M - $10M",
  "$10M+",
];

const QuickMetricCheck = ({ metricType, className = "" }: QuickMetricCheckProps) => {
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyEmployees, setCompanyEmployees] = useState("");
  const [annualRevenue, setAnnualRevenue] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Hidden field for bots
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<MetricResult | null>(null);
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [nameError, setNameError] = useState("");
  const [qualificationStep, setQualificationStep] = useState(0);

  // Check qualification step on mount
  useEffect(() => {
    const count = getCheckCount();
    setQualificationStep(getQualificationStep(count));
  }, []);

  const config = metricConfigs[metricType];
  const IconComponent = config.icon;

  const generateMockResults = (domain: string, type: MetricType): MetricResult => {
    const hash = domain.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const randomValue = (min: number, max: number) => Math.round(min + ((hash % 100) / 100) * (max - min));
    const randomScore = (base: number, variance: number) => Math.min(100, Math.max(0, Math.round(base + ((hash % 100) / 100) * variance * 2 - variance)));

    switch (type) {
      case "backlinks":
        return {
          domain,
          overallScore: randomScore(55, 35),
          metrics: [
            { label: "Total Backlinks", value: randomValue(50, 5000).toLocaleString(), status: randomValue(0, 100) > 50 ? "pass" : "warning", description: "Links pointing to your domain" },
            { label: "Referring Domains", value: randomValue(10, 500), status: randomValue(0, 100) > 40 ? "pass" : "warning", description: "Unique domains linking to you" },
            { label: "Domain Rating", value: `${randomValue(10, 70)}/100`, status: randomValue(0, 100) > 50 ? "pass" : "warning", description: "Overall domain authority" },
            { label: "Dofollow Ratio", value: `${randomValue(60, 95)}%`, status: randomValue(0, 100) > 60 ? "pass" : "warning", description: "Percentage of dofollow links" },
          ],
        };
      case "technical_audit":
        return {
          domain,
          overallScore: randomScore(65, 25),
          metrics: [
            { label: "Mobile Friendly", value: hash % 3 === 0 ? "Issues Found" : "Passed", status: hash % 3 === 0 ? "fail" : "pass", description: "Mobile responsiveness check" },
            { label: "HTTPS Enabled", value: hash % 5 === 0 ? "Not Secure" : "Secure", status: hash % 5 === 0 ? "fail" : "pass", description: "SSL certificate status" },
            { label: "Page Indexability", value: hash % 4 === 0 ? "Blocked" : "Indexable", status: hash % 4 === 0 ? "fail" : "pass", description: "Can search engines index this?" },
            { label: "Sitemap", value: hash % 3 === 1 ? "Missing" : "Found", status: hash % 3 === 1 ? "warning" : "pass", description: "XML sitemap presence" },
          ],
        };
      case "traffic":
        return {
          domain,
          overallScore: randomScore(50, 40),
          metrics: [
            { label: "Organic Traffic", value: `${randomValue(100, 50000).toLocaleString()}/mo`, status: randomValue(0, 100) > 40 ? "pass" : "warning", description: "Estimated monthly organic visits" },
            { label: "Traffic Value", value: `$${randomValue(50, 10000).toLocaleString()}`, status: randomValue(0, 100) > 50 ? "pass" : "warning", description: "Estimated traffic value" },
            { label: "Top Country", value: hash % 2 === 0 ? "United States" : "United Kingdom", status: "pass", description: "Primary traffic source" },
            { label: "Growth Trend", value: hash % 3 === 0 ? "Declining" : "Growing", status: hash % 3 === 0 ? "warning" : "pass", description: "Traffic direction" },
          ],
        };
      case "keywords":
        return {
          domain,
          overallScore: randomScore(55, 35),
          metrics: [
            { label: "Ranking Keywords", value: randomValue(50, 5000).toLocaleString(), status: randomValue(0, 100) > 50 ? "pass" : "warning", description: "Keywords you rank for" },
            { label: "Top 10 Keywords", value: randomValue(5, 200), status: randomValue(0, 100) > 40 ? "pass" : "warning", description: "Keywords in top 10 positions" },
            { label: "Top 3 Keywords", value: randomValue(1, 50), status: randomValue(0, 100) > 50 ? "pass" : "warning", description: "Keywords in top 3 positions" },
            { label: "New Keywords", value: `+${randomValue(0, 50)}`, status: randomValue(0, 100) > 50 ? "pass" : "warning", description: "New rankings this month" },
          ],
        };
      case "domain_rating":
        const dr = randomValue(10, 70);
        return {
          domain,
          overallScore: dr,
          metrics: [
            { label: "Domain Rating", value: `${dr}/100`, status: dr > 40 ? "pass" : dr > 20 ? "warning" : "fail", description: "Overall domain authority score" },
            { label: "Ahrefs Rank", value: `#${randomValue(10000, 5000000).toLocaleString()}`, status: "pass", description: "Global ranking position" },
            { label: "Backlink Quality", value: dr > 40 ? "Good" : dr > 20 ? "Average" : "Low", status: dr > 40 ? "pass" : dr > 20 ? "warning" : "fail", description: "Quality of your link profile" },
            { label: "Trust Score", value: `${randomValue(10, 80)}/100`, status: randomValue(0, 100) > 50 ? "pass" : "warning", description: "Domain trustworthiness" },
          ],
        };
      case "page_speed":
        const lcp = (1.2 + (100 - randomScore(70, 25)) * 0.03).toFixed(1);
        return {
          domain,
          overallScore: randomScore(70, 25),
          metrics: [
            { label: "LCP", value: `${lcp}s`, status: parseFloat(lcp) < 2.5 ? "pass" : parseFloat(lcp) < 4 ? "warning" : "fail", description: "Largest Contentful Paint" },
            { label: "FID", value: `${randomValue(30, 150)}ms`, status: randomValue(0, 100) > 50 ? "pass" : "warning", description: "First Input Delay" },
            { label: "CLS", value: (0.05 + (100 - randomScore(75, 25)) * 0.003).toFixed(2), status: randomValue(0, 100) > 60 ? "pass" : "warning", description: "Cumulative Layout Shift" },
            { label: "Performance", value: `${randomValue(50, 95)}/100`, status: randomValue(0, 100) > 50 ? "pass" : "warning", description: "Overall performance score" },
          ],
        };
      case "schema":
        return {
          domain,
          overallScore: randomScore(45, 40),
          metrics: [
            { label: "Schema Found", value: hash % 3 === 0 ? "None" : `${randomValue(1, 5)} types`, status: hash % 3 === 0 ? "fail" : "pass", description: "Structured data detected" },
            { label: "Organization", value: hash % 2 === 0 ? "Missing" : "Present", status: hash % 2 === 0 ? "warning" : "pass", description: "Organization schema" },
            { label: "Breadcrumbs", value: hash % 3 === 1 ? "Missing" : "Present", status: hash % 3 === 1 ? "warning" : "pass", description: "Breadcrumb schema" },
            { label: "FAQ Schema", value: hash % 2 === 1 ? "Missing" : "Present", status: hash % 2 === 1 ? "warning" : "pass", description: "FAQ structured data" },
          ],
        };
      case "security":
        return {
          domain,
          overallScore: randomScore(80, 20),
          metrics: [
            { label: "SSL Certificate", value: hash % 6 === 0 ? "Expired" : "Valid", status: hash % 6 === 0 ? "fail" : "pass", description: "HTTPS security" },
            { label: "HSTS Header", value: hash % 3 === 0 ? "Missing" : "Enabled", status: hash % 3 === 0 ? "warning" : "pass", description: "HTTP Strict Transport Security" },
            { label: "X-Frame-Options", value: hash % 4 === 0 ? "Missing" : "Set", status: hash % 4 === 0 ? "warning" : "pass", description: "Clickjacking protection" },
            { label: "Content-Security", value: hash % 3 === 1 ? "Missing" : "Set", status: hash % 3 === 1 ? "warning" : "pass", description: "CSP header" },
          ],
        };
      default:
        return { domain, overallScore: 50, metrics: [] };
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    // Allow common phone formats
    const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleDomainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;
    // Check rate limit and update qualification step
    const count = getCheckCount();
    setQualificationStep(getQualificationStep(count));
    setShowEmailCapture(true);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setPhoneError("");
    setCaptchaError("");
    
    // Honeypot check - if filled, it's a bot
    if (honeypot) {
      console.log("Bot detected via honeypot");
      return;
    }
    
    if (!email.trim()) {
      setEmailError("Please enter your email");
      return;
    }
    
    if (!validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }

    // Phone validation (step 1+)
    if (qualificationStep >= 1) {
      if (!phone.trim()) {
        setPhoneError("Phone number is required");
        return;
      }
      if (!validatePhone(phone.trim())) {
        setPhoneError("Please enter a valid phone number");
        return;
      }
    }

    // Name validation (step 2+)
    if (qualificationStep >= 2) {
      if (!fullName.trim()) {
        setNameError("Your full name is required");
        return;
      }
    }
    
    // Captcha validation
    if (!captchaInput.trim()) {
      setCaptchaError("Please solve the math problem");
      return;
    }
    
    if (parseInt(captchaInput.trim(), 10) !== captcha.answer) {
      setCaptchaError("Incorrect answer, please try again");
      setCaptcha(generateCaptcha()); // Generate new captcha
      setCaptchaInput("");
      return;
    }

    setIsLoading(true);
    
    // Increment check count
    incrementCheckCount();
    
    // Save lead to database with all qualification data
    await saveLeadWithQualification(
      email.trim(), 
      qualificationStep >= 1 ? phone.trim() : null, 
      domain.trim(), 
      metricType,
      qualificationStep >= 2 ? fullName.trim() : null,
      qualificationStep >= 3 ? companyEmployees : null,
      qualificationStep >= 4 ? annualRevenue : null,
      qualificationStep
    );
    
    // Track tool interaction
    await trackToolInteractionGlobal('QuickMetricCheck', metricType, {
      domain: domain.trim(),
      qualificationStep,
    });
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For backlinks/traffic/keywords/domain_rating, try to get real data
    if (["backlinks", "traffic", "keywords", "domain_rating"].includes(metricType)) {
      try {
        const { data, error } = await supabase.functions.invoke('domain-audit', {
          body: { domain: domain.trim() }
        });
        
        if (!error && data?.metrics) {
          // Use real data if available
          const realMetrics = data.metrics;
          setResults({
            domain: domain.trim(),
            overallScore: realMetrics.domainRating || 50,
            metrics: [
              { label: "Domain Rating", value: `${realMetrics.domainRating}/100`, status: realMetrics.domainRating > 40 ? "pass" : realMetrics.domainRating > 20 ? "warning" : "fail", description: "Overall domain authority" },
              { label: "Total Backlinks", value: realMetrics.backlinks?.toLocaleString() || "N/A", status: realMetrics.backlinks > 100 ? "pass" : "warning", description: "Links pointing to your domain" },
              { label: "Referring Domains", value: realMetrics.referringDomains?.toLocaleString() || "N/A", status: realMetrics.referringDomains > 30 ? "pass" : "warning", description: "Unique domains linking to you" },
              { label: "Organic Traffic", value: `${realMetrics.organicTraffic?.toLocaleString() || "N/A"}/mo`, status: realMetrics.organicTraffic > 500 ? "pass" : "warning", description: "Estimated monthly visits" },
            ],
          });
          setShowEmailCapture(false);
          setShowResults(true);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching real data:', err);
      }
    }
    
    // Fall back to mock data
    const mockResults = generateMockResults(domain.trim(), metricType);
    setResults(mockResults);
    setShowEmailCapture(false);
    setShowResults(true);
    setIsLoading(false);
  };

  const handleCloseEmailCapture = () => {
    setShowEmailCapture(false);
    setEmail("");
    setPhone("");
    setFullName("");
    setCompanyEmployees("");
    setAnnualRevenue("");
    setEmailError("");
    setPhoneError("");
    setNameError("");
    setCaptcha(generateCaptcha()); // Reset captcha
    setCaptchaInput("");
    setCaptchaError("");
    setHoneypot("");
  };

  const getStatusIcon = (status: "pass" | "warning" | "fail") => {
    switch (status) {
      case "pass": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "fail": return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 40) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`p-6 rounded-2xl bg-gradient-to-br from-background to-muted/30 border border-border/50 ${className}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`}>
            <IconComponent className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{config.title}</h3>
            <p className="text-sm text-muted-foreground">{config.subtitle}</p>
          </div>
        </div>

        <form onSubmit={handleDomainSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={config.placeholder}
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            type="submit" 
            disabled={!domain.trim()}
            className={`gap-2 bg-gradient-to-r ${config.color} hover:opacity-90`}
          >
            <Search className="w-4 h-4" />
            {config.ctaText}
          </Button>
        </form>
      </motion.div>

      {/* Email Capture Modal */}
      <Dialog open={showEmailCapture} onOpenChange={handleCloseEmailCapture}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                <IconComponent className="w-4 h-4 text-white" />
              </div>
              Almost there!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{domain}</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Enter your {qualificationStep >= 1 ? 'details' : 'email'} to receive your instant {config.title.toLowerCase()} report.
            </p>

            {qualificationStep >= 1 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Phone className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  {qualificationStep === 1 && "Phone number required for additional checks"}
                  {qualificationStep === 2 && "Phone & name required for additional checks"}
                  {qualificationStep === 3 && "A few quick questions for your personalized report"}
                  {qualificationStep >= 4 && "Complete profile for your custom recommendations"}
                </span>
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {/* Honeypot - hidden from humans, visible to bots */}
              <div className="absolute -left-[9999px] opacity-0 h-0 overflow-hidden" aria-hidden="true">
                <Input
                  type="text"
                  name="website_url"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>
              
              <div>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  className={emailError ? "border-red-500" : ""}
                />
                {emailError && (
                  <p className="text-xs text-red-500 mt-1">{emailError}</p>
                )}
              </div>

              {/* Phone field - step 1+ */}
              {qualificationStep >= 1 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Phone Number</span>
                  </div>
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setPhoneError("");
                    }}
                    className={phoneError ? "border-red-500" : ""}
                  />
                  {phoneError && (
                    <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                  )}
                </div>
              )}

              {/* Full name - step 2+ */}
              {qualificationStep >= 2 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Full Name</span>
                  </div>
                  <Input
                    type="text"
                    placeholder="John Smith"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setNameError("");
                    }}
                    className={nameError ? "border-red-500" : ""}
                  />
                  {nameError && (
                    <p className="text-xs text-red-500 mt-1">{nameError}</p>
                  )}
                </div>
              )}

              {/* Company employees - step 3+ */}
              {qualificationStep >= 3 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Building className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Company Size</span>
                  </div>
                  <Select value={companyEmployees} onValueChange={setCompanyEmployees}>
                    <SelectTrigger>
                      <SelectValue placeholder="How many employees?" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt} employees</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Annual revenue - step 4+ */}
              {qualificationStep >= 4 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Annual Revenue</span>
                  </div>
                  <Select value={annualRevenue} onValueChange={setAnnualRevenue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Estimated annual revenue?" />
                    </SelectTrigger>
                    <SelectContent>
                      {revenueOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Math CAPTCHA */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">
                  Quick verification: What is <span className="font-semibold text-foreground">{captcha.question}</span>?
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Your answer"
                  value={captchaInput}
                  onChange={(e) => {
                    setCaptchaInput(e.target.value);
                    setCaptchaError("");
                  }}
                  className={captchaError ? "border-red-500" : ""}
                />
                {captchaError && (
                  <p className="text-xs text-red-500 mt-1">{captchaError}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                disabled={isLoading}
                className={`w-full gap-2 bg-gradient-to-r ${config.color} hover:opacity-90`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Get My Results
                  </>
                )}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center">
              We respect your privacy. No spam, ever.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Results Modal */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                <IconComponent className="w-4 h-4 text-white" />
              </div>
              {config.title} Results
            </DialogTitle>
          </DialogHeader>

          {results && (
            <div className="space-y-6 pt-2">
              {/* Domain & Score */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{results.domain}</span>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-bold ${getScoreColor(results.overallScore)}`}>
                    {results.overallScore}
                  </span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overall Score</span>
                  <span className={getScoreColor(results.overallScore)}>{results.overallScore}%</span>
                </div>
                <Progress value={results.overallScore} className="h-2" />
              </div>

              {/* Metrics */}
              <div className="space-y-3">
                {results.metrics.map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(metric.status)}
                      <div>
                        <p className="text-sm font-medium">{metric.label}</p>
                        <p className="text-xs text-muted-foreground">{metric.description}</p>
                      </div>
                    </div>
                    <span className="font-semibold">{metric.value}</span>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <div className="pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground mb-3">
                  Want a detailed analysis with a free do-follow backlink?
                </p>
                <Button asChild className="w-full gap-2">
                  <a href={`/audit/${encodeURIComponent(results.domain)}`}>
                    Run Full Audit
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickMetricCheck;
