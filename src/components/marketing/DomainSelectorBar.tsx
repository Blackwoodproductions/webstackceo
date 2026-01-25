import { Globe, Plus, CalendarIcon, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export type TimeRange = 'live' | 'yesterday' | 'week' | 'month' | '6months' | '1year' | 'custom';

interface DomainSelectorBarProps {
  // Domain selection
  trackedDomains: string[];
  userAddedDomains: string[];
  selectedDomain: string;
  onDomainChange: (domain: string) => void;
  onAddDomainClick: () => void;
  
  // Time range (optional - only shown when showTimeRange is true)
  showTimeRange?: boolean;
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  customDateRange?: { from: Date | undefined; to: Date | undefined };
  onCustomDateRangeChange?: (range: { from: Date | undefined; to: Date | undefined }) => void;
  
  // Page filter (optional - only shown when showPageFilter is true)
  showPageFilter?: boolean;
  pageFilter?: string | null;
  onPageFilterClear?: () => void;
  
  // Center content slot (for tabs)
  centerContent?: React.ReactNode;
  
  // Right side content slot
  rightContent?: React.ReactNode;
}

export function DomainSelectorBar({
  trackedDomains,
  userAddedDomains,
  selectedDomain,
  onDomainChange,
  onAddDomainClick,
  showTimeRange = false,
  timeRange = 'live',
  onTimeRangeChange,
  customDateRange,
  onCustomDateRangeChange,
  showPageFilter = false,
  pageFilter,
  onPageFilterClear,
  centerContent,
  rightContent,
}: DomainSelectorBarProps) {
  const viDomains = [...new Set([...trackedDomains, ...userAddedDomains])];
  
  return (
    <div className="border-x border-b border-border bg-card/50 backdrop-blur-sm sticky top-4 z-40 max-w-[1530px] mx-auto">
      <div className="px-8 py-2 flex items-center justify-between">
        {/* Left: Domain Selector & Time Range */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Domain Selector */}
          {viDomains.length > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <Select
                  value={selectedDomain || ''} 
                  onValueChange={onDomainChange}
                >
                  <SelectTrigger className="w-[180px] h-7 text-sm bg-background border-border">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50 max-w-[400px]">
                    {viDomains.map((domain) => {
                      const hasViTracking = trackedDomains.includes(domain);
                      return (
                        <SelectItem
                          key={domain}
                          value={domain}
                          className="text-xs"
                          indicator={hasViTracking ? (
                            <Globe className="w-3.5 h-3.5 text-primary" />
                          ) : undefined}
                        >
                          <span className="truncate max-w-[300px]" title={domain}>
                            {domain}
                          </span>
                        </SelectItem>
                      );
                    })}
                    <SelectSeparator />
                    <div 
                      className="flex items-center gap-2 px-2 py-1.5 text-xs text-primary cursor-pointer hover:bg-accent rounded-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddDomainClick();
                      }}
                    >
                      <Plus className="w-3 h-3" />
                      Add domain
                    </div>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs"
                onClick={onAddDomainClick}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Domain
              </Button>
              <div className="w-px h-5 bg-border" />
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs"
                onClick={onAddDomainClick}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Domain
              </Button>
              <div className="w-px h-5 bg-border" />
            </>
          )}
          
          {/* Time Range Selector - only show if enabled */}
          {showTimeRange && onTimeRangeChange && (
            <>
              <div className="flex gap-1">
                <div className="flex flex-col gap-1 items-center w-5">
                  <CalendarIcon className="w-4 h-4 text-primary mt-1.5" />
                  {showPageFilter && pageFilter && <Filter className="w-4 h-4 text-purple-400 mt-1.5" />}
                </div>
                <div className="flex flex-col gap-1">
                  <Select value={timeRange} onValueChange={(value: TimeRange) => onTimeRangeChange(value)}>
                    <SelectTrigger className="w-[130px] h-7 text-sm bg-background border-border">
                      <SelectValue placeholder="Range" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border shadow-lg z-50">
                      <SelectItem value="live">Last 24h</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="6months">6 Months</SelectItem>
                      <SelectItem value="1year">Year</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {showPageFilter && pageFilter && onPageFilterClear && (
                    <Badge variant="secondary" className="flex items-center gap-2 px-2 py-0.5 h-7 bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                      {pageFilter === '/' ? 'Homepage' : pageFilter}
                      <button onClick={onPageFilterClear} className="ml-1 hover:bg-purple-500/30 rounded p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Custom date range pickers */}
              {timeRange === 'custom' && onCustomDateRangeChange && (
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-7 text-sm px-3", !customDateRange?.from && "text-muted-foreground")}>
                        {customDateRange?.from ? format(customDateRange.from, "MMM d, yyyy") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover border border-border z-50" align="start">
                      <Calendar 
                        mode="single" 
                        selected={customDateRange?.from} 
                        onSelect={(date) => onCustomDateRangeChange({ ...customDateRange, from: date, to: customDateRange?.to })} 
                        initialFocus 
                        className="p-3 pointer-events-auto" 
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-sm text-muted-foreground">to</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-7 text-sm px-3", !customDateRange?.to && "text-muted-foreground")}>
                        {customDateRange?.to ? format(customDateRange.to, "MMM d, yyyy") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover border border-border z-50" align="start">
                      <Calendar 
                        mode="single" 
                        selected={customDateRange?.to} 
                        onSelect={(date) => onCustomDateRangeChange({ from: customDateRange?.from, to: date })} 
                        initialFocus 
                        className="p-3 pointer-events-auto" 
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Center: Tabs (if provided) */}
        {centerContent && (
          <div className="flex items-center justify-center">
            {centerContent}
          </div>
        )}
        
        {/* Spacer - only if no center content */}
        {!centerContent && <div className="flex-1" />}
        
        {/* Right: Custom content */}
        {rightContent && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {rightContent}
          </div>
        )}
      </div>
    </div>
  );
}