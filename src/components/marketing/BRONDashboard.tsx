import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, Globe, Key, FileText, BarChart3, Link2, ArrowUpRight, 
  ArrowDownLeft, RefreshCw, ExternalLink, TrendingUp, ChevronDown,
  MapPin, Phone, Calendar, Package, Tag, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useBronApi, BronDomain } from "@/hooks/use-bron-api";
import { BRONKeywordsTab } from "./BRONKeywordsTab";
import { BRONDomainsTab } from "./BRONDomainsTab";
import { BRONLinksTab } from "./BRONLinksTab";
import { BRONContentTab } from "./BRONContentTab";
import { BRONSerpTab } from "./BRONSerpTab";

interface BRONDashboardProps {
  selectedDomain?: string;
}

export const BRONDashboard = ({ selectedDomain }: BRONDashboardProps) => {
  const bronApi = useBronApi();
  const [activeTab, setActiveTab] = useState("keywords");
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [domainInfo, setDomainInfo] = useState<BronDomain | null>(null);

  // Verify authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsAuthenticating(true);
      setAuthError(null);
      try {
        const isValid = await bronApi.verifyAuth();
        if (!isValid) {
          setAuthError("Unable to authenticate with BRON API. Please check your API credentials.");
        }
      } catch (err) {
        setAuthError("Failed to connect to BRON API. Please try again.");
      } finally {
        setIsAuthenticating(false);
      }
    };
    checkAuth();
  }, []);

  // Load initial data
  useEffect(() => {
    if (bronApi.isAuthenticated) {
      bronApi.fetchDomains();
    }
  }, [bronApi.isAuthenticated]);

  // Load domain-specific data when domain changes
  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const loadCore = async () => {
      if (!bronApi.isAuthenticated || !selectedDomain) return;

      // Fetch domain info first
      const info = await bronApi.fetchDomain(selectedDomain);
      if (!cancelled && info) setDomainInfo(info);

      await sleep(260);
      if (cancelled) return;
      await bronApi.fetchKeywords(selectedDomain);
      await sleep(260);
      if (cancelled) return;
      await bronApi.fetchPages(selectedDomain);
      await sleep(260);
      if (cancelled) return;
      await bronApi.fetchSerpReport(selectedDomain);
    };

    loadCore();

    return () => {
      cancelled = true;
    };
  }, [bronApi.isAuthenticated, selectedDomain]);

  // Lazy-load link reports only when the Links tab is opened
  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const loadLinks = async () => {
      if (!bronApi.isAuthenticated || !selectedDomain) return;
      if (activeTab !== "links") return;

      await bronApi.fetchLinksIn(selectedDomain);
      await sleep(260);
      if (cancelled) return;
      await bronApi.fetchLinksOut(selectedDomain);
    };

    loadLinks();
    return () => {
      cancelled = true;
    };
  }, [bronApi.isAuthenticated, selectedDomain, activeTab]);

  if (isAuthenticating) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 blur-xl opacity-50 animate-pulse" />
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        </div>
        <p className="text-muted-foreground text-sm">Connecting to BRON API...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-destructive">Connection Failed</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{authError}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Domain Profile Section */}
      {selectedDomain && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Domain Preview & Info Card */}
          <Card className="lg:col-span-2 overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                {/* Website Preview */}
                <div className="w-full md:w-64 flex-shrink-0 p-4">
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border/50 bg-muted/30">
                    <img 
                      src={`https://image.thum.io/get/width/400/crop/300/${selectedDomain}`}
                      alt={`${selectedDomain} preview`}
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${selectedDomain}&sz=128`;
                        e.currentTarget.className = "w-16 h-16 object-contain mx-auto mt-8";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full text-xs bg-primary/90 hover:bg-primary text-primary-foreground"
                        onClick={() => window.open(`https://${selectedDomain}`, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Visit Site
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Domain Info */}
                <div className="flex-1 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${selectedDomain}&sz=32`}
                      alt="favicon"
                      className="w-5 h-5"
                    />
                    <h3 className="font-semibold text-lg">{selectedDomain}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground min-w-[100px]">Domain Status:</span>
                      <Badge variant={domainInfo?.status === 'active' || !domainInfo?.deleted ? 'default' : 'secondary'} className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        LIVE
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground min-w-[100px]">Keywords:</span>
                      <span className="font-medium">{bronApi.keywords.length}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground min-w-[100px]">Content Pages:</span>
                      <span className="font-medium">{bronApi.pages.length}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground min-w-[100px]">SERP Reports:</span>
                      <span className="font-medium">{bronApi.serpReports.length}</span>
                    </div>

                    {domainInfo?.created_at && (
                      <div className="flex items-center gap-2 col-span-full">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Added:</span>
                        <span className="font-medium">{new Date(domainInfo.created_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard 
              icon={Key} 
              label="Keywords"
              value={bronApi.keywords.length}
              color="violet"
            />
            <StatCard 
              icon={FileText} 
              label="Pages"
              value={bronApi.pages.length}
              color="blue"
            />
            <StatCard 
              icon={ArrowDownLeft} 
              label="Inbound"
              value={bronApi.linksIn.length}
              color="emerald"
            />
            <StatCard 
              icon={ArrowUpRight} 
              label="Outbound"
              value={bronApi.linksOut.length}
              color="amber"
            />
          </div>
        </div>
      )}

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard
          icon={BarChart3}
          title="Keyword Content"
          description="Manage your target keywords and edit content to optimize search visibility."
          color="cyan"
          onClick={() => setActiveTab("keywords")}
          active={activeTab === "keywords"}
        />
        <ActionCard
          icon={Link2}
          title="Citation Links"
          description="Build quality backlinks and manage citations to boost your site's authority."
          color="violet"
          onClick={() => setActiveTab("links")}
          active={activeTab === "links"}
        />
        <ActionCard
          icon={TrendingUp}
          title="Ranking/Analytics"
          description="Track search engine rankings and monitor your campaign progress."
          color="primary"
          onClick={() => setActiveTab("serp")}
          active={activeTab === "serp"}
        />
      </div>

      {/* Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">

        <AnimatePresence mode="wait">
          <TabsContent value="domains" className="mt-0">
            <BRONDomainsTab 
              domains={bronApi.domains}
              isLoading={bronApi.isLoading}
              onRefresh={bronApi.fetchDomains}
              onUpdate={bronApi.updateDomain}
              onDelete={bronApi.deleteDomain}
              onRestore={bronApi.restoreDomain}
            />
          </TabsContent>

          <TabsContent value="keywords" className="mt-0">
            <BRONKeywordsTab 
              keywords={bronApi.keywords}
              serpReports={bronApi.serpReports}
              selectedDomain={selectedDomain}
              isLoading={bronApi.isLoading}
              onRefresh={() => bronApi.fetchKeywords(selectedDomain)}
              onAdd={bronApi.addKeyword}
              onUpdate={bronApi.updateKeyword}
              onDelete={bronApi.deleteKeyword}
              onRestore={bronApi.restoreKeyword}
            />
          </TabsContent>

          <TabsContent value="content" className="mt-0">
            <BRONContentTab 
              pages={bronApi.pages}
              selectedDomain={selectedDomain}
              isLoading={bronApi.isLoading}
              onRefresh={() => selectedDomain && bronApi.fetchPages(selectedDomain)}
            />
          </TabsContent>

          <TabsContent value="serp" className="mt-0">
            <BRONSerpTab 
              serpReports={bronApi.serpReports}
              selectedDomain={selectedDomain}
              isLoading={bronApi.isLoading}
              onRefresh={() => selectedDomain && bronApi.fetchSerpReport(selectedDomain)}
            />
          </TabsContent>

          <TabsContent value="links" className="mt-0">
            <BRONLinksTab 
              linksIn={bronApi.linksIn}
              linksOut={bronApi.linksOut}
              selectedDomain={selectedDomain}
              isLoading={bronApi.isLoading}
              onRefreshIn={() => selectedDomain && bronApi.fetchLinksIn(selectedDomain)}
              onRefreshOut={() => selectedDomain && bronApi.fetchLinksOut(selectedDomain)}
            />
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  );
};

// Stat Card Component
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: "cyan" | "violet" | "emerald" | "amber" | "blue" | "primary";
}

const StatCard = ({ icon: Icon, label, value, color }: StatCardProps) => {
  const colorClasses: Record<string, string> = {
    cyan: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400",
    violet: "from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-400",
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400",
    amber: "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400",
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400",
    primary: "from-primary/20 to-primary/10 border-primary/30 text-primary",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-3 ${colorClasses[color]}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold mt-0.5">{value.toLocaleString()}</p>
        </div>
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
};

// Action Card Component
interface ActionCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: "cyan" | "violet" | "primary";
  onClick: () => void;
  active?: boolean;
}

const ActionCard = ({ icon: Icon, title, description, color, onClick, active }: ActionCardProps) => {
  const colorClasses: Record<string, { border: string; icon: string; glow: string }> = {
    cyan: { 
      border: active ? "border-cyan-500" : "border-cyan-500/30 hover:border-cyan-500/60", 
      icon: "from-cyan-500/30 to-cyan-600/20 text-cyan-400",
      glow: "bg-cyan-500/20"
    },
    violet: { 
      border: active ? "border-violet-500" : "border-violet-500/30 hover:border-violet-500/60", 
      icon: "from-violet-500/30 to-violet-600/20 text-violet-400",
      glow: "bg-violet-500/20"
    },
    primary: { 
      border: active ? "border-primary" : "border-primary/30 hover:border-primary/60", 
      icon: "from-primary/30 to-primary/20 text-primary",
      glow: "bg-primary/20"
    },
  };

  const styles = colorClasses[color];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative cursor-pointer rounded-xl border-2 ${styles.border} bg-card/50 backdrop-blur-sm p-4 transition-all duration-200`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${styles.icon} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
      {active && (
        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/3 h-1 rounded-full ${styles.glow}`} />
      )}
    </motion.div>
  );
};

export default BRONDashboard;
