import { useState, useEffect } from 'react';
import { Globe, Plus, CalendarIcon, Filter, X, RefreshCw } from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';

export type TimeRange = 'live' | 'yesterday' | 'week' | 'month' | '6months' | '1year' | 'custom';

interface DomainSelectorBarProps {
  trackedDomains: string[];
  userAddedDomains: string[];
  selectedDomain: string;
  onDomainChange: (domain: string) => void;
  onAddDomainClick: () => void;
  showTimeRange?: boolean;
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  customDateRange?: { from: Date | undefined; to: Date | undefined };
  onCustomDateRangeChange?: (range: { from: Date | undefined; to: Date | undefined }) => void;
  showPageFilter?: boolean;
  pageFilter?: string | null;
  onPageFilterClear?: () => void;
  centerContent?: React.ReactNode;
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
  const normalizeDomainKey = (input: string) =>
    input
      .toLowerCase()
      .trim()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .split('/')[0];

  const trackedSet = new Set(trackedDomains.map(normalizeDomainKey));
  const userAddedSet = new Set(userAddedDomains.map(normalizeDomainKey));
  const viDomains = [...new Set([...trackedSet, ...userAddedSet])].filter(Boolean);
  const selectedValue = selectedDomain ? normalizeDomainKey(selectedDomain) : '';
  
  // Track domain switching for smooth transitions
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedDomain, setDisplayedDomain] = useState(selectedValue);
  
  useEffect(() => {
    if (selectedValue !== displayedDomain) {
      setIsTransitioning(true);
      // Brief transition delay for visual smoothness
      const timer = setTimeout(() => {
        setDisplayedDomain(selectedValue);
        setIsTransitioning(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedValue, displayedDomain]);
  
  return (
    <div 
      className="relative border-x border-b border-border bg-card sticky z-40 max-w-[1480px] mx-auto"
      style={{ 
        contain: 'layout style',
        top: 'calc(var(--app-navbar-height, 64px) + var(--vi-dashboard-header-height, 0px))',
        background: 'hsl(var(--card))',
      }}
      data-no-theme-transition
    >
      {/* Background grid pattern - static */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />
      
      {/* Top accent line - static */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none" />
      
      <div className="relative z-20 px-8 py-2 flex items-center justify-between">
        {/* Left: Domain Selector & Time Range */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Domain Selector with smooth transitions */}
          <motion.div 
            className="flex items-center gap-2"
            animate={{ opacity: isTransitioning ? 0.7 : 1 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div 
              className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-cyan-500/10"
              animate={{ 
                scale: isTransitioning ? 0.95 : 1,
                rotate: isTransitioning ? 180 : 0 
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {isTransitioning ? (
                <RefreshCw className="w-4 h-4 text-primary animate-spin" />
              ) : (
                <Globe className="w-4 h-4 text-primary" />
              )}
            </motion.div>

            <Select value={selectedValue} onValueChange={onDomainChange}>
              <SelectTrigger className="w-[180px] h-7 text-sm bg-background border-border/50 pointer-events-auto transition-all duration-200">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={selectedValue}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="truncate"
                  >
                    <SelectValue placeholder="Select domain" />
                  </motion.span>
                </AnimatePresence>
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-2xl z-[200] max-w-[400px] pointer-events-auto">
                {viDomains.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    No domains yet
                  </div>
                )}

                {viDomains.map((domain) => {
                  const hasViTracking = trackedSet.has(domain);
                  return (
                    <SelectItem
                      key={domain}
                      value={domain}
                      className="text-xs transition-colors duration-150"
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
                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-primary cursor-pointer hover:bg-accent rounded-sm transition-colors duration-150"
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
            
            {/* Live indicator - static for performance */}
            <motion.span
              className="flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30"
              animate={{ opacity: isTransitioning ? 0.5 : 1 }}
              transition={{ duration: 0.15 }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              LIVE
            </motion.span>
          </motion.div>

          <div className="w-px h-5 bg-border/50" />
          
          {/* Time Range Selector */}
          {showTimeRange && onTimeRangeChange && (
            <>
              <div className="flex gap-1">
                <div className="flex flex-col gap-1 items-center w-5">
                  <CalendarIcon className="w-4 h-4 text-primary mt-1.5" />
                  {showPageFilter && pageFilter && <Filter className="w-4 h-4 text-purple-400 mt-1.5" />}
                </div>
                <div className="flex flex-col gap-1">
                  <Select value={timeRange} onValueChange={(value: TimeRange) => onTimeRangeChange(value)}>
                    <SelectTrigger className="w-[130px] h-7 text-sm bg-background/80 border-border/50 backdrop-blur-sm">
                      <SelectValue placeholder="Range" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover/95 backdrop-blur-sm border border-border shadow-xl z-50">
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
                      <button onClick={onPageFilterClear} className="ml-1 hover:bg-purple-500/30 rounded p-0.5 transition-colors">
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
                      <Button variant="outline" size="sm" className={cn("h-7 text-sm px-3 bg-background/80", !customDateRange?.from && "text-muted-foreground")}>
                        {customDateRange?.from ? format(customDateRange.from, "MMM d, yyyy") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover/95 backdrop-blur-sm border border-border z-50" align="start">
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
                      <Button variant="outline" size="sm" className={cn("h-7 text-sm px-3 bg-background/80", !customDateRange?.to && "text-muted-foreground")}>
                        {customDateRange?.to ? format(customDateRange.to, "MMM d, yyyy") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover/95 backdrop-blur-sm border border-border z-50" align="start">
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
      
      {/* Bottom accent line - static */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent pointer-events-none" />
    </div>
  );
}
