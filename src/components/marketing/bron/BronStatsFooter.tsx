import { memo, useMemo } from "react";
import { TrendingUp, TrendingDown, ArrowRight, Hash, Target } from "lucide-react";
import { BronKeyword, BronSerpReport } from "@/hooks/use-bron-api";

interface BronStatsFooterProps {
  keywords: BronKeyword[];
  serpReports: BronSerpReport[];
  linksInCount: number;
  linksOutCount: number;
}

// Helper to get position value
const getPosition = (val?: string | number): number | null => {
  if (val === undefined || val === null) return null;
  const num = typeof val === 'string' ? parseInt(val, 10) : val;
  return isNaN(num) || num === 0 ? null : num;
};

export const BronStatsFooter = memo(({ 
  keywords, 
  serpReports,
  linksInCount,
  linksOutCount
}: BronStatsFooterProps) => {
  
  const stats = useMemo(() => {
    // Filter out tracking-only keywords
    const activeKeywords = keywords.filter(kw => 
      kw.status !== 'tracking_only' && !String(kw.id).startsWith('serp_')
    );
    
    const totalKeywords = activeKeywords.length;
    
    // Build a map of keyword to their Google position from SERP reports
    const keywordPositions: Record<string, number> = {};
    for (const report of serpReports) {
      if (!report.keyword) continue;
      const pos = getPosition(report.google);
      if (pos !== null) {
        // Use the most recent position (assume serpReports are sorted)
        if (!keywordPositions[report.keyword] || pos < keywordPositions[report.keyword]) {
          keywordPositions[report.keyword] = pos;
        }
      }
    }
    
    // Count keywords in position tiers
    let top10 = 0;
    let top20 = 0;
    let top30 = 0;
    let top50 = 0;
    let top100 = 0;
    
    Object.values(keywordPositions).forEach(pos => {
      if (pos <= 10) top10++;
      else if (pos <= 20) top20++;
      else if (pos <= 30) top30++;
      else if (pos <= 50) top50++;
      else if (pos <= 100) top100++;
    });
    
    // Calculate movements - for simplicity, track how many moved up vs down
    // This would ideally compare current vs previous SERP report, but we'll estimate
    // based on what data we have
    let movedUp = 0;
    let movedDown = 0;
    let totalMoveUp = 0;
    let totalMoveDown = 0;
    
    // Group SERP reports by keyword and track position changes
    const keywordReportHistory: Record<string, Array<{ pos: number; date: string }>> = {};
    
    for (const report of serpReports) {
      if (!report.keyword) continue;
      const pos = getPosition(report.google);
      if (pos !== null && report.complete) {
        if (!keywordReportHistory[report.keyword]) {
          keywordReportHistory[report.keyword] = [];
        }
        keywordReportHistory[report.keyword].push({ 
          pos, 
          date: report.complete 
        });
      }
    }
    
    // Calculate movements for each keyword
    Object.values(keywordReportHistory).forEach(history => {
      if (history.length >= 2) {
        // Sort by date ascending
        history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const oldest = history[0].pos;
        const latest = history[history.length - 1].pos;
        const diff = oldest - latest; // Positive = moved up (lower position number is better)
        
        if (diff > 0) {
          movedUp++;
          totalMoveUp += diff;
        } else if (diff < 0) {
          movedDown++;
          totalMoveDown += Math.abs(diff);
        }
      }
    });
    
    const totalMove = totalMoveUp - totalMoveDown;
    const totalLinks = linksInCount + linksOutCount;
    
    return {
      totalKeywords,
      top10,
      top20,
      top30,
      top50,
      top100,
      movedUp,
      movedDown,
      totalMoveUp,
      totalMoveDown,
      totalMove,
      totalLinks,
      linksIn: linksInCount,
      linksOut: linksOutCount
    };
  }, [keywords, serpReports, linksInCount, linksOutCount]);
  
  // Don't render if no data
  if (stats.totalKeywords === 0 && stats.totalLinks === 0) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/95 backdrop-blur-md shadow-lg"
      style={{ contain: 'layout style' }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2.5 overflow-x-auto gap-2">
          {/* Total Keywords */}
          <StatCell 
            label="Total Keywords" 
            value={stats.totalKeywords} 
            icon={<Hash className="w-3.5 h-3.5" />}
            variant="default"
          />
          
          {/* Ranking Tiers */}
          <StatCell 
            label="Top 10" 
            value={stats.top10} 
            variant="success"
          />
          <StatCell 
            label="Top 20" 
            value={stats.top20} 
            variant="info"
          />
          <StatCell 
            label="Top 30" 
            value={stats.top30} 
            variant="warning"
          />
          <StatCell 
            label="Top 50" 
            value={stats.top50} 
            variant="muted"
          />
          <StatCell 
            label="Top 100" 
            value={stats.top100} 
            variant="muted"
          />
          
          {/* Divider */}
          <div className="h-8 w-px bg-border/50 flex-shrink-0" />
          
          {/* Movement Stats */}
          <StatCell 
            label="Moved Up" 
            value={stats.totalMoveUp > 0 ? `+${stats.totalMoveUp}` : '0'} 
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            variant="success"
          />
          <StatCell 
            label="Moved Down" 
            value={stats.totalMoveDown > 0 ? `-${stats.totalMoveDown}` : '0'} 
            icon={<TrendingDown className="w-3.5 h-3.5" />}
            variant="danger"
          />
          <StatCell 
            label="Net Move" 
            value={stats.totalMove > 0 ? `+${stats.totalMove}` : String(stats.totalMove)} 
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            variant={stats.totalMove > 0 ? 'success' : stats.totalMove < 0 ? 'danger' : 'muted'}
          />
          
          {/* Divider */}
          <div className="h-8 w-px bg-border/50 flex-shrink-0" />
          
          {/* Links Stats */}
          <StatCell 
            label="Total Links" 
            value={stats.totalLinks} 
            icon={<Target className="w-3.5 h-3.5" />}
            variant="default"
          />
        </div>
      </div>
    </div>
  );
});

BronStatsFooter.displayName = 'BronStatsFooter';

// ─── Stat Cell Component ───
interface StatCellProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'muted';
}

const StatCell = memo(({ label, value, icon, variant = 'default' }: StatCellProps) => {
  const variantStyles = {
    default: 'text-foreground',
    success: 'text-emerald-500',
    danger: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
    muted: 'text-muted-foreground'
  };
  
  return (
    <div className="flex flex-col items-center px-3 py-1 min-w-[70px] flex-shrink-0">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium whitespace-nowrap">
        {label}
      </span>
      <span className={`text-base font-bold tabular-nums flex items-center gap-1 ${variantStyles[variant]}`}>
        {icon}
        {value}
      </span>
    </div>
  );
});

StatCell.displayName = 'StatCell';
