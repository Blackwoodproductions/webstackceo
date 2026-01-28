import { motion } from "framer-motion";
import { 
  BarChart3, RefreshCw, Search, Target, CalendarIcon
} from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BronSerpReport } from "@/hooks/use-bron-api";
import { cn } from "@/lib/utils";

interface BRONSerpTabProps {
  serpReports: BronSerpReport[];
  selectedDomain?: string;
  isLoading: boolean;
  onRefresh: () => void;
}

export const BRONSerpTab = ({
  serpReports,
  selectedDomain,
  isLoading,
  onRefresh,
}: BRONSerpTabProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const filteredReports = useMemo(() => {
    return serpReports.filter(r => {
      // Search filter
      const matchesSearch = r.keyword?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Date filter
      let matchesDate = true;
      if (r.complete && (startDate || endDate)) {
        const reportDate = new Date(r.complete);
        if (startDate && reportDate < startDate) matchesDate = false;
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (reportDate > endOfDay) matchesDate = false;
        }
      }
      
      return matchesSearch && matchesDate;
    });
  }, [serpReports, searchQuery, startDate, endDate]);

  const clearDateFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  // Parse position value from string/number
  const getPosition = (val?: string | number): number | null => {
    if (val === undefined || val === null) return null;
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    return isNaN(num) || num === 0 ? null : num;
  };

  const getPositionBadge = (val?: string | number) => {
    const position = getPosition(val);
    if (position === null) return <Badge variant="secondary" className="text-xs">—</Badge>;
    
    if (position <= 3) {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">{position}</Badge>;
    } else if (position <= 10) {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">{position}</Badge>;
    } else if (position <= 20) {
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">{position}</Badge>;
    } else {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">{position}</Badge>;
    }
  };

  // Remove unused getDifficultyColor function since API doesn't return difficulty

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="border-emerald-500/20 bg-gradient-to-br from-background to-emerald-500/5">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                SERP Rankings
                {selectedDomain && (
                  <Badge variant="secondary" className="text-xs ml-2">{selectedDomain}</Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search rankings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-48 h-9 bg-secondary/50"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRefresh}
                  disabled={isLoading || !selectedDomain}
                  className="border-emerald-500/30 hover:bg-emerald-500/10"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            
            {/* Date Range Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Date Range:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 justify-start text-left font-normal border-emerald-500/30",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-xs text-muted-foreground">to</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 justify-start text-left font-normal border-emerald-500/30",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDateFilter}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}
              
              {(startDate || endDate) && (
                <Badge variant="secondary" className="text-xs">
                  {filteredReports.length} results
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedDomain ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Select a domain to view SERP rankings</p>
              <p className="text-sm mt-1">Use the domain selector above</p>
            </div>
          ) : isLoading && serpReports.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No SERP data available</p>
              <p className="text-sm mt-1">Ranking reports will appear here when available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Keyword</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                      <span className="inline-flex items-center gap-1">🟢 Google</span>
                    </th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                      <span className="inline-flex items-center gap-1">🔵 Bing</span>
                    </th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                      <span className="inline-flex items-center gap-1">🟣 Yahoo</span>
                    </th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                      <span className="inline-flex items-center gap-1">🟠 Duck</span>
                    </th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">Last Checked</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report, index) => (
                    <motion.tr
                      key={`${report.keyword}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-border/50 hover:bg-emerald-500/5 transition-colors"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center flex-shrink-0">
                            <Target className="w-4 h-4 text-emerald-400" />
                          </div>
                          <span className="font-medium text-sm">{report.keyword}</span>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        {getPositionBadge(report.google)}
                      </td>
                      <td className="py-3 text-center">
                        {getPositionBadge(report.bing)}
                      </td>
                      <td className="py-3 text-center">
                        {getPositionBadge(report.yahoo)}
                      </td>
                      <td className="py-3 text-center">
                        {getPositionBadge(report.duck)}
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-xs text-muted-foreground">
                          {report.complete ? new Date(report.complete).toLocaleDateString() : '—'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
