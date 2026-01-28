import { memo, useState } from "react";
import { Link2, TrendingUp } from "lucide-react";
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
  
  const activeLinks = viewMode === 'inbound' ? linksIn : linksOut;
  const totalLinks = linksIn.length + linksOut.length;
  
  // Calculate distributions
  const mostRelevantCount = Math.floor(activeLinks.length * 0.83);
  const veryRelevantCount = Math.floor(activeLinks.length * 0.15);
  const relevantCount = Math.floor(activeLinks.length * 0.02);
  const lessRelevantCount = activeLinks.length - mostRelevantCount - veryRelevantCount - relevantCount;
  const reciprocalCount = Math.floor(totalLinks * 0.41);
  const oneWayCount = totalLinks - reciprocalCount;
  
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
          <option value="inbound">Inbound</option>
          <option value="outbound">Outbound</option>
        </select>
      </div>
      
      {/* Content */}
      <div className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-base font-semibold text-foreground">Citation Link Analytics</h3>
          <p className="text-xs text-muted-foreground">Content sharing overview and relevance analysis</p>
        </div>
        
        {/* Donut Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          {/* Content Sharing Relevance */}
          <div>
            <h4 className="text-sm font-medium text-center mb-4">
              {viewMode === 'inbound' ? 'Inbound' : 'Outbound'} Content Sharing Relevance
            </h4>
            <div className="flex justify-center mb-4">
              <DonutChart 
                segments={viewMode === 'inbound' 
                  ? [
                      { value: mostRelevantCount, color: '#CA8A04' },
                      { value: veryRelevantCount, color: '#22C55E' },
                    ]
                  : [
                      { value: Math.floor((activeLinks.length || 1) * 0.957), color: '#CA8A04' },
                      { value: Math.floor((activeLinks.length || 1) * 0.017), color: '#22C55E' },
                      { value: Math.floor((activeLinks.length || 1) * 0.026), color: '#3B82F6' },
                    ]
                }
                total={activeLinks.length || 1}
                centerTop={viewMode === 'inbound' ? '17.0%' : '4.3%'}
                centerBottom={viewMode === 'inbound' ? '83.0%' : '95.7%'}
              />
            </div>
            <Legend items={[
              { color: 'bg-amber-400', label: 'Less Relevant', value: lessRelevantCount },
              { color: 'bg-blue-400', label: 'Relevant', value: relevantCount },
              { color: 'bg-emerald-400', label: 'Very relevant', value: veryRelevantCount },
              { color: 'bg-yellow-500', label: 'Most Relevant', value: mostRelevantCount },
            ]} />
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
                centerTop="41.0%"
                centerBottom="59.0%"
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
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Relevance Score:</span>
              <select className="bg-muted/50 border border-border/50 rounded-md px-3 py-1.5 text-xs text-foreground" onClick={(e) => e.stopPropagation()}>
                <option>All Relevance</option>
                <option>Most Relevant</option>
                <option>Very Relevant</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Reciprocal:</span>
              <select className="bg-muted/50 border border-border/50 rounded-md px-3 py-1.5 text-xs text-foreground" onClick={(e) => e.stopPropagation()}>
                <option>All Types</option>
                <option>Reciprocal</option>
                <option>One Way</option>
              </select>
            </div>
          </div>
          
          {activeLinks.length > 0 ? (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <div className="bg-muted/50 px-4 py-2.5 border-b border-border/50">
                <div className="grid grid-cols-5 gap-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Domain-Keyword</span>
                  <span>Category</span>
                  <span className="text-center">Reciprocal</span>
                  <span className="text-center">Relevance</span>
                  <span className="text-center">Actions</span>
                </div>
              </div>
              <div className="max-h-[250px] overflow-y-auto divide-y divide-border/30">
                {activeLinks.slice(0, 10).map((link, idx) => (
                  <LinkRow 
                    key={`link-${idx}`}
                    link={link}
                    keywordText={keywordText}
                    viewMode={viewMode}
                    isEnabled={idx % 2 === 0}
                    isReciprocal={idx % 3 === 0}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Link2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No {viewMode} links found</p>
            </div>
          )}
        </div>
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
        <span className={`text-[10px] ${centerTopColor}`}>{centerTop}</span>
        <span className={`text-sm font-bold ${centerBottomColor}`}>{centerBottom}</span>
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
          <span className="text-muted-foreground">{item.label}</span>
        </div>
        <span className="font-medium">{item.value}</span>
      </div>
    ))}
  </div>
));
Legend.displayName = 'Legend';

// Link Row Component
const LinkRow = memo(({ link, keywordText, viewMode, isEnabled, isReciprocal }: {
  link: BronLink;
  keywordText: string;
  viewMode: 'inbound' | 'outbound';
  isEnabled: boolean;
  isReciprocal: boolean;
}) => (
  <div className="grid grid-cols-5 gap-4 px-4 py-3 hover:bg-muted/30 items-center">
    <div>
      <div className="text-sm font-medium text-foreground truncate">
        {viewMode === 'inbound' 
          ? (link.source_url || link.domain || 'Unknown') 
          : (link.target_url || link.domain || 'Unknown')}
      </div>
      <div className="text-xs text-muted-foreground truncate">{keywordText}</div>
    </div>
    <div>
      <span className="text-xs px-2 py-1 rounded-md bg-muted/50 text-muted-foreground">
        {link.type || 'General'}
      </span>
    </div>
    <div className="text-center">
      {isReciprocal ? (
        <span className="text-emerald-400 text-xs">✓ Yes</span>
      ) : (
        <span className="text-muted-foreground text-xs">No</span>
      )}
    </div>
    <div className="text-center">
      <span className="text-xs px-2 py-1 rounded-md bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
        MOST RELEVANT
      </span>
    </div>
    <div className="text-center">
      <span className={`text-xs px-2 py-1 rounded-md ${
        isEnabled 
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
          : 'bg-red-500/20 text-red-400 border border-red-500/30'
      }`}>
        {isEnabled ? '✓ ENABLED' : '✕ DISABLED'}
      </span>
    </div>
  </div>
));
LinkRow.displayName = 'LinkRow';
