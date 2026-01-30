import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, Users, FileText, Settings, LogOut, 
  CheckCircle, XCircle, Clock, Star, Award, TrendingUp,
  Plus, Edit, Trash2, Eye, Search, Building2, Shield, Crown,
  BarChart3, Activity, Zap, Globe, ArrowLeft, MousePointer,
  Mail, UserCheck, DollarSign, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import AdminApplicationsTab from "@/components/admin/AdminApplicationsTab";
import AdminPartnersTab from "@/components/admin/AdminPartnersTab";
import AdminDirectoryTab from "@/components/admin/AdminDirectoryTab";
import { SuperAdminPanel } from "@/components/admin/SuperAdminPanel";
import { SystemHealthPanel } from "@/components/admin/SystemHealthPanel";
import InteractiveGrid from "@/components/ui/interactive-grid";
import { VIDashboardEffects } from "@/components/ui/vi-dashboard-effects";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPartners: 0,
    pendingApplications: 0,
    pendingDirectoryListings: 0,
    sponsoredPartners: 0,
    totalCategories: 0,
  });
  
  // Site-wide analytics stats
  const [siteStats, setSiteStats] = useState({
    totalVisitors: 0,
    totalPageViews: 0,
    totalLeads: 0,
    totalUsers: 0,
    activeToday: 0,
    leadsThisMonth: 0,
    conversionRate: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer the admin check
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    // Check for admin role
    const { data: adminData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    // Check for super_admin role
    const { data: superAdminData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .maybeSingle();

    const hasAdmin = !!adminData || !!superAdminData;
    const hasSuperAdmin = !!superAdminData;

    setIsAdmin(hasAdmin);
    setIsSuperAdmin(hasSuperAdmin);

    if (hasAdmin) {
      fetchStats();
      fetchSiteStats();
    }
    setIsLoading(false);
  };

  const fetchStats = async () => {
    const [partnersRes, applicationsRes, categoriesRes, directoryRes] = await Promise.all([
      supabase.from("marketplace_partners").select("id, is_sponsored", { count: "exact" }),
      supabase.from("marketplace_applications").select("id", { count: "exact" }).eq("status", "pending"),
      supabase.from("marketplace_categories").select("id", { count: "exact" }),
      supabase.from("directory_listings").select("id", { count: "exact" }).eq("status", "pending"),
    ]);

    const sponsoredCount = partnersRes.data?.filter(p => p.is_sponsored).length ?? 0;

    setStats({
      totalPartners: partnersRes.count ?? 0,
      pendingApplications: applicationsRes.count ?? 0,
      pendingDirectoryListings: directoryRes.count ?? 0,
      sponsoredPartners: sponsoredCount,
      totalCategories: categoriesRes.count ?? 0,
    });
  };
  
  const fetchSiteStats = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const [
        visitorsRes,
        pageViewsRes,
        leadsRes,
        usersRes,
        activeTodayRes,
        leadsMonthRes,
        closedLeadsRes,
      ] = await Promise.all([
        supabase.from("visitor_sessions").select("id", { count: "exact", head: true }),
        supabase.from("page_views").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("visitor_sessions").select("id", { count: "exact", head: true }).gte("last_activity_at", todayStart),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", monthStart),
        supabase.from("leads").select("closed_amount").eq("status", "closed").not("closed_amount", "is", null),
      ]);
      
      const totalRevenue = closedLeadsRes.data?.reduce((sum, l) => sum + (l.closed_amount || 0), 0) || 0;
      const totalVisitors = visitorsRes.count || 0;
      const totalLeads = leadsRes.count || 0;
      const conversionRate = totalVisitors > 0 ? ((totalLeads / totalVisitors) * 100) : 0;
      
      setSiteStats({
        totalVisitors,
        totalPageViews: pageViewsRes.count || 0,
        totalLeads,
        totalUsers: usersRes.count || 0,
        activeToday: activeTodayRes.count || 0,
        leadsThisMonth: leadsMonthRes.count || 0,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching site stats:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have admin privileges. Contact the administrator to request access.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="heroOutline" onClick={() => navigate("/")}>
              Go Home
            </Button>
            <Button variant="hero" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const initialTab = (() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab === 'super-admin' && isSuperAdmin) return 'super-admin';
    return 'overview';
  })();

  return (
    <div className="min-h-screen bg-background relative animate-fade-in">
      {/* VI Dashboard Background Effects */}
      <VIDashboardEffects />
      <InteractiveGrid className="fixed inset-0 opacity-40 pointer-events-none z-0" glowRadius={120} glowIntensity={0.4} />
      
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-4">
            {/* Back to Dashboard */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/dashboard")}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Button>
            
            <div className="w-px h-6 bg-border/50" />
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-primary to-violet-500 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-primary to-violet-500 flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-primary to-violet-400 bg-clip-text text-transparent">
                  Admin Console
                </h1>
                <p className="text-[10px] text-muted-foreground">{user.email}</p>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                <Crown className="w-3 h-3 mr-1" />
                Super Admin
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-7xl relative z-10">
        {/* Main Content */}
        <Tabs defaultValue={initialTab} className="space-y-6">
          <TabsList className={`grid w-full ${isSuperAdmin ? 'grid-cols-6' : 'grid-cols-5'} lg:w-auto lg:inline-grid bg-background/50 backdrop-blur-sm border border-border/50`}>
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-violet-500/20">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-green-500/20">
              <Activity className="w-4 h-4" />
              System Health
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Applications
              {stats.pendingApplications > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px] px-1.5">
                  {stats.pendingApplications}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="partners" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Partners
            </TabsTrigger>
            <TabsTrigger value="directory" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Directory
              {stats.pendingDirectoryListings > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px] px-1.5">
                  {stats.pendingDirectoryListings}
                </Badge>
              )}
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="super-admin" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-orange-500/20">
                <Crown className="w-4 h-4 text-amber-400" />
                Super Admin
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab - Site-wide Metrics */}
          <TabsContent value="overview" className="space-y-6">
            {/* Hero Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { 
                  label: "Total Visitors", 
                  value: siteStats.totalVisitors.toLocaleString(), 
                  icon: Eye, 
                  gradient: "from-cyan-500/20 to-blue-500/20",
                  borderColor: "border-cyan-500/30",
                  iconColor: "text-cyan-400"
                },
                { 
                  label: "Page Views", 
                  value: siteStats.totalPageViews.toLocaleString(), 
                  icon: MousePointer, 
                  gradient: "from-violet-500/20 to-purple-500/20",
                  borderColor: "border-violet-500/30",
                  iconColor: "text-violet-400"
                },
                { 
                  label: "Total Leads", 
                  value: siteStats.totalLeads.toLocaleString(), 
                  icon: Mail, 
                  gradient: "from-emerald-500/20 to-green-500/20",
                  borderColor: "border-emerald-500/30",
                  iconColor: "text-emerald-400"
                },
                { 
                  label: "Registered Users", 
                  value: siteStats.totalUsers.toLocaleString(), 
                  icon: UserCheck, 
                  gradient: "from-amber-500/20 to-orange-500/20",
                  borderColor: "border-amber-500/30",
                  iconColor: "text-amber-400"
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} border ${stat.borderColor} backdrop-blur-sm`}>
                    {/* Glow effect */}
                    <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${stat.gradient} blur-2xl opacity-50`} />
                    <CardContent className="pt-6 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-background/50 backdrop-blur-sm flex items-center justify-center ${stat.iconColor} shadow-lg`}>
                          <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { 
                  label: "Active Today", 
                  value: siteStats.activeToday.toString(), 
                  icon: Activity, 
                  color: "text-green-400",
                  bg: "bg-green-500/10 border-green-500/20"
                },
                { 
                  label: "Leads This Month", 
                  value: siteStats.leadsThisMonth.toString(), 
                  icon: Target, 
                  color: "text-blue-400",
                  bg: "bg-blue-500/10 border-blue-500/20"
                },
                { 
                  label: "Conversion Rate", 
                  value: `${siteStats.conversionRate}%`, 
                  icon: TrendingUp, 
                  color: "text-violet-400",
                  bg: "bg-violet-500/10 border-violet-500/20"
                },
                { 
                  label: "Total Revenue", 
                  value: `$${siteStats.totalRevenue.toLocaleString()}`, 
                  icon: DollarSign, 
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10 border-emerald-500/20"
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Card className={`${stat.bg} border backdrop-blur-sm`}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center ${stat.color}`}>
                          <stat.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xl font-bold">{stat.value}</p>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Partner Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Partner & Directory Stats
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Partners", value: stats.totalPartners, icon: Users, color: "text-cyan-400" },
                  { label: "Pending Applications", value: stats.pendingApplications, icon: Clock, color: "text-yellow-400" },
                  { label: "Directory Pending", value: stats.pendingDirectoryListings, icon: Building2, color: "text-orange-400" },
                  { label: "Sponsored Partners", value: stats.sponsoredPartners, icon: Award, color: "text-violet-400" },
                ].map((stat) => (
                  <Card key={stat.label} className="bg-background/50 border-border/50 backdrop-blur-sm">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center ${stat.color}`}>
                          <stat.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="health">
            <SystemHealthPanel />
          </TabsContent>

          <TabsContent value="applications">
            <AdminApplicationsTab onUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="partners">
            <AdminPartnersTab onUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="directory">
            <AdminDirectoryTab onUpdate={fetchStats} />
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="super-admin">
              <SuperAdminPanel />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;