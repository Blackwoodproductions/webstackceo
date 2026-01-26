import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, Users, FileText, Settings, LogOut, 
  CheckCircle, XCircle, Clock, Star, Award, TrendingUp,
  Plus, Edit, Trash2, Eye, Search, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import AdminApplicationsTab from "@/components/admin/AdminApplicationsTab";
import AdminPartnersTab from "@/components/admin/AdminPartnersTab";
import AdminDirectoryTab from "@/components/admin/AdminDirectoryTab";
import InteractiveGrid from "@/components/ui/interactive-grid";
import { VIDashboardEffects } from "@/components/ui/vi-dashboard-effects";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPartners: 0,
    pendingApplications: 0,
    pendingDirectoryListings: 0,
    sponsoredPartners: 0,
    totalCategories: 0,
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
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (data) {
      setIsAdmin(true);
      fetchStats();
    } else {
      setIsAdmin(false);
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

  return (
    <div className="min-h-screen bg-background relative animate-fade-in">
      {/* VI Dashboard Background Effects */}
      <VIDashboardEffects />
      <InteractiveGrid className="fixed inset-0 opacity-40 pointer-events-none z-0" glowRadius={120} glowIntensity={0.4} />
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
                <span className="text-white font-bold text-xl">W</span>
              </div>
            </a>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="heroOutline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Partners", value: stats.totalPartners, icon: Users, color: "text-cyan-400" },
            { label: "Pending Applications", value: stats.pendingApplications, icon: Clock, color: "text-yellow-400" },
            { label: "Directory Pending", value: stats.pendingDirectoryListings, icon: Building2, color: "text-orange-400" },
            { label: "Sponsored Partners", value: stats.sponsoredPartners, icon: Award, color: "text-violet-400" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Applications
              {stats.pendingApplications > 0 && (
                <Badge variant="destructive" className="ml-1">
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
                <Badge variant="destructive" className="ml-1">
                  {stats.pendingDirectoryListings}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <AdminApplicationsTab onUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="partners">
            <AdminPartnersTab onUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="directory">
            <AdminDirectoryTab onUpdate={fetchStats} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
