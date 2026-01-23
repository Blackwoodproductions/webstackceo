import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import BackToTop from "@/components/ui/back-to-top";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  Zap,
  Clock,
  Globe,
  Lock,
  FileText,
  Image,
  ExternalLink,
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
}

// Generate simulated audit results based on domain
const generateAuditResults = (domain: string): AuditCategory[] => {
  // Use domain hash to generate consistent but varied results
  const hash = domain.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const randomScore = (base: number, variance: number) => {
    const offset = ((hash % 100) / 100) * variance * 2 - variance;
    return Math.min(100, Math.max(0, Math.round(base + offset)));
  };

  const speedScore = randomScore(72, 20);
  const schemaScore = randomScore(45, 30);
  const metaScore = randomScore(68, 25);
  const securityScore = randomScore(85, 15);

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
          name: "Canonical URL",
          status: metaScore > 55 ? "pass" : "warning",
          description: "Canonical URLs prevent duplicate content issues",
        },
        {
          name: "Robots Meta Tag",
          status: "pass",
          description: "Robots meta tag controls search engine crawling behavior",
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
        {
          name: "Content Security Policy",
          status: securityScore > 85 ? "pass" : hash % 3 === 0 ? "warning" : "fail",
          description: "CSP helps prevent XSS and data injection attacks",
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

  const decodedDomain = domain ? decodeURIComponent(domain) : "";

  useEffect(() => {
    if (!decodedDomain) {
      navigate("/");
      return;
    }

    // Simulate loading time for audit
    const timer = setTimeout(() => {
      setAuditResults(generateAuditResults(decodedDomain));
      setIsLoading(false);
    }, 2000);

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
                  { icon: FileCode, text: "Scanning for schema markup..." },
                  { icon: Search, text: "Analyzing meta tags..." },
                  { icon: Shield, text: "Checking security headers..." },
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
                    {i < 3 && (
                      <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
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
        description={`Comprehensive SEO audit results for ${decodedDomain}. Check page speed, schema markup, meta tags, and security analysis.`}
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

          {/* Score Overview Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
          >
            {auditResults.map((category, i) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border/50"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${getScoreGradient(category.score)}/20`}>
                    <category.icon className={`w-5 h-5 ${getScoreColor(category.score)}`} />
                  </div>
                  <span className="font-medium">{category.title}</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className={`text-3xl font-bold ${getScoreColor(category.score)}`}>
                    {category.score}
                  </span>
                  <span className="text-sm text-muted-foreground mb-1">/100</span>
                </div>
                <Progress
                  value={category.score}
                  className="h-2 mt-3"
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Detailed Results */}
          <div className="space-y-8">
            {auditResults.map((category, catIndex) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + catIndex * 0.1 }}
                className="rounded-2xl bg-card border border-border/50 overflow-hidden"
              >
                <div className="p-6 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${getScoreGradient(category.score)}/20`}>
                      <category.icon className={`w-5 h-5 ${getScoreColor(category.score)}`} />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">{category.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        {category.checks.filter((c) => c.status === "pass").length} of{" "}
                        {category.checks.length} checks passed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                      {category.score}
                    </span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                </div>

                <div className="divide-y divide-border/50">
                  {category.checks.map((check, checkIndex) => (
                    <div
                      key={check.name}
                      className="p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors"
                    >
                      {getStatusIcon(check.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{check.name}</span>
                          {check.value && (
                            <span className="text-sm px-2 py-0.5 rounded bg-muted text-muted-foreground">
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
            ))}
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-violet-500/10 to-amber-500/10 border border-primary/20 text-center"
          >
            <Zap className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Ready to Improve Your SEO?</h3>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Let our team of experts help you fix these issues and boost your search rankings.
              Get started with a custom SEO strategy today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 via-violet-500 to-amber-500 hover:from-cyan-600 hover:via-violet-600 hover:to-amber-600"
                onClick={() => navigate("/pricing")}
              >
                View Pricing Plans
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/contact")}
              >
                Contact Us
              </Button>
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
