import { useState, useMemo, useEffect } from "react";
import {
  Search, Globe, FileCheck, FileX, AlertTriangle, CheckCircle,
  TrendingUp, RefreshCw, Loader2, ArrowUpRight, ArrowDownRight,
  MapPin, BarChart3, PieChart as PieChartIcon, Zap, Clock,
  Send, ListPlus, Settings, History, Rss, ToggleLeft, ToggleRight, Upload
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  Area,
  Legend,
} from "recharts";

interface PerformanceRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface IndexationStatus {
  url: string;
  verdict: string;
  coverageState: string;
  robotsTxtState: string;
  indexingState: string;
  lastCrawlTime: string;
  pageFetchState: string;
  googleCanonical: string;
  userCanonical: string;
}

interface SubmissionResult {
  url: string;
  success: boolean;
  error?: string;
  notifyTime?: string;
  timestamp: string;
  source?: 'manual' | 'bulk' | 'auto';
}

interface SitemapInfo {
  path: string;
  lastSubmitted: string;
  isPending: boolean;
  isSitemapsIndex: boolean;
  lastDownloaded?: string;
  warnings?: number;
  errors?: number;
}

interface GSCAdvancedReportingProps {
  accessToken: string | null;
  selectedSite: string;
  dateRange: string;
  queryData: PerformanceRow[];
  countryData: PerformanceRow[];
  pageData: PerformanceRow[];
  isFetching: boolean;
}

const COUNTRY_NAMES: Record<string, string> = {
  usa: "United States",
  gbr: "United Kingdom",
  can: "Canada",
  aus: "Australia",
  deu: "Germany",
  fra: "France",
  esp: "Spain",
  ita: "Italy",
  nld: "Netherlands",
  bra: "Brazil",
  mex: "Mexico",
  ind: "India",
  jpn: "Japan",
  kor: "South Korea",
  chn: "China",
  rus: "Russia",
  pol: "Poland",
  swe: "Sweden",
  nor: "Norway",
  dnk: "Denmark",
  fin: "Finland",
  che: "Switzerland",
  aut: "Austria",
  bel: "Belgium",
  prt: "Portugal",
  irl: "Ireland",
  nzl: "New Zealand",
  sgp: "Singapore",
  hkg: "Hong Kong",
  phl: "Philippines",
  idn: "Indonesia",
  tha: "Thailand",
  mys: "Malaysia",
  vnm: "Vietnam",
  are: "UAE",
  sau: "Saudi Arabia",
  zaf: "South Africa",
  egy: "Egypt",
  ngr: "Nigeria",
  arg: "Argentina",
  col: "Colombia",
  chl: "Chile",
  per: "Peru",
};

const COLORS = [
  "hsl(var(--primary))",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

export const GSCAdvancedReporting = ({
  accessToken,
  selectedSite,
  dateRange,
  queryData,
  countryData,
  pageData,
  isFetching,
}: GSCAdvancedReportingProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("keywords");
  const [keywordFilter, setKeywordFilter] = useState("");
  const [indexationData, setIndexationData] = useState<IndexationStatus[]>([]);
  const [isLoadingIndexation, setIsLoadingIndexation] = useState(false);
  const [autoIndexQueue, setAutoIndexQueue] = useState<string[]>([]);
  const [isAutoIndexing, setIsAutoIndexing] = useState(false);
  const [indexedCount, setIndexedCount] = useState(0);
  
  // Indexation timer state
  const [indexationProgress, setIndexationProgress] = useState(0);
  const [indexationTotal, setIndexationTotal] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const [indexationStartTime, setIndexationStartTime] = useState<number | null>(null);
  
  // Auto-submission settings
  const [autoSubmitEnabled, setAutoSubmitEnabled] = useState(() => {
    return localStorage.getItem('gsc_auto_submit_enabled') === 'true';
  });
  const [autoSubmitNewPages, setAutoSubmitNewPages] = useState(() => {
    return localStorage.getItem('gsc_auto_submit_new_pages') === 'true';
  });
  
  // Submission history
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionResult[]>(() => {
    try {
      const stored = localStorage.getItem('gsc_submission_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  
  // Bulk URL submission
  const [bulkUrls, setBulkUrls] = useState("");
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  
  // Sitemap management
  const [sitemaps, setSitemaps] = useState<SitemapInfo[]>([]);
  const [isLoadingSitemaps, setIsLoadingSitemaps] = useState(false);
  const [newSitemapUrl, setNewSitemapUrl] = useState("");
  const [isSubmittingSitemap, setIsSubmittingSitemap] = useState(false);
  
  // Pagination for top keywords
  const [keywordPage, setKeywordPage] = useState(1);
  const KEYWORDS_PER_PAGE = 25;

  // Track previous site to detect changes
  const [prevSite, setPrevSite] = useState<string>(selectedSite);
  
  // Reset all domain-specific data when selectedSite changes
  useEffect(() => {
    if (selectedSite && selectedSite !== prevSite) {
      console.log('[GSCAdvanced] Site changed from', prevSite, 'to', selectedSite, '- resetting data');
      
      // Clear all domain-specific state
      setIndexationData([]);
      setAutoIndexQueue([]);
      setIndexedCount(0);
      setIndexationProgress(0);
      setIndexationTotal(0);
      setEstimatedTimeRemaining(null);
      setIndexationStartTime(null);
      setSitemaps([]);
      setBulkUrls("");
      setKeywordFilter("");
      setKeywordPage(1);
      
      // Clear domain-specific submission history from localStorage
      // Keep history but filter to show only for current domain
      try {
        const stored = localStorage.getItem('gsc_submission_history');
        if (stored) {
          const allHistory: SubmissionResult[] = JSON.parse(stored);
          // Filter to show only submissions that match the new domain
          const siteHost = new URL(selectedSite.replace('sc-domain:', 'https://')).hostname.replace('www.', '');
          const filteredHistory = allHistory.filter(item => {
            try {
              const itemHost = new URL(item.url).hostname.replace('www.', '');
              return itemHost.includes(siteHost) || siteHost.includes(itemHost);
            } catch {
              return false;
            }
          });
          setSubmissionHistory(filteredHistory);
        } else {
          setSubmissionHistory([]);
        }
      } catch {
        setSubmissionHistory([]);
      }
      
      setPrevSite(selectedSite);
    }
  }, [selectedSite, prevSite]);
  
  // Persist auto-submit settings
  useEffect(() => {
    localStorage.setItem('gsc_auto_submit_enabled', autoSubmitEnabled.toString());
  }, [autoSubmitEnabled]);
  
  useEffect(() => {
    localStorage.setItem('gsc_auto_submit_new_pages', autoSubmitNewPages.toString());
  }, [autoSubmitNewPages]);
  
  useEffect(() => {
    localStorage.setItem('gsc_submission_history', JSON.stringify(submissionHistory.slice(0, 100)));
  }, [submissionHistory]);

  // Format helpers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getCountryName = (code: string): string => {
    return COUNTRY_NAMES[code.toLowerCase()] || code.toUpperCase();
  };

  // Keyword intent icon helper - categorizes keywords by search intent
  const getKeywordIcon = (keyword: string): { icon: string; color: string; intent: string } => {
    const kw = keyword.toLowerCase();
    
    // Transactional intent (ready to buy/convert)
    if (kw.includes('buy') || kw.includes('price') || kw.includes('cost') || kw.includes('pricing') || 
        kw.includes('cheap') || kw.includes('discount') || kw.includes('deal') || kw.includes('order') ||
        kw.includes('purchase') || kw.includes('subscribe') || kw.includes('hire') || kw.includes('get quote')) {
      return { icon: '💰', color: 'text-green-500', intent: 'Transactional' };
    }
    
    // Commercial investigation (comparing options)
    if (kw.includes('best') || kw.includes('top') || kw.includes('review') || kw.includes('vs') || 
        kw.includes('comparison') || kw.includes('compare') || kw.includes('alternative') ||
        kw.includes('versus') || kw.includes('rated')) {
      return { icon: '⚖️', color: 'text-amber-500', intent: 'Commercial' };
    }
    
    // Local intent
    if (kw.includes('near me') || kw.includes('local') || kw.includes('in ') || 
        kw.includes('nearby') || kw.includes('location')) {
      return { icon: '📍', color: 'text-red-500', intent: 'Local' };
    }
    
    // How-to / Tutorial intent
    if (kw.includes('how to') || kw.includes('how do') || kw.includes('tutorial') || 
        kw.includes('guide') || kw.includes('step by step') || kw.includes('tips')) {
      return { icon: '📖', color: 'text-blue-500', intent: 'How-to' };
    }
    
    // Question intent
    if (kw.includes('what is') || kw.includes('what are') || kw.includes('why') || 
        kw.includes('when') || kw.includes('who') || kw.includes('?')) {
      return { icon: '❓', color: 'text-violet-500', intent: 'Question' };
    }
    
    // Brand/navigational intent
    if (kw.includes('login') || kw.includes('sign in') || kw.includes('dashboard') ||
        kw.includes('account') || kw.includes('support')) {
      return { icon: '🔑', color: 'text-cyan-500', intent: 'Navigational' };
    }
    
    // Service/product related
    if (kw.includes('service') || kw.includes('agency') || kw.includes('company') ||
        kw.includes('software') || kw.includes('tool') || kw.includes('platform')) {
      return { icon: '🛠️', color: 'text-orange-500', intent: 'Service' };
    }
    
    // SEO specific keywords
    if (kw.includes('seo') || kw.includes('search engine') || kw.includes('ranking') ||
        kw.includes('keyword') || kw.includes('backlink')) {
      return { icon: '🔍', color: 'text-primary', intent: 'SEO' };
    }
    
    // Default informational
    return { icon: '📄', color: 'text-muted-foreground', intent: 'Informational' };
  };

  // Keyword analytics data
  const keywordAnalytics = useMemo(() => {
    const filtered = keywordFilter
      ? queryData.filter((q) => q.keys[0].toLowerCase().includes(keywordFilter.toLowerCase()))
      : queryData;

    // Top performing (high clicks, good position) - return all for pagination
    const topPerforming = [...filtered]
      .sort((a, b) => b.clicks - a.clicks);

    // Rising opportunities (high impressions, low clicks = room to grow)
    const opportunities = [...filtered]
      .filter((q) => q.impressions > 50 && q.ctr < 0.03 && q.position > 5 && q.position < 30)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10);

    // Position distribution
    const positionBuckets = {
      "1-3": 0,
      "4-10": 0,
      "11-20": 0,
      "21-50": 0,
      "50+": 0,
    };
    filtered.forEach((q) => {
      if (q.position <= 3) positionBuckets["1-3"]++;
      else if (q.position <= 10) positionBuckets["4-10"]++;
      else if (q.position <= 20) positionBuckets["11-20"]++;
      else if (q.position <= 50) positionBuckets["21-50"]++;
      else positionBuckets["50+"]++;
    });

    const positionChartData = Object.entries(positionBuckets).map(([name, value]) => ({
      name,
      value,
      fill: name === "1-3" ? "#10b981" : name === "4-10" ? "#22c55e" : name === "11-20" ? "#f59e0b" : name === "21-50" ? "#f97316" : "#ef4444",
    }));

    // CTR vs Position chart
    const ctrPositionData = filtered
      .slice(0, 50)
      .map((q) => ({
        keyword: q.keys[0].substring(0, 20) + (q.keys[0].length > 20 ? "..." : ""),
        position: q.position,
        ctr: q.ctr * 100,
        clicks: q.clicks,
        impressions: q.impressions,
      }))
      .sort((a, b) => a.position - b.position);

    return { topPerforming, opportunities, positionChartData, ctrPositionData };
  }, [queryData, keywordFilter]);

  // Country analytics
  const countryAnalytics = useMemo(() => {
    const sortedByClicks = [...countryData].sort((a, b) => b.clicks - a.clicks);
    const top10 = sortedByClicks.slice(0, 10);
    const totalClicks = countryData.reduce((sum, c) => sum + c.clicks, 0);
    const totalImpressions = countryData.reduce((sum, c) => sum + c.impressions, 0);

    const pieData = top10.map((c, i) => ({
      name: getCountryName(c.keys[0]),
      code: c.keys[0],
      value: c.clicks,
      fill: COLORS[i % COLORS.length],
      percentage: totalClicks > 0 ? ((c.clicks / totalClicks) * 100).toFixed(1) : "0",
    }));

    const barData = top10.map((c) => ({
      country: getCountryName(c.keys[0]),
      code: c.keys[0],
      clicks: c.clicks,
      impressions: c.impressions,
      ctr: c.ctr * 100,
      position: c.position,
    }));

    return { pieData, barData, totalClicks, totalImpressions, countryCount: countryData.length };
  }, [countryData]);

  // Fetch indexation status for pages
  const fetchIndexationStatus = async () => {
    if (!accessToken || !selectedSite || pageData.length === 0) return;

    setIsLoadingIndexation(true);
    const results: IndexationStatus[] = [];
    const pagesToCheck = pageData.slice(0, 20); // Limit to top 20 pages
    
    // Initialize timer tracking
    setIndexationTotal(pagesToCheck.length);
    setIndexationProgress(0);
    setIndexationStartTime(Date.now());
    setEstimatedTimeRemaining(pagesToCheck.length * 3); // Initial estimate: ~3 seconds per URL

    try {
      for (let i = 0; i < pagesToCheck.length; i++) {
        const page = pagesToCheck[i];
        const startTime = Date.now();
        
        try {
          const response = await supabase.functions.invoke("search-console", {
            body: {
              action: "urlInspection",
              accessToken,
              siteUrl: selectedSite,
              inspectionUrl: page.keys[0],
            },
          });

          const inspection = response.data?.inspectionResult;
          if (inspection) {
            results.push({
              url: page.keys[0],
              verdict: inspection.indexStatusResult?.verdict || "UNKNOWN",
              coverageState: inspection.indexStatusResult?.coverageState || "UNKNOWN",
              robotsTxtState: inspection.indexStatusResult?.robotsTxtState || "ALLOWED",
              indexingState: inspection.indexStatusResult?.indexingState || "UNKNOWN",
              lastCrawlTime: inspection.indexStatusResult?.lastCrawlTime || "",
              pageFetchState: inspection.indexStatusResult?.pageFetchState || "UNKNOWN",
              googleCanonical: inspection.indexStatusResult?.googleCanonical || "",
              userCanonical: inspection.indexStatusResult?.userCanonical || "",
            });
          }
        } catch (err) {
          console.log(`Failed to inspect ${page.keys[0]}:`, err);
        }
        
        // Update progress and time estimate
        const elapsed = Date.now() - startTime;
        const avgTimePerUrl = (Date.now() - (indexationStartTime || Date.now())) / (i + 1);
        const remaining = pagesToCheck.length - (i + 1);
        setIndexationProgress(i + 1);
        setEstimatedTimeRemaining(Math.ceil((remaining * avgTimePerUrl) / 1000));
      }

      setIndexationData(results);
      const indexed = results.filter((r) => r.verdict === "PASS" || r.coverageState === "Submitted and indexed").length;
      setIndexedCount(indexed);

      // Find non-indexed pages for auto-index queue
      const notIndexed = results
        .filter((r) => r.verdict !== "PASS" && r.coverageState !== "Submitted and indexed")
        .map((r) => r.url);
      setAutoIndexQueue(notIndexed);

      toast({
        title: "Indexation Check Complete",
        description: `${indexed} of ${results.length} pages indexed`,
      });
    } catch (error) {
      console.error("Error fetching indexation:", error);
      toast({
        title: "Error",
        description: "Failed to fetch indexation status",
        variant: "destructive",
      });
    } finally {
      setIsLoadingIndexation(false);
      setEstimatedTimeRemaining(null);
      setIndexationStartTime(null);
    }
  };

  // Auto-index non-indexed pages (request indexing via API)
  const handleAutoIndex = async () => {
    if (autoIndexQueue.length === 0) {
      toast({
        title: "No Pages to Index",
        description: "All checked pages are already indexed",
      });
      return;
    }

    if (!accessToken) {
      toast({
        title: "Not Authenticated",
        description: "Please connect to Google Search Console first",
        variant: "destructive",
      });
      return;
    }

    setIsAutoIndexing(true);

    toast({
      title: "Auto-Indexing Started",
      description: `Requesting indexing for ${autoIndexQueue.length} pages...`,
    });

    try {
      const response = await supabase.functions.invoke("search-console", {
        body: {
          action: "bulkSubmit",
          accessToken,
          urlsToSubmit: autoIndexQueue,
          notificationType: "URL_UPDATED",
        },
      });

      const result = response.data;
      
      if (result?.success) {
        // Add to submission history
        const newHistory: SubmissionResult[] = (result.results || []).map((r: any) => ({
          url: r.url,
          success: r.success,
          error: r.error,
          notifyTime: r.notifyTime,
          timestamp: new Date().toISOString(),
          source: 'auto' as const,
        }));
        setSubmissionHistory(prev => [...newHistory, ...prev].slice(0, 100));
        
        toast({
          title: "Auto-Indexing Complete",
          description: `Submitted ${result.submitted} URLs. ${result.failed} failed. Google will process within 24-48 hours.`,
        });
      } else {
        toast({
          title: "Auto-Indexing Failed",
          description: result?.error || "Failed to submit URLs for indexing",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error auto-indexing:", error);
      toast({
        title: "Error",
        description: "Failed to submit URLs for indexing",
        variant: "destructive",
      });
    } finally {
      setIsAutoIndexing(false);
      setAutoIndexQueue([]);
    }
  };

  // Submit single URL for indexing
  const handleSubmitUrl = async (url: string) => {
    if (!accessToken) {
      toast({
        title: "Not Authenticated",
        description: "Please connect to Google Search Console first",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await supabase.functions.invoke("search-console", {
        body: {
          action: "submitUrl",
          accessToken,
          urlToSubmit: url,
          notificationType: "URL_UPDATED",
        },
      });

      const result = response.data;
      
      // Add to history
      setSubmissionHistory(prev => [{
        url,
        success: result?.success || false,
        error: result?.error,
        notifyTime: result?.notifyTime,
        timestamp: new Date().toISOString(),
        source: 'manual' as const,
      }, ...prev].slice(0, 100));

      if (result?.success) {
        toast({
          title: "URL Submitted",
          description: `${url} submitted for indexing`,
        });
      } else {
        toast({
          title: "Submission Failed",
          description: result?.error || "Failed to submit URL",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting URL:", error);
      toast({
        title: "Error",
        description: "Failed to submit URL for indexing",
        variant: "destructive",
      });
    }
  };

  // Bulk URL submission
  const handleBulkSubmit = async () => {
    const urls = bulkUrls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.startsWith('http'));

    if (urls.length === 0) {
      toast({
        title: "No Valid URLs",
        description: "Please enter URLs starting with http:// or https://",
        variant: "destructive",
      });
      return;
    }

    if (!accessToken) {
      toast({
        title: "Not Authenticated",
        description: "Please connect to Google Search Console first",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingBulk(true);

    try {
      const response = await supabase.functions.invoke("search-console", {
        body: {
          action: "bulkSubmit",
          accessToken,
          urlsToSubmit: urls,
          notificationType: "URL_UPDATED",
        },
      });

      const result = response.data;
      
      if (result?.success) {
        // Add to submission history
        const newHistory: SubmissionResult[] = (result.results || []).map((r: any) => ({
          url: r.url,
          success: r.success,
          error: r.error,
          notifyTime: r.notifyTime,
          timestamp: new Date().toISOString(),
          source: 'bulk' as const,
        }));
        setSubmissionHistory(prev => [...newHistory, ...prev].slice(0, 100));
        
        setBulkUrls("");
        toast({
          title: "Bulk Submission Complete",
          description: `Submitted ${result.submitted} of ${result.total} URLs`,
        });
      } else {
        toast({
          title: "Bulk Submission Failed",
          description: result?.error || "Failed to submit URLs",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error bulk submitting:", error);
      toast({
        title: "Error",
        description: "Failed to submit URLs for indexing",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  // Fetch sitemaps
  const fetchSitemaps = async () => {
    if (!accessToken || !selectedSite) return;

    setIsLoadingSitemaps(true);
    try {
      const response = await supabase.functions.invoke("search-console", {
        body: {
          action: "sitemaps",
          accessToken,
          siteUrl: selectedSite,
        },
      });

      const data = response.data;
      if (data?.sitemap) {
        setSitemaps(data.sitemap.map((s: any) => ({
          path: s.path,
          lastSubmitted: s.lastSubmitted,
          isPending: s.isPending || false,
          isSitemapsIndex: s.isSitemapsIndex || false,
          lastDownloaded: s.lastDownloaded,
          warnings: s.warnings,
          errors: s.errors,
        })));
      }
    } catch (error) {
      console.error("Error fetching sitemaps:", error);
    } finally {
      setIsLoadingSitemaps(false);
    }
  };

  // Submit new sitemap
  const handleSubmitSitemap = async () => {
    if (!newSitemapUrl.trim()) {
      toast({
        title: "Sitemap URL Required",
        description: "Please enter a sitemap URL",
        variant: "destructive",
      });
      return;
    }

    if (!accessToken || !selectedSite) {
      toast({
        title: "Not Authenticated",
        description: "Please connect to Google Search Console first",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingSitemap(true);
    try {
      const response = await supabase.functions.invoke("search-console", {
        body: {
          action: "submitSitemap",
          accessToken,
          siteUrl: selectedSite,
          sitemapUrl: newSitemapUrl.trim(),
        },
      });

      const result = response.data;
      
      if (result?.success) {
        setNewSitemapUrl("");
        toast({
          title: "Sitemap Submitted",
          description: "Sitemap submitted successfully. Refresh to see updates.",
        });
        fetchSitemaps();
      } else {
        toast({
          title: "Submission Failed",
          description: result?.error || "Failed to submit sitemap",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting sitemap:", error);
      toast({
        title: "Error",
        description: "Failed to submit sitemap",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingSitemap(false);
    }
  };

  // Fetch sitemaps on site change
  useEffect(() => {
    if (accessToken && selectedSite) {
      fetchSitemaps();
    }
  }, [accessToken, selectedSite]);

  // Indexation summary stats
  const indexationStats = useMemo(() => {
    if (indexationData.length === 0) {
      return { indexed: 0, notIndexed: 0, crawled: 0, blocked: 0 };
    }

    return {
      indexed: indexationData.filter((r) => r.verdict === "PASS" || r.coverageState === "Submitted and indexed").length,
      notIndexed: indexationData.filter((r) => r.verdict !== "PASS" && r.coverageState !== "Submitted and indexed").length,
      crawled: indexationData.filter((r) => r.pageFetchState === "SUCCESSFUL").length,
      blocked: indexationData.filter((r) => r.robotsTxtState === "DISALLOWED").length,
    };
  }, [indexationData]);

  // Submission history stats
  const submissionStats = useMemo(() => {
    const last24h = submissionHistory.filter(s => 
      new Date(s.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    return {
      totalSubmitted: submissionHistory.length,
      last24h: last24h.length,
      successRate: submissionHistory.length > 0 
        ? Math.round((submissionHistory.filter(s => s.success).length / submissionHistory.length) * 100)
        : 0,
    };
  }, [submissionHistory]);

  const getVerdictBadge = (verdict: string, coverageState: string) => {
    if (verdict === "PASS" || coverageState === "Submitted and indexed") {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Indexed</Badge>;
    }
    if (verdict === "NEUTRAL") {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><AlertTriangle className="w-3 h-3 mr-1" />Pending</Badge>;
    }
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><FileX className="w-3 h-3 mr-1" />Not Indexed</Badge>;
  };

  // Format domain name for display
  const displayDomain = useMemo(() => {
    if (!selectedSite) return '';
    return selectedSite
      .replace('sc-domain:', '')
      .replace('https://', '')
      .replace('http://', '')
      .replace(/\/$/, '');
  }, [selectedSite]);

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {displayDomain && (
                  <>
                    <span className="text-primary font-semibold">{displayDomain}</span>
                    <span className="text-muted-foreground">—</span>
                  </>
                )}
                <span>Advanced Reporting</span>
              </CardTitle>
              <CardDescription className="text-xs">Deep dive into keywords, countries & indexation</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="h-9 grid grid-cols-3 w-full">
            <TabsTrigger value="keywords" className="text-xs">
              <Search className="w-3.5 h-3.5 mr-1.5" />
              Keywords
            </TabsTrigger>
            <TabsTrigger value="countries" className="text-xs">
              <Globe className="w-3.5 h-3.5 mr-1.5" />
              Countries
            </TabsTrigger>
            <TabsTrigger value="indexation" className="text-xs">
              <FileCheck className="w-3.5 h-3.5 mr-1.5" />
              Indexation
            </TabsTrigger>
          </TabsList>

          {/* Keywords Tab */}
          <TabsContent value="keywords" className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Filter keywords..."
                  value={keywordFilter}
                  onChange={(e) => setKeywordFilter(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              <Badge variant="secondary" className="text-xs">
                {queryData.length} keywords
              </Badge>
            </div>

            {/* Position Distribution Chart */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-secondary/20 border-0">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-primary" />
                    Position Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={keywordAnalytics.positionChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {keywordAnalytics.positionChartData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value: number) => [`${value} keywords`, "Count"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    {keywordAnalytics.positionChartData.map((entry, i) => (
                      <div key={i} className="flex items-center gap-1 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                        <span className="text-muted-foreground">{entry.name}:</span>
                        <span className="font-medium">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* CTR vs Position */}
              <Card className="bg-secondary/20 border-0">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-500" />
                    CTR by Position
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={keywordAnalytics.ctrPositionData.slice(0, 20)} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="position" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={30} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "11px",
                          }}
                          formatter={(value: number, name: string) => [
                            name === "ctr" ? `${value.toFixed(2)}%` : value,
                            name === "ctr" ? "CTR" : name,
                          ]}
                        />
                        <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} opacity={0.6} />
                        <Line type="monotone" dataKey="ctr" stroke="#10b981" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Keywords Table */}
            <Card className="bg-secondary/20 border-0">
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Top Performing Keywords</CardTitle>
                  <Badge variant="secondary" className="text-[10px]">
                    {keywordAnalytics.topPerforming.length} total
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-8">#</TableHead>
                      <TableHead className="text-xs">Keyword</TableHead>
                      <TableHead className="text-right text-xs">Clicks</TableHead>
                      <TableHead className="text-right text-xs">Impressions</TableHead>
                      <TableHead className="text-right text-xs">CTR</TableHead>
                      <TableHead className="text-right text-xs">Position</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keywordAnalytics.topPerforming
                      .slice((keywordPage - 1) * KEYWORDS_PER_PAGE, keywordPage * KEYWORDS_PER_PAGE)
                      .map((row, i) => {
                        const keywordInfo = getKeywordIcon(row.keys[0]);
                        return (
                          <TableRow key={i}>
                            <TableCell className="text-xs py-2 text-muted-foreground">
                              {(keywordPage - 1) * KEYWORDS_PER_PAGE + i + 1}
                            </TableCell>
                            <TableCell className="text-xs py-2 max-w-[250px]">
                              <div className="flex items-center gap-2">
                                {/* Keyword Intent Icon */}
                                <div 
                                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-secondary/50 border border-border"
                                  title={keywordInfo.intent}
                                >
                                  <span className="text-sm">{keywordInfo.icon}</span>
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate" title={row.keys[0]}>{row.keys[0]}</span>
                                  <span className={`text-[9px] ${keywordInfo.color}`}>{keywordInfo.intent}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-xs py-2 font-medium">{formatNumber(row.clicks)}</TableCell>
                            <TableCell className="text-right text-xs py-2 text-muted-foreground">{formatNumber(row.impressions)}</TableCell>
                            <TableCell className="text-right text-xs py-2">
                              <span className={row.ctr > 0.05 ? "text-green-500" : row.ctr > 0.02 ? "text-yellow-500" : "text-muted-foreground"}>
                                {(row.ctr * 100).toFixed(2)}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right py-2">
                              <Badge variant={row.position <= 10 ? "default" : row.position <= 20 ? "secondary" : "outline"} className="text-[10px]">
                                {row.position.toFixed(1)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
                
                {/* Pagination Controls */}
                {keywordAnalytics.topPerforming.length > KEYWORDS_PER_PAGE && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <p className="text-[10px] text-muted-foreground">
                      Showing {(keywordPage - 1) * KEYWORDS_PER_PAGE + 1}-{Math.min(keywordPage * KEYWORDS_PER_PAGE, keywordAnalytics.topPerforming.length)} of {keywordAnalytics.topPerforming.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setKeywordPage(1)}
                        disabled={keywordPage === 1}
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setKeywordPage(p => Math.max(1, p - 1))}
                        disabled={keywordPage === 1}
                      >
                        Prev
                      </Button>
                      <span className="text-xs px-2 text-muted-foreground">
                        Page {keywordPage} of {Math.ceil(keywordAnalytics.topPerforming.length / KEYWORDS_PER_PAGE)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setKeywordPage(p => Math.min(Math.ceil(keywordAnalytics.topPerforming.length / KEYWORDS_PER_PAGE), p + 1))}
                        disabled={keywordPage >= Math.ceil(keywordAnalytics.topPerforming.length / KEYWORDS_PER_PAGE)}
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setKeywordPage(Math.ceil(keywordAnalytics.topPerforming.length / KEYWORDS_PER_PAGE))}
                        disabled={keywordPage >= Math.ceil(keywordAnalytics.topPerforming.length / KEYWORDS_PER_PAGE)}
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Opportunities */}
            {keywordAnalytics.opportunities.length > 0 && (
              <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Quick Win Opportunities
                  </CardTitle>
                  <CardDescription className="text-xs">High impressions, low CTR - room to improve rankings</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <ScrollArea className="h-[150px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Keyword</TableHead>
                          <TableHead className="text-right text-xs">Impressions</TableHead>
                          <TableHead className="text-right text-xs">CTR</TableHead>
                          <TableHead className="text-right text-xs">Position</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {keywordAnalytics.opportunities.map((row, i) => {
                          const keywordInfo = getKeywordIcon(row.keys[0]);
                          return (
                            <TableRow key={i}>
                              <TableCell className="text-xs py-2 max-w-[220px]">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-amber-500/10 border border-amber-500/30"
                                    title={keywordInfo.intent}
                                  >
                                    <span className="text-xs">{keywordInfo.icon}</span>
                                  </div>
                                  <span className="truncate" title={row.keys[0]}>{row.keys[0]}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-xs py-2 font-medium text-amber-500">{formatNumber(row.impressions)}</TableCell>
                              <TableCell className="text-right text-xs py-2 text-red-400">{(row.ctr * 100).toFixed(2)}%</TableCell>
                              <TableCell className="text-right py-2">
                                <Badge variant="secondary" className="text-[10px]">{row.position.toFixed(1)}</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Countries Tab */}
          <TabsContent value="countries" className="space-y-4">
            {/* Country Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary/30 rounded-lg p-3 text-center">
                <Globe className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold">{countryAnalytics.countryCount}</p>
                <p className="text-[10px] text-muted-foreground">Countries</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3 text-center">
                <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-500" />
                <p className="text-xl font-bold">{formatNumber(countryAnalytics.totalClicks)}</p>
                <p className="text-[10px] text-muted-foreground">Total Clicks</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3 text-center">
                <MapPin className="w-5 h-5 mx-auto mb-1 text-cyan-500" />
                <p className="text-xl font-bold">{formatNumber(countryAnalytics.totalImpressions)}</p>
                <p className="text-[10px] text-muted-foreground">Total Impressions</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Country Pie Chart */}
              <Card className="bg-secondary/20 border-0">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-primary" />
                    Traffic by Country
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={countryAnalytics.pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          paddingAngle={1}
                          dataKey="value"
                          label={({ name, percentage }) => `${percentage}%`}
                          labelLine={false}
                        >
                          {countryAnalytics.pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value: number) => [formatNumber(value), "Clicks"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2 justify-center">
                    {countryAnalytics.pieData.slice(0, 6).map((entry, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]" style={{ borderColor: entry.fill }}>
                        <div className="w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: entry.fill }} />
                        {entry.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Country Bar Chart */}
              <Card className="bg-secondary/20 border-0">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-500" />
                    Clicks & CTR by Country
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={countryAnalytics.barData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={true} vertical={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                        <YAxis
                          dataKey="country"
                          type="category"
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          tickLine={false}
                          axisLine={false}
                          width={55}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "11px",
                          }}
                        />
                        <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Country Details Table */}
            <Card className="bg-secondary/20 border-0">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm">Country Performance Details</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <ScrollArea className="h-[200px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Country</TableHead>
                        <TableHead className="text-right text-xs">Clicks</TableHead>
                        <TableHead className="text-right text-xs">Impressions</TableHead>
                        <TableHead className="text-right text-xs">CTR</TableHead>
                        <TableHead className="text-right text-xs">Avg Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {countryData.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs py-2">
                            <div className="flex items-center gap-2">
                              <Globe className="w-3 h-3 text-muted-foreground" />
                              {getCountryName(row.keys[0])}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-xs py-2 font-medium">{formatNumber(row.clicks)}</TableCell>
                          <TableCell className="text-right text-xs py-2 text-muted-foreground">{formatNumber(row.impressions)}</TableCell>
                          <TableCell className="text-right text-xs py-2">
                            <span className={row.ctr > 0.05 ? "text-green-500" : "text-muted-foreground"}>
                              {(row.ctr * 100).toFixed(2)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right py-2">
                            <Badge variant={row.position <= 10 ? "default" : "secondary"} className="text-[10px]">
                              {row.position.toFixed(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Indexation Tab */}
          <TabsContent value="indexation" className="space-y-4">
            {/* Auto-Submission Settings */}
            <div className="bg-gradient-to-r from-primary/10 to-violet-500/10 rounded-xl p-4 border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Auto-Submission Settings</span>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {submissionStats.last24h} submitted today
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between bg-background/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="text-xs font-medium">Auto-Submit New Pages</p>
                      <p className="text-[10px] text-muted-foreground">Automatically submit newly created pages</p>
                    </div>
                  </div>
                  <Switch
                    checked={autoSubmitNewPages}
                    onCheckedChange={setAutoSubmitNewPages}
                  />
                </div>
                <div className="flex items-center justify-between bg-background/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-cyan-500" />
                    <div>
                      <p className="text-xs font-medium">Auto-Resubmit Updated</p>
                      <p className="text-[10px] text-muted-foreground">Resubmit pages when content changes</p>
                    </div>
                  </div>
                  <Switch
                    checked={autoSubmitEnabled}
                    onCheckedChange={setAutoSubmitEnabled}
                  />
                </div>
              </div>
            </div>

            {/* Indexation Controls */}
            <div className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs">
                  {pageData.length} pages tracked
                </Badge>
                {indexationData.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-500 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> {indexationStats.indexed} indexed
                    </span>
                    <span className="text-red-500 flex items-center gap-1">
                      <FileX className="w-3 h-3" /> {indexationStats.notIndexed} not indexed
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {autoIndexQueue.length > 0 && (
                  <Button size="sm" variant="secondary" onClick={handleAutoIndex} disabled={isAutoIndexing}>
                    {isAutoIndexing ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Indexing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 mr-1" />
                        Auto-Index ({autoIndexQueue.length})
                      </>
                    )}
                  </Button>
                )}
                <Button size="sm" onClick={fetchIndexationStatus} disabled={isLoadingIndexation}>
                  {isLoadingIndexation ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Checking ({indexationProgress}/{indexationTotal})
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Check Indexation
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Indexation Progress Timer */}
            {isLoadingIndexation && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm font-medium">Checking Indexation Status...</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {indexationProgress} of {indexationTotal} URLs checked
                    </span>
                    {estimatedTimeRemaining !== null && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        ~{estimatedTimeRemaining}s remaining
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress value={(indexationProgress / indexationTotal) * 100} className="h-2" />
                <p className="text-[10px] text-muted-foreground mt-2">
                  Inspecting each URL with Google's URL Inspection API. This may take a few minutes for larger sites.
                </p>
              </div>
            )}

            {/* Indexation Stats */}
            {indexationData.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                  <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-500" />
                  <p className="text-xl font-bold text-green-500">{indexationStats.indexed}</p>
                  <p className="text-[10px] text-muted-foreground">Indexed</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                  <FileX className="w-5 h-5 mx-auto mb-1 text-red-500" />
                  <p className="text-xl font-bold text-red-500">{indexationStats.notIndexed}</p>
                  <p className="text-[10px] text-muted-foreground">Not Indexed</p>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 text-center">
                  <RefreshCw className="w-5 h-5 mx-auto mb-1 text-cyan-500" />
                  <p className="text-xl font-bold text-cyan-500">{indexationStats.crawled}</p>
                  <p className="text-[10px] text-muted-foreground">Crawled</p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
                  <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                  <p className="text-xl font-bold text-yellow-500">{indexationStats.blocked}</p>
                  <p className="text-[10px] text-muted-foreground">Blocked</p>
                </div>
              </div>
            )}

            {/* Indexation Progress */}
            {indexationData.length > 0 && (
              <div className="bg-secondary/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Indexation Rate</span>
                  <span className="text-sm font-bold text-green-500">
                    {((indexationStats.indexed / indexationData.length) * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={(indexationStats.indexed / indexationData.length) * 100} className="h-2" />
              </div>
            )}

            {/* Submission History - Moved above Bulk URL Submission */}
            <Card className="bg-secondary/20 border-0">
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="w-4 h-4 text-cyan-500" />
                    Submission History
                    {autoSubmitEnabled && (
                      <Badge variant="outline" className="text-[9px] bg-green-500/10 text-green-400 border-green-500/30">
                        <Zap className="w-2.5 h-2.5 mr-1" />
                        Auto-Submit Active
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {submissionStats.successRate}% success rate
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {submissionStats.last24h} today
                    </Badge>
                    {submissionHistory.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[10px]"
                        onClick={() => setSubmissionHistory([])}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                {submissionHistory.length === 0 ? (
                  <div className="text-center py-6">
                    <History className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-xs text-muted-foreground">No submission history yet</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {autoSubmitEnabled ? "Auto-submissions will appear here when pages are updated" : "Enable auto-submit or manually submit URLs below"}
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[150px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">URL</TableHead>
                          <TableHead className="text-xs">Source</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissionHistory.slice(0, 25).map((item, i) => {
                          let path = item.url;
                          try {
                            path = new URL(item.url).pathname || "/";
                          } catch {}
                          return (
                            <TableRow key={i}>
                              <TableCell className="text-xs py-2 max-w-[180px] truncate" title={item.url}>
                                {path}
                              </TableCell>
                              <TableCell className="py-2">
                                <Badge variant="outline" className="text-[9px]">
                                  {(item as any).source === 'auto' ? (
                                    <>
                                      <Zap className="w-2 h-2 mr-0.5 text-amber-500" />
                                      Auto
                                    </>
                                  ) : (item as any).source === 'bulk' ? (
                                    <>
                                      <ListPlus className="w-2 h-2 mr-0.5 text-violet-500" />
                                      Bulk
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-2 h-2 mr-0.5 text-cyan-500" />
                                      Manual
                                    </>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2">
                                {item.success ? (
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                                    <CheckCircle className="w-2.5 h-2.5 mr-1" />
                                    Submitted
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
                                    <FileX className="w-2.5 h-2.5 mr-1" />
                                    Failed
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-xs py-2 text-muted-foreground">
                                {new Date(item.timestamp).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Bulk URL Submission & Sitemap Management */}
            <div className="grid grid-cols-2 gap-4">
              {/* Bulk URL Submission */}
              <Card className="bg-secondary/20 border-0">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ListPlus className="w-4 h-4 text-violet-500" />
                    Bulk URL Submission
                  </CardTitle>
                  <CardDescription className="text-xs">Submit multiple URLs for indexing at once</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-3">
                  <Textarea
                    placeholder="Enter URLs, one per line:&#10;https://example.com/page1&#10;https://example.com/page2"
                    value={bulkUrls}
                    onChange={(e) => setBulkUrls(e.target.value)}
                    className="h-24 text-xs font-mono"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {bulkUrls.split('\n').filter(u => u.trim().startsWith('http')).length} valid URLs
                    </span>
                    <Button size="sm" onClick={handleBulkSubmit} disabled={isSubmittingBulk || !bulkUrls.trim()}>
                      {isSubmittingBulk ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3 mr-1" />
                          Submit All
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Sitemap Management */}
              <Card className="bg-secondary/20 border-0">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Rss className="w-4 h-4 text-amber-500" />
                    Sitemap Management
                  </CardTitle>
                  <CardDescription className="text-xs">Submit and monitor your sitemaps</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/sitemap.xml"
                      value={newSitemapUrl}
                      onChange={(e) => setNewSitemapUrl(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Button size="sm" onClick={handleSubmitSitemap} disabled={isSubmittingSitemap || !newSitemapUrl.trim()}>
                      {isSubmittingSitemap ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Upload className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Existing Sitemaps */}
                  <ScrollArea className="h-24">
                    {isLoadingSitemaps ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : sitemaps.length > 0 ? (
                      <div className="space-y-2">
                        {sitemaps.map((sitemap, i) => (
                          <div key={i} className="flex items-center justify-between bg-background/50 rounded p-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Rss className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="text-[10px] truncate">{sitemap.path}</span>
                            </div>
                            <Badge variant={sitemap.errors ? "destructive" : "secondary"} className="text-[9px] shrink-0">
                              {sitemap.errors ? `${sitemap.errors} errors` : 'OK'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs text-muted-foreground">No sitemaps found</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Indexation Table */}
            <Card className="bg-secondary/20 border-0">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-primary" />
                  Page Indexation Status
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                {indexationData.length === 0 ? (
                  <div className="text-center py-8">
                    <FileCheck className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground mb-2">No indexation data yet</p>
                    <p className="text-xs text-muted-foreground mb-4">Click "Check Indexation" to inspect your top pages</p>
                    <Button size="sm" onClick={fetchIndexationStatus} disabled={isLoadingIndexation}>
                      {isLoadingIndexation ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check Now"}
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[250px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">URL</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Last Crawl</TableHead>
                          <TableHead className="text-xs">Robots</TableHead>
                          <TableHead className="text-xs w-16">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {indexationData.map((row, i) => {
                          let path = row.url;
                          try {
                            path = new URL(row.url).pathname || "/";
                          } catch {}
                          const isNotIndexed = row.verdict !== "PASS" && row.coverageState !== "Submitted and indexed";
                          return (
                            <TableRow key={i}>
                              <TableCell className="text-xs py-2 max-w-[180px] truncate" title={row.url}>
                                {path}
                              </TableCell>
                              <TableCell className="py-2">{getVerdictBadge(row.verdict, row.coverageState)}</TableCell>
                              <TableCell className="text-xs py-2 text-muted-foreground">
                                {row.lastCrawlTime ? (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(row.lastCrawlTime).toLocaleDateString()}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                              <TableCell className="py-2">
                                <Badge variant={row.robotsTxtState === "ALLOWED" ? "secondary" : "destructive"} className="text-[10px]">
                                  {row.robotsTxtState === "ALLOWED" ? "Allowed" : "Blocked"}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2">
                                {isNotIndexed && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleSubmitUrl(row.url)}
                                    title="Submit for indexing"
                                  >
                                    <Send className="w-3 h-3" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default GSCAdvancedReporting;
