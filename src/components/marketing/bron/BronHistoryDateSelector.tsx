import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarClock, ChevronDown, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { BronSerpListItem } from "@/hooks/use-bron-api";

interface BronHistoryDateSelectorProps {
  serpHistory: BronSerpListItem[];
  selectedReportId: string | number | null;
  onSelectReport: (reportId: string | number | null) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function BronHistoryDateSelector({
  serpHistory,
  selectedReportId,
  onSelectReport,
  isLoading = false,
  disabled = false,
}: BronHistoryDateSelectorProps) {
  const [open, setOpen] = useState(false);

  // Sort history by date descending (newest first)
  const sortedHistory = useMemo(() => {
    return [...serpHistory].sort((a, b) => {
      const dateA = new Date(a.started || a.created_at || 0).getTime();
      const dateB = new Date(b.started || b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }, [serpHistory]);

  // Get the selected report for display
  const selectedReport = useMemo(() => {
    if (!selectedReportId) return null;
    return sortedHistory.find(
      (r) => String(r.report_id || r.id) === String(selectedReportId)
    );
  }, [sortedHistory, selectedReportId]);

  // Format date for display
  const formatReportDate = (report: BronSerpListItem) => {
    const dateStr = report.started || report.created_at;
    if (!dateStr) return "Unknown date";
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch {
      return "Unknown date";
    }
  };

  // Get formatted time
  const formatReportTime = (report: BronSerpListItem) => {
    const dateStr = report.started || report.created_at;
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr), "h:mm a");
    } catch {
      return "";
    }
  };

  const handleSelect = (reportId: string | number | null) => {
    onSelectReport(reportId);
    setOpen(false);
  };

  if (sortedHistory.length === 0) {
    return null;
  }

  const latestReportId = sortedHistory[0]?.report_id || sortedHistory[0]?.id;
  const isLatest = !selectedReportId || String(selectedReportId) === String(latestReportId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isLoading}
          className={cn(
            "h-9 gap-2 border-violet-500/30 hover:bg-violet-500/10",
            !isLatest && "border-violet-500/50 bg-violet-500/10"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
          ) : (
            <CalendarClock className="w-4 h-4 text-violet-400" />
          )}
          <span className="text-sm">
            {isLatest
              ? "Latest Rankings"
              : selectedReport
              ? formatReportDate(selectedReport)
              : "Select Date"}
          </span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 p-0 bg-card/95 backdrop-blur-sm border-border" 
        align="start"
      >
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-violet-400" />
            <span className="font-medium text-sm">Historical Rankings</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {sortedHistory.length} report{sortedHistory.length !== 1 ? "s" : ""} available
          </p>
        </div>
        
        <div className="max-h-64 overflow-y-auto">
          {/* Latest (Current) Option */}
          <button
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-violet-500/10 transition-colors border-b border-border/50",
              isLatest && "bg-violet-500/10"
            )}
            onClick={() => handleSelect(null)}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
              <div>
                <div className="text-sm font-medium">Latest Rankings</div>
                <div className="text-xs text-muted-foreground">
                  {formatReportDate(sortedHistory[0])} at {formatReportTime(sortedHistory[0])}
                </div>
              </div>
            </div>
            {isLatest && <Check className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Historical Reports */}
          {sortedHistory.slice(1).map((report, index) => {
            const reportId = report.report_id || report.id;
            const isSelected = String(selectedReportId) === String(reportId);
            
            return (
              <button
                key={reportId}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-violet-500/10 transition-colors",
                  isSelected && "bg-violet-500/10",
                  index < sortedHistory.length - 2 && "border-b border-border/30"
                )}
                onClick={() => handleSelect(reportId)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  <div>
                    <div className="text-sm">
                      {formatReportDate(report)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatReportTime(report)}
                    </div>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-violet-400" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
