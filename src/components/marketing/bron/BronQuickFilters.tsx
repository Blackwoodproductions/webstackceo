import { memo } from "react";
import { Filter, TrendingUp, TrendingDown, FileText, Target, LayoutGrid, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type QuickFilterType = 
  | "all" 
  | "top10" 
  | "top50" 
  | "hasContent" 
  | "noContent" 
  | "improved" 
  | "dropped";

interface BronQuickFiltersProps {
  activeFilter: QuickFilterType;
  onFilterChange: (filter: QuickFilterType) => void;
  compactMode: boolean;
  onCompactModeChange: (compact: boolean) => void;
  counts: {
    total: number;
    top10: number;
    top50: number;
    hasContent: number;
    noContent: number;
    improved: number;
    dropped: number;
  };
}

interface FilterButton {
  id: QuickFilterType;
  label: string;
  icon?: React.ElementType;
  color: string;
}

const filters: FilterButton[] = [
  { id: "all", label: "All", color: "bg-muted hover:bg-muted/80" },
  { id: "top10", label: "Top 10", icon: TrendingUp, color: "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400" },
  { id: "top50", label: "Top 50", icon: Target, color: "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400" },
  { id: "hasContent", label: "Has Content", icon: FileText, color: "bg-violet-500/20 hover:bg-violet-500/30 text-violet-400" },
  { id: "noContent", label: "No Content", color: "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400" },
  { id: "improved", label: "Improved", icon: TrendingUp, color: "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400" },
  { id: "dropped", label: "Dropped", icon: TrendingDown, color: "bg-red-500/20 hover:bg-red-500/30 text-red-400" },
];

export const BronQuickFilters = memo(({
  activeFilter,
  onFilterChange,
  compactMode,
  onCompactModeChange,
  counts,
}: BronQuickFiltersProps) => {
  const getCount = (id: QuickFilterType) => {
    switch (id) {
      case "all": return counts.total;
      case "top10": return counts.top10;
      case "top50": return counts.top50;
      case "hasContent": return counts.hasContent;
      case "noContent": return counts.noContent;
      case "improved": return counts.improved;
      case "dropped": return counts.dropped;
      default: return 0;
    }
  };

  return (
    <div 
      className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-muted/30 border border-border/50"
      style={{ contain: 'layout style' }}
    >
      {/* Filter Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground mr-1" />
        {filters.map((filter) => {
          const Icon = filter.icon;
          const count = getCount(filter.id);
          const isActive = activeFilter === filter.id;
          
          return (
            <Button
              key={filter.id}
              variant="ghost"
              size="sm"
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                "h-7 px-2.5 text-xs gap-1.5 transition-all",
                isActive ? filter.color : "hover:bg-muted/50"
              )}
            >
              {Icon && <Icon className="w-3 h-3" />}
              {filter.label}
              {count > 0 && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "h-4 px-1 text-[10px] font-mono",
                    isActive && "bg-background/50"
                  )}
                >
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-1 border-l border-border/50 pl-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCompactModeChange(false)}
          className={cn(
            "h-7 w-7 p-0",
            !compactMode && "bg-primary/20 text-primary"
          )}
          title="Standard view"
        >
          <LayoutGrid className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCompactModeChange(true)}
          className={cn(
            "h-7 w-7 p-0",
            compactMode && "bg-primary/20 text-primary"
          )}
          title="Compact view"
        >
          <LayoutList className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

BronQuickFilters.displayName = 'BronQuickFilters';
