import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import BackToTop from "@/components/ui/back-to-top";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProgressIndicator, ProgressSummaryBanner } from "@/components/audit/ProgressIndicator";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Globe,
  Link2,
  ExternalLink,
  TrendingUp,
  Calendar,
  Phone,
  ArrowLeft,
  ArrowRight,
  Gift,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Gauge,
  FileCode,
  Search,
  Shield,
  Smartphone,
  Heading,
  Image,
  FileText,
  Bot,
  Clock,
  BarChart3,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Types
interface HistorySnapshot {
  id: string;
  domain: string;
  snapshot_at: string;
  domain_rating: number | null;
  organic_traffic: number | null;
  organic_keywords: number | null;
  backlinks: number | null;
  referring_domains: number | null;
  traffic_value: number | null;
}

interface SavedAudit {
  id: string;
  domain: string;
  slug: string;
  site_title: string | null;
  site_summary: string | null;
  favicon_url: string | null;
  domain_rating: number | null;
  organic_traffic: number | null;
  organic_keywords: number | null;
  backlinks: number | null;
  referring_domains: number | null;
  traffic_value: number | null;
  created_at: string;
  category: string;
}

interface TechnicalCheck {
  name: string;
  status: "pass" | "warning" | "fail";
  score: number;
}

interface AuditCategory {
  title: string;
  icon: typeof Gauge;
  score: number;
  checks: TechnicalCheck[];
  isRealData?: boolean;
}

// Helper functions
const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
};

const formatNumber = (num: number | null) => {
  if (num === null) return "—";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
};

const CaseStudyDetail = () => {
  const { domain } = useParams<{ domain: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEmbedMode = searchParams.get('embed') === 'true';

  const [isLoading, setIsLoading] = useState(true);
  const [savedAudit, setSavedAudit] = useState<SavedAudit | null>(null);
  const [historySnapshots, setHistorySnapshots] = useState<HistorySnapshot[]>([]);
  const [isClaimed, setIsClaimed] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [claimEmail, setClaimEmail] = useState("");
  const [justClaimed, setJustClaimed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Decode domain from URL
  const decodedDomain = useMemo(() => {
    if (!domain) return "";
    return domain.replace(/-/g, ".").toLowerCase();
  }, [domain]);

  // Fetch case study data
  useEffect(() => {
    const fetchCaseStudy = async () => {
      if (!domain) return;
      
      setIsLoading(true);
      try {
        // Fetch saved audit
        const { data: audit, error: auditError } = await supabase
          .from("saved_audits")
          .select("*")
          .eq("slug", domain)
          .maybeSingle();

        if (auditError) throw auditError;

        if (audit) {
          setSavedAudit(audit);
          setIsClaimed(!!audit.submitter_email);

          // Fetch all history snapshots
          const { data: history, error: historyError } = await supabase
            .from("audit_history")
            .select("*")
            .eq("domain", audit.domain)
            .order("snapshot_at", { ascending: true });

          if (!historyError && history) {
            setHistorySnapshots(history);
          }
        } else {
          toast.error("Case study not found");
          navigate("/case-studies");
        }
      } catch (err) {
        console.error("Error fetching case study:", err);
        toast.error("Failed to load case study");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaseStudy();
  }, [domain, navigate]);

  // Calculate baseline (first snapshot)
  const baselineMetrics = useMemo(() => {
    if (historySnapshots.length === 0) return null;
    const first = historySnapshots[0];
    return {
      domainRating: first.domain_rating ?? 0,
      organicTraffic: first.organic_traffic ?? 0,
      organicKeywords: first.organic_keywords ?? 0,
      backlinks: first.backlinks ?? 0,
      referringDomains: first.referring_domains ?? 0,
      trafficValue: first.traffic_value ?? 0,
      snapshotDate: first.snapshot_at,
    };
  }, [historySnapshots]);

  // Current metrics (latest)
  const currentMetrics = useMemo(() => {
    if (!savedAudit) return null;
    return {
      domainRating: savedAudit.domain_rating ?? 0,
      organicTraffic: savedAudit.organic_traffic ?? 0,
      organicKeywords: savedAudit.organic_keywords ?? 0,
      backlinks: savedAudit.backlinks ?? 0,
      referringDomains: savedAudit.referring_domains ?? 0,
      trafficValue: savedAudit.traffic_value ?? 0,
    };
  }, [savedAudit]);

  // Chart data from history
  const chartData = useMemo(() => {
    return historySnapshots.map((snapshot) => ({
      date: snapshot.snapshot_at,
      domainRating: snapshot.domain_rating ?? 0,
      organicTraffic: snapshot.organic_traffic ?? 0,
      organicKeywords: snapshot.organic_keywords ?? 0,
      trafficValue: snapshot.traffic_value ?? 0,
    }));
  }, [historySnapshots]);

  // Handle claim
  const handleClaim = async () => {
    if (!claimEmail || !savedAudit) return;

    try {
      const { error } = await supabase
        .from("saved_audits")
        .update({ submitter_email: claimEmail })
        .eq("id", savedAudit.id);

      if (error) throw error;

      setIsClaimed(true);
      setJustClaimed(true);
      setShowClaimDialog(false);
      toast.success("Your free do-follow backlink is now active!");
    } catch (err) {
      console.error("Error claiming:", err);
      toast.error("Failed to claim backlink");
    }
  };

  // Toggle category expansion
  const toggleCategory = (title: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  // Generate simulated technical audit categories
  const auditResults: AuditCategory[] = useMemo(() => {
    const domainHash = decodedDomain.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    
    return [
      {
        title: "Page Speed",
        icon: Gauge,
        score: 70 + (domainHash % 25),
        checks: [
          { name: "First Contentful Paint", status: domainHash % 3 === 0 ? "pass" : "warning", score: 75 + (domainHash % 20) },
          { name: "Largest Contentful Paint", status: domainHash % 4 === 0 ? "pass" : "warning", score: 65 + (domainHash % 25) },
          { name: "Time to Interactive", status: "pass", score: 80 + (domainHash % 15) },
        ],
      },
      {
        title: "Schema Markup",
        icon: FileCode,
        score: 60 + (domainHash % 35),
        checks: [
          { name: "Organization Schema", status: domainHash % 2 === 0 ? "pass" : "fail", score: domainHash % 2 === 0 ? 100 : 0 },
          { name: "Breadcrumb Schema", status: domainHash % 3 === 0 ? "pass" : "warning", score: domainHash % 3 === 0 ? 100 : 50 },
          { name: "Article Schema", status: domainHash % 5 === 0 ? "pass" : "fail", score: domainHash % 5 === 0 ? 100 : 0 },
        ],
      },
      {
        title: "Meta Tags",
        icon: Search,
        score: 75 + (domainHash % 20),
        checks: [
          { name: "Title Tag", status: "pass", score: 95 },
          { name: "Meta Description", status: domainHash % 4 === 0 ? "pass" : "warning", score: domainHash % 4 === 0 ? 90 : 60 },
          { name: "Open Graph Tags", status: "pass", score: 100 },
        ],
      },
      {
        title: "SSL/Security",
        icon: Shield,
        score: 85 + (domainHash % 15),
        checks: [
          { name: "SSL Certificate", status: "pass", score: 100 },
          { name: "HTTPS Redirect", status: "pass", score: 100 },
          { name: "Security Headers", status: domainHash % 3 === 0 ? "pass" : "warning", score: domainHash % 3 === 0 ? 90 : 65 },
        ],
      },
      {
        title: "Mobile Optimization",
        icon: Smartphone,
        score: 78 + (domainHash % 18),
        checks: [
          { name: "Viewport Meta", status: "pass", score: 100 },
          { name: "Touch Targets", status: "pass", score: 85 },
          { name: "Mobile-Friendly", status: "pass", score: 90 },
        ],
      },
      {
        title: "Content Quality",
        icon: FileText,
        score: 72 + (domainHash % 22),
        checks: [
          { name: "Heading Structure", status: "pass", score: 88 },
          { name: "Image Alt Text", status: domainHash % 2 === 0 ? "pass" : "warning", score: domainHash % 2 === 0 ? 85 : 55 },
          { name: "Content Length", status: "pass", score: 80 },
        ],
      },
    ];
  }, [decodedDomain]);

  const overallScore = useMemo(() => {
    const total = auditResults.reduce((sum, cat) => sum + cat.score, 0);
    return Math.round(total / auditResults.length);
  }, [auditResults]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading case study...</p>
        </div>
      </div>
    );
  }

  if (!savedAudit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Globe className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Case Study Not Found</h2>
          <p className="text-muted-foreground mb-4">This domain is not being tracked as a case study.</p>
          <Button onClick={() => navigate("/case-studies")}>View All Case Studies</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${decodedDomain} SEO Case Study | Monthly Progress Tracking`}
        description={`Track SEO improvements for ${decodedDomain}. Monthly snapshots showing domain rating, organic traffic, and backlink growth over time.`}
        noIndex
      />
      {!isEmbedMode && <Navbar />}
      <main className={isEmbedMode ? "py-2 px-4" : "pt-24 pb-16"}>
        <div className={isEmbedMode ? "w-full" : "max-w-6xl mx-auto px-6"}>
          {/* Back Button - hide in embed mode */}
          {!isEmbedMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/case-studies")}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Case Studies
            </Button>
          )}

          {/* Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="p-6 rounded-2xl bg-card border border-border/50">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {savedAudit.favicon_url ? (
                      <img
                        src={savedAudit.favicon_url}
                        alt=""
                        className="w-10 h-10 rounded-lg object-contain bg-muted p-1"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : (
                      <Globe className="w-10 h-10 text-primary" />
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={`https://${decodedDomain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-2xl md:text-3xl font-bold hover:text-primary transition-colors flex items-center gap-2 group"
                        >
                          {decodedDomain}
                          <ExternalLink className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                        <Badge variant="outline" className="text-primary border-primary/30">
                          <BarChart3 className="w-3 h-3 mr-1" />
                          Case Study
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Monthly SEO Progress Tracking
                      </p>

                      {/* Claimed Notification */}
                      {isClaimed && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 mt-2 w-fit"
                        >
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 0.7, repeat: Infinity, repeatType: "reverse" }}
                            className="text-green-500 shrink-0"
                          >
                            <ArrowRight className="w-3 h-3 rotate-[225deg]" />
                          </motion.div>
                          <Link2 className="w-3 h-3 text-green-400 shrink-0" />
                          <span className="text-xs font-medium text-green-400">
                            {justClaimed
                              ? "Your do-follow link is now active! Click the domain to visit."
                              : "Free do-follow backlink active!"}
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
                      className="gap-2"
                      onClick={() => setShowClaimDialog(true)}
                    >
                      <Gift className="w-4 h-4 text-primary" />
                      Claim Free Backlink
                    </Button>
                  )}
                  <Button className="gap-2" asChild>
                    <a href="https://calendly.com/d/csmt-vs9-zq6/seo-local-book-demo" target="_blank" rel="noopener noreferrer">
                      <Phone className="w-4 h-4" />
                      Book a Call
                    </a>
                  </Button>
                </div>
              </div>

              {/* Site summary */}
              {savedAudit.site_summary && (
                <p className="text-muted-foreground mb-4">{savedAudit.site_summary}</p>
              )}

              {/* Tracking info */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Tracking since {new Date(savedAudit.created_at).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {historySnapshots.length} monthly snapshots
                </span>
              </div>
            </div>
          </motion.div>

          {/* Technical Health Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
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
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className="p-4 rounded-xl cursor-pointer hover:bg-muted/30 transition-all border border-border/30"
                      onClick={() => toggleCategory(category.title)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${category.score >= 80 ? "bg-green-500/20" : category.score >= 60 ? "bg-amber-500/20" : "bg-red-500/20"}`}>
                            <category.icon className={`w-4 h-4 ${getScoreColor(category.score)}`} />
                          </div>
                          <span className="text-sm font-medium">{category.title}</span>
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

                      <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${category.score}%` }}
                          transition={{ duration: 0.8, delay: 0.15 + i * 0.05 }}
                          className={`h-full ${barColor} rounded-full`}
                        />
                      </div>

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
                            {passedChecks === totalChecks ? "All clear" : passedChecks >= totalChecks / 2 ? "Needs attention" : "Critical"}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Progress Summary */}
          {baselineMetrics && currentMetrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <h2 className="text-xl font-bold mb-6">Progress Since First Snapshot</h2>
              <ProgressSummaryBanner
                metrics={{
                  domainRating: { current: currentMetrics.domainRating, baseline: baselineMetrics.domainRating },
                  organicTraffic: { current: currentMetrics.organicTraffic, baseline: baselineMetrics.organicTraffic },
                  organicKeywords: { current: currentMetrics.organicKeywords, baseline: baselineMetrics.organicKeywords },
                  backlinks: { current: currentMetrics.backlinks, baseline: baselineMetrics.backlinks },
                  referringDomains: { current: currentMetrics.referringDomains, baseline: baselineMetrics.referringDomains },
                  trafficValue: { current: currentMetrics.trafficValue, baseline: baselineMetrics.trafficValue },
                }}
                baselineDate={baselineMetrics.snapshotDate}
              />
            </motion.div>
          )}

          {/* Current Metrics */}
          {currentMetrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-8"
            >
              <h2 className="text-xl font-bold mb-6">Current Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: "Domain Rating", value: currentMetrics.domainRating, baseline: baselineMetrics?.domainRating, color: "text-violet-400" },
                  { label: "Organic Traffic", value: currentMetrics.organicTraffic, baseline: baselineMetrics?.organicTraffic, color: "text-green-400", suffix: "/mo" },
                  { label: "Traffic Value", value: currentMetrics.trafficValue, baseline: baselineMetrics?.trafficValue, color: "text-cyan-400", prefix: "$" },
                  { label: "Organic Keywords", value: currentMetrics.organicKeywords, baseline: baselineMetrics?.organicKeywords, color: "text-amber-400" },
                  { label: "Backlinks", value: currentMetrics.backlinks, baseline: baselineMetrics?.backlinks, color: "text-primary" },
                  { label: "Referring Domains", value: currentMetrics.referringDomains, baseline: baselineMetrics?.referringDomains, color: "text-green-400" },
                ].map((metric) => (
                  <div key={metric.label} className="p-4 rounded-xl bg-card border border-border/50 text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {metric.prefix || ""}{formatNumber(metric.value)}{metric.suffix || ""}
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">{metric.label}</p>
                    {metric.baseline !== undefined && metric.baseline !== null && metric.value !== metric.baseline && (
                      <ProgressIndicator
                        current={metric.value}
                        baseline={metric.baseline}
                        size="sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Historical Trend Chart */}
          {chartData.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <h2 className="text-xl font-bold mb-6">Monthly Progress Chart</h2>
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                        }}
                      />
                      <YAxis
                        yAxisId="traffic"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value)}
                      />
                      <YAxis yAxisId="dr" orientation="right" domain={[0, 100]} hide />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                        }}
                      />
                      <Line
                        yAxisId="traffic"
                        type="monotone"
                        dataKey="organicTraffic"
                        name="Organic Traffic"
                        stroke="hsl(142, 71%, 45%)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        yAxisId="dr"
                        type="monotone"
                        dataKey="domainRating"
                        name="Domain Rating"
                        stroke="hsl(262, 83%, 58%)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4 text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(142, 71%, 45%)" }} />
                    Organic Traffic
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(262, 83%, 58%)" }} />
                    Domain Rating
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Monthly Snapshot Timeline */}
          {historySnapshots.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mb-8"
            >
              <h2 className="text-xl font-bold mb-6">Monthly Snapshots</h2>
              <div className="space-y-3">
                {historySnapshots.slice().reverse().map((snapshot, index) => {
                  const isFirst = index === historySnapshots.length - 1;
                  return (
                    <div
                      key={snapshot.id}
                      className="p-4 rounded-xl bg-card border border-border/50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isFirst ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {new Date(snapshot.snapshot_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isFirst ? "Initial snapshot" : `Month ${historySnapshots.length - index}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-bold text-violet-400">{snapshot.domain_rating ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">DR</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-green-400">{formatNumber(snapshot.organic_traffic)}</p>
                          <p className="text-xs text-muted-foreground">Traffic</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-amber-400">{formatNumber(snapshot.organic_keywords)}</p>
                          <p className="text-xs text-muted-foreground">Keywords</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-cyan-400">${formatNumber(snapshot.traffic_value)}</p>
                          <p className="text-xs text-muted-foreground">Value</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* CTA Section */}
          {!isEmbedMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center py-12"
            >
              <h2 className="text-2xl font-bold mb-4">Ready to Improve Your SEO?</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Book a call with our team to discuss how we can help you achieve similar results.
              </p>
              <Button size="lg" asChild>
                <a href="https://calendly.com/d/csmt-vs9-zq6/seo-local-book-demo" target="_blank" rel="noopener noreferrer">
                  <Phone className="w-4 h-4 mr-2" />
                  Schedule a Strategy Call
                </a>
              </Button>
            </motion.div>
          )}
        </div>
      </main>

      {/* Claim Dialog */}
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Claim Your Free Do-Follow Backlink
            </DialogTitle>
            <DialogDescription>
              Enter your email to activate a permanent do-follow link from this case study page to your website.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="email"
              placeholder="your@email.com"
              value={claimEmail}
              onChange={(e) => setClaimEmail(e.target.value)}
            />
            <Button className="w-full" onClick={handleClaim} disabled={!claimEmail}>
              Activate Free Backlink
            </Button>
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

export default CaseStudyDetail;
