import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, FileText, LogOut, CheckCircle,
  XCircle, Clock, Award, TrendingUp,
  Plus, Eye, Search, Building2, Shield, Crown,
  Activity, Globe, ArrowLeft, MousePointer,
  Mail, UserCheck, DollarSign, Target, RefreshCw, X, Check,
  Cpu, Gauge, BarChart2, PieChart, Layers, Sparkles, Signal,
  ArrowUpRight, ArrowDownRight, Percent, Timer, Zap, MessageSquare, Bot
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
import { SystemHealthPanel } from "@/components/admin/SystemHealthPanel";
import AdminFeedbackTab from "@/components/admin/AdminFeedbackTab";
import AdminAIUsageTab from "@/components/admin/AdminAIUsageTab";
import AdminCROTab from "@/components/admin/AdminCROTab";
import AdminChangelogTab from "@/components/admin/AdminChangelogTab";
import InteractiveGrid from "@/components/ui/interactive-grid";
import { VIDashboardEffects } from "@/components/ui/vi-dashboard-effects";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: string[];
}

interface WhiteLabelSetting {
  id: string;
  user_id: string;
  logo_url: string | null;
  company_name: string | null;
  is_active: boolean;
  subscription_status: string;
  subscription_start: string | null;
  subscription_end: string | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

// Animated circular dial component
const CommandDial = ({ 
  value, 
  max, 
  label, 
  color, 
  icon: Icon,
  size = 120 
}: { 
  value: number; 
  max: number; 
  label: string; 
  color: string;
  icon: any;
  size?: number;
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background ring */}
        <svg className="absolute inset-0" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-secondary/30"
          />
        </svg>
        
        {/* Progress ring */}
        <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 10px ${color}50)` }}
          />
        </svg>
        
        {/* Inner glow */}
        <div 
          className="absolute inset-4 rounded-full"
          style={{ 
            background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
            boxShadow: `inset 0 0 30px ${color}20`
          }}
        />
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-5 h-5 mb-1" style={{ color }} />
          <span className="text-2xl font-bold" style={{ color }}>{value.toLocaleString()}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-2 text-center">{label}</span>
    </div>
  );
};

// Holographic stat card
const HoloStatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  gradient, 
  delay = 0 
}: { 
  label: string; 
  value: string | number; 
  icon: any; 
  gradient: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, duration: 0.5 }}
    className="relative group"
  >
    <div className={`absolute -inset-0.5 ${gradient} rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity`} />
    <Card className="relative bg-background/80 backdrop-blur-xl border-0 overflow-hidden">
      {/* Scanline effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />
      
      <CardContent className="pt-5 pb-4 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold tracking-tight">{typeof value === 'number' ? value.toLocaleString() : value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const Admin = () => {
  const navigate = useNavigate();
  const { toast: toastNotify } = useToast();
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
    // Enhanced metrics
    avgSessionDuration: 0,
    bounceRate: 0,
    topPages: [] as { path: string; views: number }[],
    leadsByStage: { new: 0, qualified: 0, engaged: 0, closed: 0 },
    dailyVisitors: [] as { date: string; count: number }[],
    recentLeads: [] as { email: string; source: string; created_at: string }[],
  });

  // Super admin specific state
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [whiteLabelSettings, setWhiteLabelSettings] = useState<WhiteLabelSetting[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'super_admin' | 'white_label_admin'>('white_label_admin');
  const [companyName, setCompanyName] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    );

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
    const { data: adminData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

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
      if (hasSuperAdmin) {
        fetchUsers();
        fetchWhiteLabelSettings();
      }
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
      const weekAgo = subDays(now, 7).toISOString();
      
      const [
        visitorsRes,
        pageViewsRes,
        leadsRes,
        usersRes,
        activeTodayRes,
        leadsMonthRes,
        closedLeadsRes,
        topPagesRes,
        leadsByStatusRes,
        dailyVisitorsRes,
        recentLeadsRes,
      ] = await Promise.all([
        supabase.from("visitor_sessions").select("id", { count: "exact", head: true }),
        supabase.from("page_views").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("visitor_sessions").select("id", { count: "exact", head: true }).gte("last_activity_at", todayStart),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", monthStart),
        supabase.from("leads").select("closed_amount").eq("status", "closed").not("closed_amount", "is", null),
        supabase.from("page_views").select("page_path").limit(500),
        supabase.from("leads").select("funnel_stage, status"),
        supabase.from("visitor_sessions").select("started_at").gte("started_at", weekAgo),
        supabase.from("leads").select("email, source_page, created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      
      const totalRevenue = closedLeadsRes.data?.reduce((sum, l) => sum + (l.closed_amount || 0), 0) || 0;
      const totalVisitors = visitorsRes.count || 0;
      const totalLeads = leadsRes.count || 0;
      const conversionRate = totalVisitors > 0 ? ((totalLeads / totalVisitors) * 100) : 0;
      
      // Calculate top pages
      const pageCounts: Record<string, number> = {};
      (topPagesRes.data || []).forEach(pv => {
        const path = pv.page_path || '/';
        pageCounts[path] = (pageCounts[path] || 0) + 1;
      });
      const topPages = Object.entries(pageCounts)
        .map(([path, views]) => ({ path, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);
      
      // Calculate leads by stage
      const leadsByStage = { new: 0, qualified: 0, engaged: 0, closed: 0 };
      (leadsByStatusRes.data || []).forEach(lead => {
        const stage = lead.funnel_stage || 'new';
        if (stage === 'qualified') leadsByStage.qualified++;
        else if (stage === 'engaged') leadsByStage.engaged++;
        else if (lead.status === 'closed') leadsByStage.closed++;
        else leadsByStage.new++;
      });
      
      // Calculate daily visitors for last 7 days
      const dailyMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(now, i), 'MMM d');
        dailyMap[date] = 0;
      }
      (dailyVisitorsRes.data || []).forEach(v => {
        const date = format(new Date(v.started_at), 'MMM d');
        if (dailyMap[date] !== undefined) {
          dailyMap[date]++;
        }
      });
      const dailyVisitors = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));
      
      // Format recent leads
      const recentLeads = (recentLeadsRes.data || []).map(l => ({
        email: l.email || 'Unknown',
        source: l.source_page || 'Direct',
        created_at: l.created_at,
      }));
      
      setSiteStats({
        totalVisitors,
        totalPageViews: pageViewsRes.count || 0,
        totalLeads,
        totalUsers: usersRes.count || 0,
        activeToday: activeTodayRes.count || 0,
        leadsThisMonth: leadsMonthRes.count || 0,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalRevenue,
        avgSessionDuration: 0, // Would need time_on_page aggregation
        bounceRate: 0, // Would need single-page session calculation
        topPages,
        leadsByStage,
        dailyVisitors,
        recentLeads,
      });
    } catch (error) {
      console.error("Error fetching site stats:", error);
    }
  };

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, avatar_url, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => ({
        id: profile.user_id,
        email: profile.email || '',
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        roles: (roles || [])
          .filter(r => r.user_id === profile.user_id)
          .map(r => r.role),
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchWhiteLabelSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('white_label_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedSettings = await Promise.all(
        (data || []).map(async (setting) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('user_id', setting.user_id)
            .single();
          
          return {
            ...setting,
            user_email: profile?.email,
            user_name: profile?.full_name,
          };
        })
      );

      setWhiteLabelSettings(enrichedSettings);
    } catch (error) {
      console.error('Error fetching white label settings:', error);
    }
  }, []);

  const handlePromoteUser = async () => {
    if (!selectedUser) return;
    setProcessingAction(true);

    try {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.id,
          role: selectedRole as 'admin' | 'moderator' | 'user' | 'super_admin' | 'white_label_admin',
        });

      if (roleError) throw roleError;

      if (selectedRole === 'white_label_admin') {
        const { error: settingsError } = await supabase
          .from('white_label_settings')
          .insert({
            user_id: selectedUser.id,
            company_name: companyName || null,
            subscription_status: 'trial',
            subscription_start: new Date().toISOString(),
            subscription_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          });

        if (settingsError) throw settingsError;
      }

      toast.success(`Successfully promoted ${selectedUser.email} to ${selectedRole.replace('_', ' ')}`);
      setPromoteDialogOpen(false);
      setSelectedUser(null);
      setCompanyName('');
      fetchUsers();
      fetchWhiteLabelSettings();
    } catch (error) {
      console.error('Error promoting user:', error);
      toast.error('Failed to promote user');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRevokeRole = async (userId: string, role: string) => {
    if (!confirm(`Are you sure you want to revoke the ${role.replace('_', ' ')} role?`)) return;
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as 'admin' | 'moderator' | 'user' | 'super_admin' | 'white_label_admin');

      if (error) throw error;

      if (role === 'white_label_admin') {
        await supabase
          .from('white_label_settings')
          .update({ is_active: false })
          .eq('user_id', userId);
      }

      toast.success('Role revoked successfully');
      fetchUsers();
      fetchWhiteLabelSettings();
    } catch (error) {
      console.error('Error revoking role:', error);
      toast.error('Failed to revoke role');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0';
      case 'white_label_admin': return 'bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0';
      case 'admin': return 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'trial': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Trial</Badge>;
      case 'expired': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Expired</Badge>;
      case 'cancelled': return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-primary to-violet-500 rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 via-primary to-violet-500 flex items-center justify-center">
              <Cpu className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-muted-foreground">Initializing Command Center...</p>
        </motion.div>
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
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/visitor-intelligence-dashboard")}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Button>
            
            <div className="w-px h-6 bg-border/50" />
            
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-primary to-violet-500 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-primary to-violet-500 flex items-center justify-center shadow-lg">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-primary to-violet-400 bg-clip-text text-transparent">
                  Command Center
                </h1>
                <p className="text-[10px] text-muted-foreground">{user.email}</p>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg shadow-amber-500/20">
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
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-9 lg:w-auto lg:inline-grid bg-background/50 backdrop-blur-sm border border-border/50">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-violet-500/20">
              <Gauge className="w-4 h-4" />
              <span className="hidden sm:inline">Command</span>
            </TabsTrigger>
            <TabsTrigger value="changelog" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-cyan-500/20">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Changelog</span>
            </TabsTrigger>
            <TabsTrigger value="cro" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500/20 data-[state=active]:to-pink-500/20">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">CRO</span>
            </TabsTrigger>
            <TabsTrigger value="ai-usage" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500/20 data-[state=active]:to-purple-500/20">
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">AI Usage</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-green-500/20">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Systems</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-cyan-500/20">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Feedback</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-orange-500/20">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="partners" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Partners</span>
              {(stats.pendingApplications + stats.pendingDirectoryListings) > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px] px-1.5">
                  {stats.pendingApplications + stats.pendingDirectoryListings}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="directory" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Directory</span>
            </TabsTrigger>
          </TabsList>

          {/* Command Center Overview */}
          <TabsContent value="overview" className="space-y-8">
            {/* Hero Command Dials */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/10 via-primary/5 to-violet-500/10 rounded-3xl blur-xl" />
              <Card className="relative bg-background/60 backdrop-blur-xl border-primary/20 overflow-hidden">
                {/* Animated scan line */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <motion.div
                    className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
                    initial={{ top: "-10%" }}
                    animate={{ top: "110%" }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                
                {/* Grid pattern */}
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                  }}
                />
                
                <CardContent className="py-8 relative z-10">
                  <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                    <CommandDial 
                      value={siteStats.totalVisitors} 
                      max={Math.max(siteStats.totalVisitors * 1.5, 1000)} 
                      label="Total Visitors" 
                      color="#06b6d4" 
                      icon={Eye}
                    />
                    <CommandDial 
                      value={siteStats.totalPageViews} 
                      max={Math.max(siteStats.totalPageViews * 1.5, 5000)} 
                      label="Page Views" 
                      color="#8b5cf6" 
                      icon={MousePointer}
                    />
                    <CommandDial 
                      value={siteStats.totalLeads} 
                      max={Math.max(siteStats.totalLeads * 1.5, 100)} 
                      label="Total Leads" 
                      color="#10b981" 
                      icon={Mail}
                    />
                    <CommandDial 
                      value={siteStats.totalUsers} 
                      max={Math.max(siteStats.totalUsers * 1.5, 50)} 
                      label="Registered Users" 
                      color="#f59e0b" 
                      icon={UserCheck}
                    />
                    {isSuperAdmin && (
                      <CommandDial 
                        value={users.filter(u => u.roles.includes('super_admin')).length} 
                        max={10} 
                        label="Super Admins" 
                        color="#ef4444" 
                        icon={Crown}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <HoloStatCard 
                label="Active Today" 
                value={siteStats.activeToday} 
                icon={Activity} 
                gradient="bg-gradient-to-br from-green-500 to-emerald-600"
                delay={0.1}
              />
              <HoloStatCard 
                label="Leads This Month" 
                value={siteStats.leadsThisMonth} 
                icon={Target} 
                gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
                delay={0.2}
              />
              <HoloStatCard 
                label="Conversion Rate" 
                value={`${siteStats.conversionRate}%`} 
                icon={TrendingUp} 
                gradient="bg-gradient-to-br from-violet-500 to-purple-600"
                delay={0.3}
              />
              <HoloStatCard 
                label="Total Revenue" 
                value={`$${siteStats.totalRevenue.toLocaleString()}`} 
                icon={DollarSign} 
                gradient="bg-gradient-to-br from-emerald-500 to-green-600"
                delay={0.4}
              />
            </div>

            {/* Partner & Directory Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { label: "Total Partners", value: stats.totalPartners, icon: Users, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
                { label: "Pending Apps", value: stats.pendingApplications, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                { label: "Directory Pending", value: stats.pendingDirectoryListings, icon: Building2, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
                { label: "Sponsored", value: stats.sponsoredPartners, icon: Award, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
              ].map((stat) => (
                <Card key={stat.label} className={`${stat.bg} border backdrop-blur-sm`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center ${stat.color}`}>
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
            </motion.div>

            {/* Advanced Analytics Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* 7-Day Traffic Trend Chart */}
              <Card className="relative overflow-hidden bg-background/60 backdrop-blur-xl border-cyan-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5" />
                <CardContent className="pt-6 relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                        <BarChart2 className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Traffic Trend</h3>
                        <p className="text-xs text-muted-foreground">Last 7 days</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                      <Signal className="w-3 h-3 mr-1" />
                      Live
                    </Badge>
                  </div>
                  
                  {/* Bar Chart */}
                  <div className="flex items-end gap-2 h-32">
                    {siteStats.dailyVisitors.map((day, i) => {
                      const maxCount = Math.max(...siteStats.dailyVisitors.map(d => d.count), 1);
                      const height = (day.count / maxCount) * 100;
                      
                      return (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                          <motion.div
                            className="w-full rounded-t-lg bg-gradient-to-t from-cyan-500 to-cyan-400 relative group"
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(height, 5)}%` }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-background/90 border border-border px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {day.count} visitors
                            </div>
                          </motion.div>
                          <span className="text-[10px] text-muted-foreground">{day.date.split(' ')[1]}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Lead Funnel */}
              <Card className="relative overflow-hidden bg-background/60 backdrop-blur-xl border-violet-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5" />
                <CardContent className="pt-6 relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Lead Funnel</h3>
                        <p className="text-xs text-muted-foreground">Conversion stages</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Funnel Visualization */}
                  <div className="space-y-2">
                    {[
                      { label: "New Leads", value: siteStats.leadsByStage.new, color: "from-violet-500 to-violet-400", width: "100%" },
                      { label: "Qualified", value: siteStats.leadsByStage.qualified, color: "from-purple-500 to-purple-400", width: "75%" },
                      { label: "Engaged", value: siteStats.leadsByStage.engaged, color: "from-fuchsia-500 to-fuchsia-400", width: "50%" },
                      { label: "Closed", value: siteStats.leadsByStage.closed, color: "from-pink-500 to-pink-400", width: "25%" },
                    ].map((stage, i) => (
                      <motion.div
                        key={stage.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <span className="text-xs text-muted-foreground w-16">{stage.label}</span>
                        <div className="flex-1 relative h-8">
                          <motion.div
                            className={`h-full rounded-r-lg bg-gradient-to-r ${stage.color} flex items-center justify-end pr-3`}
                            initial={{ width: 0 }}
                            animate={{ width: stage.width }}
                            transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
                          >
                            <span className="text-sm font-bold text-white">{stage.value}</span>
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Bottom Row: Top Pages & Recent Leads */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Top Pages */}
              <Card className="relative overflow-hidden bg-background/60 backdrop-blur-xl border-emerald-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-green-500/5" />
                <CardContent className="pt-6 relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <PieChart className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Top Pages</h3>
                      <p className="text-xs text-muted-foreground">Most viewed</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {siteStats.topPages.length > 0 ? siteStats.topPages.map((page, i) => {
                      const maxViews = Math.max(...siteStats.topPages.map(p => p.views), 1);
                      const percent = (page.views / maxViews) * 100;
                      
                      return (
                        <motion.div 
                          key={page.path}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + i * 0.05 }}
                          className="flex items-center gap-3"
                        >
                          <span className="text-xs font-mono text-muted-foreground truncate w-32">{page.path}</span>
                          <div className="flex-1 h-2 bg-muted/20 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ delay: 0.9 + i * 0.05, duration: 0.4 }}
                            />
                          </div>
                          <span className="text-xs font-medium w-12 text-right">{page.views}</span>
                        </motion.div>
                      );
                    }) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No page view data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Leads */}
              <Card className="relative overflow-hidden bg-background/60 backdrop-blur-xl border-amber-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5" />
                <CardContent className="pt-6 relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Recent Leads</h3>
                      <p className="text-xs text-muted-foreground">Latest captures</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {siteStats.recentLeads.length > 0 ? siteStats.recentLeads.map((lead, i) => (
                      <motion.div 
                        key={`${lead.email}-${i}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + i * 0.05 }}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/10 border border-border/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <Mail className="w-4 h-4 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium truncate max-w-[140px]">{lead.email}</p>
                            <p className="text-[10px] text-muted-foreground">{lead.source}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(lead.created_at), 'MMM d')}
                        </span>
                      </motion.div>
                    )) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No leads captured yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Changelog Management */}
          <TabsContent value="changelog">
            <AdminChangelogTab />
          </TabsContent>

          {/* CRO Campaign Controls */}
          <TabsContent value="cro">
            <AdminCROTab />
          </TabsContent>

          {/* AI Usage Analytics */}
          <TabsContent value="ai-usage">
            <AdminAIUsageTab />
          </TabsContent>

          {/* System Health */}
          <TabsContent value="health">
            <SystemHealthPanel />
          </TabsContent>

          {/* Beta Feedback */}
          <TabsContent value="feedback">
            <AdminFeedbackTab />
          </TabsContent>

          {/* Users & Roles Management */}
          <TabsContent value="users" className="space-y-6">
            {!isSuperAdmin ? (
              <Card className="bg-amber-500/10 border-amber-500/20">
                <CardContent className="py-8 text-center">
                  <Shield className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Super Admin Access Required</h3>
                  <p className="text-muted-foreground">You need super admin privileges to manage users and roles.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Role Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Crown className="w-8 h-8 text-amber-500" />
                        <div>
                          <p className="text-2xl font-bold">{users.filter(u => u.roles.includes('super_admin')).length}</p>
                          <p className="text-sm text-muted-foreground">Super Admins</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-violet-500" />
                        <div>
                          <p className="text-2xl font-bold">{users.filter(u => u.roles.includes('white_label_admin')).length}</p>
                          <p className="text-sm text-muted-foreground">White Label Partners</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Check className="w-8 h-8 text-green-500" />
                        <div>
                          <p className="text-2xl font-bold">{whiteLabelSettings.filter(s => s.subscription_status === 'active').length}</p>
                          <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-500" />
                        <div>
                          <p className="text-2xl font-bold">{users.length}</p>
                          <p className="text-sm text-muted-foreground">Total Users</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Users Table */}
                <Card className="bg-background/50 backdrop-blur-sm border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search users..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 bg-background/50"
                        />
                      </div>
                      <Button onClick={() => { fetchUsers(); fetchWhiteLabelSettings(); }} variant="outline" size="sm">
                        <RefreshCw className={`w-4 h-4 mr-2 ${usersLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Roles</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usersLoading ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                            </TableCell>
                          </TableRow>
                        ) : filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((userItem) => (
                            <TableRow key={userItem.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {userItem.avatar_url ? (
                                    <img src={userItem.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                      <span className="text-xs font-medium">{(userItem.email || 'U').charAt(0).toUpperCase()}</span>
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-medium">{userItem.full_name || 'No name'}</p>
                                    <p className="text-xs text-muted-foreground">{userItem.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {userItem.roles.length === 0 ? (
                                    <Badge variant="outline">User</Badge>
                                  ) : (
                                    userItem.roles.map(role => (
                                      <Badge key={role} className={getRoleBadgeColor(role)}>
                                        {role.replace('_', ' ')}
                                      </Badge>
                                    ))
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(new Date(userItem.created_at), 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUser(userItem);
                                      setPromoteDialogOpen(true);
                                    }}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Role
                                  </Button>
                                  {userItem.roles.map(role => (
                                    <Button
                                      key={role}
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                      onClick={() => handleRevokeRole(userItem.id, role)}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* White Label Partners */}
                {whiteLabelSettings.length > 0 && (
                  <Card className="bg-background/50 backdrop-blur-sm border-border/50">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-violet-500" />
                        White Label Partners
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Partner</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Subscription</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {whiteLabelSettings.map((setting) => (
                            <TableRow key={setting.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{setting.user_name || 'No name'}</p>
                                  <p className="text-xs text-muted-foreground">{setting.user_email}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {setting.logo_url && (
                                    <img src={setting.logo_url} alt="" className="w-6 h-6 rounded" />
                                  )}
                                  <span>{setting.company_name || 'Not set'}</span>
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(setting.subscription_status)}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {setting.subscription_end 
                                  ? `Ends ${format(new Date(setting.subscription_end), 'MMM d, yyyy')}`
                                  : 'No end date'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Partners & Applications */}
          <TabsContent value="partners" className="space-y-6">
            <Tabs defaultValue="applications">
              <TabsList className="mb-4">
                <TabsTrigger value="applications" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Applications
                  {stats.pendingApplications > 0 && (
                    <Badge variant="destructive" className="ml-1">{stats.pendingApplications}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="active" className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Active Partners
                </TabsTrigger>
              </TabsList>
              <TabsContent value="applications">
                <AdminApplicationsTab onUpdate={fetchStats} />
              </TabsContent>
              <TabsContent value="active">
                <AdminPartnersTab onUpdate={fetchStats} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Directory */}
          <TabsContent value="directory">
            <AdminDirectoryTab onUpdate={fetchStats} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Promote User Dialog */}
      <Dialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Add Role to User
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="font-medium">{selectedUser.full_name || 'No name'}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
              
              <div className="space-y-2">
                <Label>Role to Add</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="white_label_admin">White Label Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedRole === 'white_label_admin' && (
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    placeholder="Enter company name..."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePromoteUser} disabled={processingAction}>
              {processingAction ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Add Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
