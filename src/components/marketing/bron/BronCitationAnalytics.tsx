import { memo, useState, useMemo } from "react";
import { Link2, TrendingUp, ExternalLink } from "lucide-react";
import { BronLink } from "@/hooks/use-bron-api";

interface BronCitationAnalyticsProps {
  keywordId: string | number;
  keywordText: string;
  linksIn: BronLink[];
  linksOut: BronLink[];
}

export const BronCitationAnalytics = memo(({
  keywordId,
  keywordText,
  linksIn,
  linksOut,
}: BronCitationAnalyticsProps) => {
  const [viewMode, setViewMode] = useState<'inbound' | 'outbound'>('inbound');
  const [relevanceFilter, setRelevanceFilter] = useState<string>('all');
  const [reciprocalFilter, setReciprocalFilter] = useState<string>('all');
  
  const activeLinks = viewMode === 'inbound' ? linksIn : linksOut;
  const totalLinks = linksIn.length + linksOut.length;
  
  // Calculate actual reciprocal counts from API data
  const { reciprocalCount, oneWayCount, categoryBreakdown } = useMemo(() => {
    const allLinks = [...linksIn, ...linksOut];
    let reciprocal = 0;
    let oneWay = 0;
    const categories: Record<string, number> = {};
    
    for (const link of allLinks) {
      if (link.reciprocal === 'yes') {
        reciprocal++;
      } else {
        oneWay++;
      }
      
      const cat = link.category || link.parent_category || 'General';
      categories[cat] = (categories[cat] || 0) + 1;
    }
    
    return { reciprocalCount: reciprocal, oneWayCount: oneWay, categoryBreakdown: categories };
  }, [linksIn, linksOut]);
  
  // Filter links based on selections
  const filteredLinks = useMemo(() => {
    return activeLinks.filter(link => {
      if (reciprocalFilter === 'reciprocal' && link.reciprocal !== 'yes') return false;
      if (reciprocalFilter === 'one-way' && link.reciprocal === 'yes') return false;
      return true;
    });
  }, [activeLinks, reciprocalFilter]);
  
  // Calculate percentages
  const reciprocalPercent = totalLinks > 0 ? Math.round((reciprocalCount / totalLinks) * 100) : 0;
  const oneWayPercent = 100 - reciprocalPercent;
  
  return (
    <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden" style={{ contain: 'layout style paint' }}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border/30">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold">Citation Analytics</span>
        </div>
        <select 
          className="bg-muted/50 border border-border/50 rounded-md px-3 py-1.5 text-xs text-foreground"
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as 'inbound' | 'outbound')}
          onClick={(e) => e.stopPropagation()}
        >
          <option value="inbound">Inbound ({linksIn.length})</option>
          <option value="outbound">Outbound ({linksOut.length})</option>
        </select>
      </div>
      
      {/* Content */}
      <div className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-base font-semibold text-foreground">Citation Link Analytics</h3>
          <p className="text-xs text-muted-foreground">Content sharing overview and relevance analysis</p>
        </div>
        
        {totalLinks === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Link2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No citation links found for this keyword</p>
            <p className="text-xs mt-1">Links will appear here when the BRON network has citations pointing to this page</p>
          </div>
        ) : (
          <>
            {/* Donut Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              {/* Current View Stats */}
              <div>
                <h4 className="text-sm font-medium text-center mb-4">
                  {viewMode === 'inbound' ? 'Inbound' : 'Outbound'} Links by Category
                </h4>
                <div className="flex justify-center mb-4">
                  <DonutChart 
                    segments={Object.entries(categoryBreakdown).slice(0, 4).map(([cat, count], i) => ({
                      value: count,
                      color: ['#22C55E', '#3B82F6', '#CA8A04', '#8B5CF6'][i % 4]
                    }))}
                    total={totalLinks || 1}
                    centerTop={`${activeLinks.length}`}
                    centerBottom="links"
                    centerTopColor="text-cyan-400"
                    centerBottomColor="text-muted-foreground"
                  />
                </div>
                <Legend items={Object.entries(categoryBreakdown).slice(0, 4).map(([cat, count], i) => ({
                  color: ['bg-emerald-400', 'bg-blue-400', 'bg-amber-400', 'bg-violet-400'][i % 4],
                  label: cat.length > 20 ? cat.substring(0, 20) + '...' : cat,
                  value: count
                }))} />
              </div>
              
              {/* Link Relationship Types */}
              <div>
                <h4 className="text-sm font-medium text-center mb-4">Link Relationship Types</h4>
                <div className="flex justify-center mb-4">
                  <DonutChart 
                    segments={[
                      { value: reciprocalCount, color: '#22C55E' },
                      { value: oneWayCount, color: '#3B82F6' },
                    ]}
                    total={totalLinks || 1}
                    centerTop={`${reciprocalPercent}%`}
                    centerBottom={`${oneWayPercent}%`}
                    centerTopColor="text-emerald-400"
                    centerBottomColor="text-blue-400"
                  />
                </div>
                <Legend items={[
                  { color: 'bg-emerald-400', label: 'Reciprocal', value: reciprocalCount },
                  { color: 'bg-blue-400', label: 'One Way', value: oneWayCount },
                ]} />
              </div>
            </div>
            
            {/* Summary */}
            <div className="text-center py-3 border-t border-b border-border/30 mb-6">
              <p className="text-sm text-foreground">
                <span className="font-semibold">Total: {totalLinks} citations</span>
                <span className="text-muted-foreground"> ({reciprocalCount} reciprocal)</span>
                <TrendingUp className="inline w-4 h-4 ml-1 text-emerald-400" />
              </p>
              <p className="text-xs text-muted-foreground">Citation links overview and statistics</p>
            </div>
            
            {/* Links Table */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Your Citation Links</h4>
              
              {/* Filters */}
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Reciprocal:</span>
                  <select 
                    className="bg-muted/50 border border-border/50 rounded-md px-3 py-1.5 text-xs text-foreground" 
                    onClick={(e) => e.stopPropagation()}
                    value={reciprocalFilter}
                    onChange={(e) => setReciprocalFilter(e.target.value)}
                  >
                    <option value="all">All Types ({activeLinks.length})</option>
                    <option value="reciprocal">Reciprocal Only</option>
                    <option value="one-way">One Way Only</option>
                  </select>
                </div>
              </div>
              
              {filteredLinks.length > 0 ? (
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2.5 border-b border-border/50">
                    <div className="grid grid-cols-5 gap-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <span>{viewMode === 'inbound' ? 'Source Domain' : 'Target Domain'}</span>
                      <span>Category</span>
                      <span className="text-center">Reciprocal</span>
                      <span className="text-center">Status</span>
                      <span className="text-center">Actions</span>
                    </div>
                  </div>
                  <div className="max-h-[250px] overflow-y-auto divide-y divide-border/30">
                    {filteredLinks.slice(0, 20).map((link, idx) => (
                      <LinkRow 
                        key={`link-${idx}`}
                        link={link}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                  {filteredLinks.length > 20 && (
                    <div className="px-4 py-2 text-xs text-muted-foreground text-center border-t border-border/30">
                      Showing 20 of {filteredLinks.length} links
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Link2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No {viewMode} links match the current filters</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
});

BronCitationAnalytics.displayName = 'BronCitationAnalytics';

// Donut Chart Component
const DonutChart = memo(({ 
  segments, 
  total, 
  centerTop, 
  centerBottom,
  centerTopColor = 'text-emerald-400',
  centerBottomColor = 'text-yellow-500'
}: {
  segments: { value: number; color: string }[];
  total: number;
  centerTop: string;
  centerBottom: string;
  centerTopColor?: string;
  centerBottomColor?: string;
}) => {
  const circumference = 2 * Math.PI * 35;
  let offset = 0;
  
  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {segments.map((seg, i) => {
          const percent = seg.value / total;
          const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
          const strokeDashoffset = -offset * circumference;
          offset += percent;
          
          if (seg.value === 0) return null;
          
          return (
            <circle
              key={i}
              cx="50" cy="50" r="35"
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
            />
          );
        })}
        <circle cx="50" cy="50" r="28" fill="hsl(var(--card))" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-bold ${centerTopColor}`}>{centerTop}</span>
        <span className={`text-xs ${centerBottomColor}`}>{centerBottom}</span>
      </div>
    </div>
  );
});
DonutChart.displayName = 'DonutChart';

// Legend Component
const Legend = memo(({ items }: { items: { color: string; label: string; value: number }[] }) => (
  <div className="space-y-1.5 text-xs">
    {items.map((item, i) => (
      <div key={i} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
          <span className="text-muted-foreground truncate max-w-[120px]">{item.label}</span>
        </div>
        <span className="font-medium">{item.value}</span>
      </div>
    ))}
  </div>
));
Legend.displayName = 'Legend';

// Link Row Component
const LinkRow = memo(({ link, viewMode }: {
  link: BronLink;
  viewMode: 'inbound' | 'outbound';
}) => {
  const isReciprocal = link.reciprocal === 'yes';
  const isEnabled = link.disabled !== 'yes';
  const displayUrl = viewMode === 'inbound' 
    ? (link.domain_name || link.domain || link.source_url || 'Unknown')
    : (link.link || link.target_url || link.domain || 'Unknown');
  
  // Extract domain from URL for display
  const displayDomain = displayUrl.replace(/^https?:\/\//, '').split('/')[0];
  
  const linkHref = viewMode === 'inbound'
    ? (link.source_url || `https://${link.domain_name || link.domain}`)
    : (link.link || link.target_url || `https://${link.domain}`);
  
  const category = link.category || link.parent_category || 'General';
  const shortCategory = category.length > 18 ? category.substring(0, 18) + '...' : category;
  
  return (
    <div className="grid grid-cols-5 gap-4 px-4 py-3 hover:bg-muted/30 items-center text-sm">
      <div>
        <div className="font-medium text-foreground truncate" title={displayUrl}>
          {displayDomain}
        </div>
      </div>
      <div>
        <span className="text-xs px-2 py-1 rounded-md bg-muted/50 text-muted-foreground truncate" title={category}>
          {shortCategory}
        </span>
      </div>
      <div className="text-center">
        {isReciprocal ? (
          <span className="text-emerald-400 text-xs font-medium">✓ Yes</span>
        ) : (
          <span className="text-muted-foreground text-xs">No</span>
        )}
      </div>
      <div className="text-center">
        <span className={`text-xs px-2 py-1 rounded-md ${
          isEnabled 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {isEnabled ? 'Active' : 'Disabled'}
        </span>
      </div>
      <div className="text-center">
        <a
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
});
LinkRow.displayName = 'LinkRow';
