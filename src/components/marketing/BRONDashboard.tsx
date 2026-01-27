import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, Globe, Key, FileText, BarChart3, Link2, ArrowUpRight, 
  ArrowDownLeft, RefreshCw, Plus, Search, Check, X, Edit2, Trash2,
  RotateCcw, ExternalLink, TrendingUp, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBronApi, BronKeyword, BronDomain } from "@/hooks/use-bron-api";
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
  const [activeTab, setActiveTab] = useState("domains");
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

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
    if (bronApi.isAuthenticated && selectedDomain) {
      bronApi.fetchKeywords(selectedDomain);
      bronApi.fetchPages(selectedDomain);
      bronApi.fetchSerpReport(selectedDomain);
      bronApi.fetchLinksIn(selectedDomain);
      bronApi.fetchLinksOut(selectedDomain);
    }
  }, [bronApi.isAuthenticated, selectedDomain]);

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
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={Globe} 
          label="Domains" 
          value={bronApi.domains.length}
          color="cyan"
        />
        <StatCard 
          icon={Key} 
          label="Keywords" 
          value={bronApi.keywords.length}
          color="violet"
        />
        <StatCard 
          icon={ArrowDownLeft} 
          label="Inbound Links" 
          value={bronApi.linksIn.length}
          color="emerald"
        />
        <StatCard 
          icon={ArrowUpRight} 
          label="Outbound Links" 
          value={bronApi.linksOut.length}
          color="amber"
        />
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 gap-2 bg-secondary/30 p-1">
          <TabsTrigger value="domains" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Globe className="w-4 h-4 mr-2" />
            Domains
          </TabsTrigger>
          <TabsTrigger value="keywords" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
            <Key className="w-4 h-4 mr-2" />
            Keywords
          </TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
            <FileText className="w-4 h-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="serp" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
            <BarChart3 className="w-4 h-4 mr-2" />
            SERP
          </TabsTrigger>
          <TabsTrigger value="links" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Link2 className="w-4 h-4 mr-2" />
            Links
          </TabsTrigger>
        </TabsList>

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
  color: "cyan" | "violet" | "emerald" | "amber";
}

const StatCard = ({ icon: Icon, label, value, color }: StatCardProps) => {
  const colorClasses = {
    cyan: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400",
    violet: "from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-400",
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400",
    amber: "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 ${colorClasses[color]}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {/* Decorative glow */}
      <div className={`absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br ${colorClasses[color]} blur-2xl opacity-50`} />
    </motion.div>
  );
};

export default BRONDashboard;
