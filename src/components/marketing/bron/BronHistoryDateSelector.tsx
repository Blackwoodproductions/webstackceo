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
      const dateA = extractDate(a);
      const dateB = extractDate(b);
      return dateB - dateA;
    });
  }, [serpHistory]);

  // Extract date from various possible field names in BRON API response
  function extractDate(report: BronSerpListItem): number {
    // Try all possible date field names from BRON API
    const dateStr = 
      (report as any).started ||
      (report as any).start_date ||
      (report as any).startdate ||
      (report as any).date ||
      (report as any).created ||
      (report as any).created_at ||
      (report as any).timestamp ||
      (report as any).complete ||
      (report as any).completed ||
      (report as any).completed_at;
    
    if (!dateStr) return 0;
    
    // Handle Unix timestamps (if it's a number or numeric string)
    if (typeof dateStr === 'number') {
      // If it's in seconds (10 digits), convert to ms
      return dateStr > 9999999999 ? dateStr : dateStr * 1000;
    }
    if (/^\d+$/.test(String(dateStr))) {
      const num = parseInt(String(dateStr), 10);
      return num > 9999999999 ? num : num * 1000;
    }
    
    try {
      return new Date(dateStr).getTime();
    } catch {
      return 0;
    }
  }

  // Get the selected report for display
  const selectedReport = useMemo(() => {
    if (!selectedReportId) return null;
    return sortedHistory.find(
      (r) => String(r.report_id || r.id || (r as any).serpid) === String(selectedReportId)
    );
  }, [sortedHistory, selectedReportId]);

  // Format date for display
  const formatReportDate = (report: BronSerpListItem) => {
    const timestamp = extractDate(report);
    if (!timestamp || timestamp === 0) {
      // Fallback: try to derive from ID or any other field
      const anyReport = report as any;
      // If no date, show the report ID as identifier
      const id = anyReport.serpid || anyReport.report_id || anyReport.id;
      if (id) return `Report #${String(id).slice(-6)}`;
      return "Unknown date";
    }
    try {
      return format(new Date(timestamp), "MMM d, yyyy");
    } catch {
      return "Unknown date";
    }
  };

  // Get formatted time
  const formatReportTime = (report: BronSerpListItem) => {
    const timestamp = extractDate(report);
    if (!timestamp || timestamp === 0) return "";
    try {
      return format(new Date(timestamp), "h:mm a");
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

  // Debug log to understand API structure (remove after fixing)
  if (sortedHistory.length > 0) {
    console.log('[BronHistoryDateSelector] Sample report structure:', Object.keys(sortedHistory[0]), sortedHistory[0]);
  }

  const getReportId = (report: BronSerpListItem) => {
    const anyReport = report as any;
    return anyReport.serpid || anyReport.report_id || anyReport.id;
  };

  const latestReportId = getReportId(sortedHistory[0]);
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
            const reportId = getReportId(report);
            const isSelected = String(selectedReportId) === String(reportId);
            
            return (
              <button
                key={reportId || `report-${index}`}
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
