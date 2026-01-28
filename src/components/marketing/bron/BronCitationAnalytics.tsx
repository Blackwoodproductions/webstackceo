import { memo, useState, useMemo } from "react";
import { Link2, TrendingUp, Sparkles } from "lucide-react";
import { BronLink } from "@/hooks/use-bron-api";
import { DonutChart, Legend } from "./CitationDonut";
import {
  CitationLinksTable,
  scoreRelevanceTier,
  type RelevanceFilter,
  type ReciprocalFilter,
} from "./CitationLinksTable";

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
  const [relevanceFilter, setRelevanceFilter] = useState<RelevanceFilter>('all');
  const [reciprocalFilter, setReciprocalFilter] = useState<ReciprocalFilter>('all');
  
  const activeLinks = viewMode === 'inbound' ? linksIn : linksOut;
  const totalLinks = linksIn.length + linksOut.length;

  const normalizeCategory = (value?: string) =>
    (value || "")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const keywordCategorySet = useMemo(() => {
    const set = new Set<string>();
    for (const l of linksOut) {
      const cat = normalizeCategory(l.category);
      const parent = normalizeCategory(l.parent_category);
      if (cat) set.add(cat);
      if (parent) set.add(parent);
      if (parent && cat) set.add(`${parent}/${cat}`);
    }
    return set;
  }, [linksOut]);
  
  const { reciprocalCount, oneWayCount } = useMemo(() => {
    const allLinks = [...linksIn, ...linksOut];
    let reciprocal = 0;
    let oneWay = 0;
    
    for (const link of allLinks) {
      if (link.reciprocal === 'yes') {
        reciprocal++;
      } else {
        oneWay++;
      }
    }
    
    return { reciprocalCount: reciprocal, oneWayCount: oneWay };
  }, [linksIn, linksOut]);
  
  const relevanceBreakdown = useMemo(() => {
    const counts: Record<'most' | 'very' | 'relevant' | 'less', number> = {
      most: 0,
      very: 0,
      relevant: 0,
      less: 0,
    };
    for (const l of activeLinks) {
      const tier = scoreRelevanceTier(l, keywordText, keywordCategorySet);
      counts[tier] += 1;
    }
    return counts;
  }, [activeLinks, keywordText, keywordCategorySet]);
  
  const reciprocalPercent = totalLinks > 0 ? Math.round((reciprocalCount / totalLinks) * 100) : 0;
  const oneWayPercent = 100 - reciprocalPercent;
  
  return (
    <div 
      className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-card/80 via-card/60 to-cyan-950/20 overflow-hidden backdrop-blur-sm"
      style={{ 
        contain: 'layout style paint',
        willChange: 'auto',
      }}
    >
      {/* Header - compact */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Link2 className="w-4 h-4 text-cyan-400" />
            <Sparkles className="w-2 h-2 text-cyan-300 absolute -top-0.5 -right-0.5" />
          </div>
          <span className="text-sm font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Citation Analytics
          </span>
        </div>
        <select 
          className="bg-card border border-cyan-500/30 rounded-lg px-3 py-1 text-xs text-foreground hover:border-cyan-400/50 transition-colors z-30"
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as 'inbound' | 'outbound')}
          onClick={(e) => e.stopPropagation()}
        >
          <option value="inbound">Inbound ({linksIn.length})</option>
          <option value="outbound">Outbound ({linksOut.length})</option>
        </select>
      </div>
      
      {/* Content - more compact */}
      <div className="p-4">
        {totalLinks === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Link2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No citation links found</p>
            <p className="text-xs mt-1">Links will appear when the BRON network has citations</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-4">
              <h3 className="text-sm font-semibold text-foreground">Citation Link Analytics</h3>
              <p className="text-[10px] text-muted-foreground">Content sharing overview and relevance analysis</p>
            </div>
            
            {/* Donut Charts - side by side, larger */}
            <div className="flex items-start justify-center gap-8 mb-4">
              {/* Relevance Chart */}
              <div className="flex flex-col items-center">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">
                  {viewMode === 'inbound' ? 'Inbound' : 'Outbound'} by Relevance
                </h4>
                <DonutChart 
                  size="lg"
                  segments={[
                    { value: relevanceBreakdown.less, color: '#3B82F6' },
                    { value: relevanceBreakdown.relevant, color: '#8B5CF6' },
                    { value: relevanceBreakdown.very, color: '#22C55E' },
                    { value: relevanceBreakdown.most, color: '#F59E0B' },
                  ]}
                  total={Math.max(activeLinks.length, 1)}
                  centerTop={`${activeLinks.length}`}
                  centerBottom="links"
                  centerTopClassName="text-cyan-400"
                  centerBottomClassName="text-muted-foreground"
                />
                <div className="mt-2">
                  <Legend
                    compact
                    items={[
                      { colorClassName: 'bg-amber-400', label: 'Most', value: relevanceBreakdown.most },
                      { colorClassName: 'bg-emerald-400', label: 'Very', value: relevanceBreakdown.very },
                      { colorClassName: 'bg-violet-400', label: 'Relevant', value: relevanceBreakdown.relevant },
                      { colorClassName: 'bg-blue-400', label: 'Less', value: relevanceBreakdown.less },
                    ]}
                  />
                </div>
              </div>
              
              {/* Relationship Types Chart */}
              <div className="flex flex-col items-center">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Link Relationships</h4>
                <DonutChart 
                  size="lg"
                  segments={[
                    { value: reciprocalCount, color: '#22C55E' },
                    { value: oneWayCount, color: '#3B82F6' },
                  ]}
                  total={Math.max(totalLinks, 1)}
                  centerTop={`${reciprocalPercent}%`}
                  centerBottom={`${oneWayPercent}%`}
                  centerTopClassName="text-emerald-400"
                  centerBottomClassName="text-blue-400"
                />
                <div className="mt-2">
                  <Legend
                    compact
                    items={[
                      { colorClassName: 'bg-emerald-400', label: 'Reciprocal', value: reciprocalCount },
                      { colorClassName: 'bg-blue-400', label: 'One Way', value: oneWayCount },
                    ]}
                  />
                </div>
              </div>
            </div>
            
            {/* Summary - compact */}
            <div className="text-center py-2 border-t border-b border-cyan-500/20 mb-4 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent">
              <p className="text-xs text-foreground">
                <span className="font-semibold text-cyan-400">Total: {totalLinks} citations</span>
                <span className="text-muted-foreground"> ({reciprocalCount} reciprocal)</span>
                <TrendingUp className="inline w-3 h-3 ml-1 text-emerald-400" />
              </p>
            </div>
            
            {/* Links Table Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-foreground">Your Citation Links</h4>
              </div>
              
              {/* Compact Filters */}
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">View:</span>
                  <select
                    className="bg-card border border-border/50 rounded-md px-2 py-1 text-[10px] text-foreground z-20"
                    onClick={(e) => e.stopPropagation()}
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value as 'inbound' | 'outbound')}
                  >
                    <option value="inbound">Inbound ({linksIn.length})</option>
                    <option value="outbound">Outbound ({linksOut.length})</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">Relevance:</span>
                  <select
                    className="bg-card border border-border/50 rounded-md px-2 py-1 text-[10px] text-foreground z-20"
                    onClick={(e) => e.stopPropagation()}
                    value={relevanceFilter}
                    onChange={(e) => setRelevanceFilter(e.target.value as RelevanceFilter)}
                  >
                    <option value="all">All</option>
                    <option value="most">Most</option>
                    <option value="very">Very</option>
                    <option value="relevant">Relevant</option>
                    <option value="less">Less</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">Type:</span>
                  <select 
                    className="bg-card border border-border/50 rounded-md px-2 py-1 text-[10px] text-foreground z-20" 
                    onClick={(e) => e.stopPropagation()}
                    value={reciprocalFilter}
                    onChange={(e) => setReciprocalFilter(e.target.value as ReciprocalFilter)}
                  >
                    <option value="all">All ({activeLinks.length})</option>
                    <option value="reciprocal">Reciprocal</option>
                    <option value="one-way">One Way</option>
                  </select>
                </div>
              </div>

              <CitationLinksTable
                keywordText={keywordText}
                links={activeLinks}
                viewMode={viewMode}
                reciprocalFilter={reciprocalFilter}
                relevanceFilter={relevanceFilter}
                keywordCategorySet={keywordCategorySet}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
});

BronCitationAnalytics.displayName = 'BronCitationAnalytics';