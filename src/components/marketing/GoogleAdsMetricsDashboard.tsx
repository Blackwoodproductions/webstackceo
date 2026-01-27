import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, DollarSign, MousePointerClick, 
  Eye, Target, Percent, Zap, BarChart3, PieChart,
  CalendarDays, Settings, RefreshCw, Filter, Download,
  ArrowUpRight, ArrowDownRight, ChevronRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CampaignData {
  id: string;
  name: string;
  status: 'enabled' | 'paused' | 'removed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cpc: number;
  ctr: number;
  conversionRate: number;
  qualityScore: number;
}

interface GoogleAdsMetricsDashboardProps {
  campaigns: CampaignData[];
  isLoading?: boolean;
  onRefresh?: () => void;
  selectedDomain?: string;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
};

const formatCurrency = (num: number): string => {
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
};

// Demo data for when connected but no real data
const generateDemoData = (): CampaignData[] => [
  {
    id: 'camp-1',
    name: 'Brand Awareness - Search',
    status: 'enabled',
    budget: 5000,
    spent: 3847.52,
    impressions: 245890,
    clicks: 8943,
    conversions: 412,
    cpc: 0.43,
    ctr: 3.64,
    conversionRate: 4.61,
    qualityScore: 7,
  },
  {
    id: 'camp-2',
    name: 'Product Launch - Display',
    status: 'enabled',
    budget: 3000,
    spent: 2156.89,
    impressions: 589432,
    clicks: 4521,
    conversions: 189,
    cpc: 0.48,
    ctr: 0.77,
    conversionRate: 4.18,
    qualityScore: 6,
  },
  {
    id: 'camp-3',
    name: 'Retargeting - Conversions',
    status: 'enabled',
    budget: 2000,
    spent: 1823.44,
    impressions: 124560,
    clicks: 6234,
    conversions: 523,
    cpc: 0.29,
    ctr: 5.0,
    conversionRate: 8.39,
    qualityScore: 8,
  },
  {
    id: 'camp-4',
    name: 'Competitor Keywords',
    status: 'paused',
    budget: 1500,
    spent: 892.33,
    impressions: 45230,
    clicks: 1234,
    conversions: 45,
    cpc: 0.72,
    ctr: 2.73,
    conversionRate: 3.65,
    qualityScore: 5,
  },
];

export function GoogleAdsMetricsDashboard({ 
  campaigns = [], 
  isLoading = false, 
  onRefresh,
  selectedDomain 
}: GoogleAdsMetricsDashboardProps) {
  // Use demo data if no campaigns provided
  const displayCampaigns = campaigns.length > 0 ? campaigns : generateDemoData();
  const isDemo = campaigns.length === 0;
  
  // Calculate aggregate metrics
  const totalSpent = displayCampaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalBudget = displayCampaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalImpressions = displayCampaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = displayCampaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalConversions = displayCampaigns.reduce((sum, c) => sum + c.conversions, 0);
  const avgCpc = totalClicks > 0 ? totalSpent / totalClicks : 0;
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgConvRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const avgQualityScore = displayCampaigns.reduce((sum, c) => sum + c.qualityScore, 0) / displayCampaigns.length;
  
  // Budget utilization
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const metricCards = [
    {
      label: "Total Spent",
      value: formatCurrency(totalSpent),
      subValue: `of ${formatCurrency(totalBudget)} budget`,
      change: 12.5,
      icon: DollarSign,
      gradient: "from-orange-500/15 to-amber-500/8",
      iconColor: "text-orange-500",
      borderColor: "border-orange-500/30",
      glowColor: "from-orange-500/20",
    },
    {
      label: "Impressions",
      value: formatNumber(totalImpressions),
      badge: `${displayCampaigns.filter(c => c.status === 'enabled').length} active`,
      change: 8.3,
      icon: Eye,
      gradient: "from-amber-500/15 to-yellow-500/8",
      iconColor: "text-amber-500",
      borderColor: "border-amber-500/30",
      glowColor: "from-amber-500/20",
    },
    {
      label: "Clicks",
      value: formatNumber(totalClicks),
      badge: `${avgCtr.toFixed(2)}% CTR`,
      change: 15.2,
      icon: MousePointerClick,
      gradient: "from-yellow-500/15 to-lime-500/8",
      iconColor: "text-yellow-500",
      borderColor: "border-yellow-500/30",
      glowColor: "from-yellow-500/20",
    },
    {
      label: "Conversions",
      value: formatNumber(totalConversions),
      badge: `${avgConvRate.toFixed(2)}% rate`,
      change: 23.7,
      icon: Target,
      gradient: "from-green-500/15 to-emerald-500/8",
      iconColor: "text-green-500",
      borderColor: "border-green-500/30",
      glowColor: "from-green-500/20",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enabled': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'paused': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'removed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-amber-500';
    return 'text-red-500';
  };

  const getQualityScoreBg = (score: number) => {
    if (score >= 8) return 'bg-green-500/20';
    if (score >= 6) return 'bg-amber-500/20';
    return 'bg-red-500/20';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select defaultValue="7d">
            <SelectTrigger className="w-[130px] h-8 text-xs bg-muted/30 border-border">
              <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          {isDemo && (
            <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/30">
              Demo Data
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs gap-1.5"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metricCards.map((card, i) => (
          <motion.div 
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={`relative overflow-hidden p-3 bg-gradient-to-br ${card.gradient} ${card.borderColor}`}>
              {/* Corner glow */}
              <div className={`absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl ${card.glowColor} to-transparent rounded-bl-[30px] pointer-events-none`} />
              
              {/* Grid pattern */}
              <div 
                className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
                  backgroundSize: '16px 16px'
                }}
              />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1">
                  <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                  {card.change !== undefined && card.change !== 0 && (
                    <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 ${card.change > 0 ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-red-500/20 text-red-500 border-red-500/30'}`}>
                      {card.change > 0 ? <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> : <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />}
                      {Math.abs(card.change).toFixed(1)}%
                    </Badge>
                  )}
                  {card.badge && (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-secondary/50 border-border/50">
                      {card.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xl font-bold">{card.value}</p>
                <p className="text-[10px] text-muted-foreground">
                  {card.label}
                  {card.subValue && ` (${card.subValue})`}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Avg CPC */}
        <Card className="p-3 bg-gradient-to-br from-violet-500/10 to-purple-500/5 border-violet-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground">Avg. CPC</span>
            <DollarSign className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <p className="text-lg font-bold text-violet-400">${avgCpc.toFixed(2)}</p>
          <div className="flex items-center gap-1 text-[9px] text-green-400 mt-1">
            <TrendingDown className="w-3 h-3" />
            <span>5.2% vs last period</span>
          </div>
        </Card>

        {/* Avg Quality Score */}
        <Card className="p-3 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border-cyan-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground">Avg. Quality Score</span>
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-lg font-bold text-cyan-400">{avgQualityScore.toFixed(1)}/10</p>
          <Progress value={avgQualityScore * 10} className="h-1 mt-2" />
        </Card>

        {/* Budget Utilization */}
        <Card className="p-3 bg-gradient-to-br from-rose-500/10 to-pink-500/5 border-rose-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground">Budget Used</span>
            <PieChart className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <p className="text-lg font-bold text-rose-400">{budgetUtilization.toFixed(1)}%</p>
          <Progress value={budgetUtilization} className="h-1 mt-2" />
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card className="overflow-hidden border-border bg-card/50">
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-semibold">Campaigns</h3>
            <Badge variant="secondary" className="text-[9px]">
              {displayCampaigns.length} total
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
            <Settings className="w-3.5 h-3.5" />
            Manage
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/20">
              <tr>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Campaign</th>
                <th className="text-center px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Status</th>
                <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Spent</th>
                <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Impressions</th>
                <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Clicks</th>
                <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">CTR</th>
                <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Conv.</th>
                <th className="text-center px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">QS</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayCampaigns.map((campaign) => (
                <motion.tr 
                  key={campaign.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-muted/20 transition-colors group"
                >
                  <td className="px-3 py-2.5">
                    <span className="font-medium text-xs">{campaign.name}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Badge variant="outline" className={`text-[9px] ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="text-xs font-medium">{formatCurrency(campaign.spent)}</div>
                    <div className="text-[9px] text-muted-foreground">
                      of {formatCurrency(campaign.budget)}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs text-muted-foreground">
                    {formatNumber(campaign.impressions)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs text-muted-foreground">
                    {formatNumber(campaign.clicks)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs">
                    {campaign.ctr.toFixed(2)}%
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs font-medium text-green-400">
                    {campaign.conversions}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getQualityScoreBg(campaign.qualityScore)} ${getQualityScoreColor(campaign.qualityScore)}`}>
                      {campaign.qualityScore}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}

export default GoogleAdsMetricsDashboard;
