import { memo, useState, useMemo } from "react";
import { Link2, TrendingUp } from "lucide-react";
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

  // Build a set of categories for this keyword based on its outbound links.
  // Used to score inbound relevance.
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
  
  // Calculate actual reciprocal counts from API data
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
  
  // Relevance breakdown for the active view
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
              {/* Relevance */}
              <div>
                <h4 className="text-sm font-medium text-center mb-4">
                  {viewMode === 'inbound' ? 'Inbound' : 'Outbound'} Links by Relevance
                </h4>
                <div className="flex justify-center mb-4">
                  <DonutChart 
                    segments={[
                      { value: relevanceBreakdown.less, color: '#3B82F6' },
                      { value: relevanceBreakdown.relevant, color: '#8B5CF6' },
                      { value: relevanceBreakdown.very, color: '#22C55E' },
                      { value: relevanceBreakdown.most, color: '#CA8A04' },
                    ]}
                    total={totalLinks || 1}
                    centerTop={`${activeLinks.length}`}
                    centerBottom="links"
                    centerTopClassName="text-primary"
                    centerBottomClassName="text-muted-foreground"
                  />
                </div>
                <Legend
                  items={[
                    { colorClassName: 'bg-blue-400', label: 'Less Relevant', value: relevanceBreakdown.less },
                    { colorClassName: 'bg-violet-400', label: 'Relevant', value: relevanceBreakdown.relevant },
                    { colorClassName: 'bg-emerald-400', label: 'Very Relevant', value: relevanceBreakdown.very },
                    { colorClassName: 'bg-amber-400', label: 'Most Relevant', value: relevanceBreakdown.most },
                  ]}
                />
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
                    centerTopClassName="text-primary"
                    centerBottomClassName="text-muted-foreground"
                  />
                </div>
                <Legend
                  items={[
                    { colorClassName: 'bg-emerald-400', label: 'Reciprocal', value: reciprocalCount },
                    { colorClassName: 'bg-blue-400', label: 'One Way', value: oneWayCount },
                  ]}
                />
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
                  <span className="text-xs text-muted-foreground">Relevance:</span>
                  <select
                    className="bg-muted/50 border border-border/50 rounded-md px-3 py-1.5 text-xs text-foreground"
                    onClick={(e) => e.stopPropagation()}
                    value={relevanceFilter}
                    onChange={(e) => setRelevanceFilter(e.target.value as RelevanceFilter)}
                  >
                    <option value="all">All Relevance</option>
                    <option value="most">Most Relevant</option>
                    <option value="very">Very Relevant</option>
                    <option value="relevant">Relevant</option>
                    <option value="less">Less Relevant</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Reciprocal:</span>
                  <select 
                    className="bg-muted/50 border border-border/50 rounded-md px-3 py-1.5 text-xs text-foreground" 
                    onClick={(e) => e.stopPropagation()}
                    value={reciprocalFilter}
                    onChange={(e) => setReciprocalFilter(e.target.value as ReciprocalFilter)}
                  >
                    <option value="all">All Types ({activeLinks.length})</option>
                    <option value="reciprocal">Reciprocal Only</option>
                    <option value="one-way">One Way Only</option>
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
