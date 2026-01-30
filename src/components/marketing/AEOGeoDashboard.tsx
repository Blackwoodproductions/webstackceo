import { useState, useCallback, memo, useEffect, useRef, useMemo } from 'react';
import { 
  BrainCircuit, Loader2, CheckCircle, XCircle, AlertCircle, 
  ChevronDown, ChevronRight, Lightbulb, Sparkles, 
  MessageSquare, Play, Pause, Calendar, History, RefreshCw,
  TrendingUp, TrendingDown, Minus, Zap, GitBranch, Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBronApi, BronKeyword } from '@/hooks/use-bron-api';
import { getTargetKeyword } from './bron/BronKeywordCard';
import { groupKeywords, KeywordCluster } from './bron/utils';
import { KeywordTrainingInfo } from '@/components/ui/llm-training-animation';
import { format, subDays, startOfDay, isToday, differenceInDays } from 'date-fns';

interface LLMResult {
  model: string;
  modelDisplayName: string;
  mentioned: boolean;
  snippet: string | null;
  position: 'prominent' | 'mentioned' | 'not_found';
  confidence: number;
  queryUsed: string;
  roundNumber?: number;
  error?: string;
}

interface KeywordAEOResult {
  keyword: string;
  isLoading: boolean;
  results: LLMResult[];
  suggestions: string[];
  timestamp?: string;
  error?: string;
}

interface AEOGeoDashboardProps {
  domain: string;
}

interface DBResult {
  id: string;
  domain: string;
  keyword: string;
  results: LLMResult[];
  suggestions: string[];
  prominent_count: number;
  mentioned_count: number;
  check_date: string;
  checked_at: string;
}

const CACHE_TTL_DAYS = 7; // Weekly refresh

const LLM_ICONS: Record<string, string> = {
  'Google Gemini': '🔷',
  'Gemini Flash': '⚡',
  'Gemini Pro': '🔷',
  'Perplexity': '🔵',
};

const PositionBadge = memo(({ position, confidence }: { position: string; confidence: number }) => {
  if (position === 'prominent') {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
        <CheckCircle className="w-3 h-3 mr-1" />
        Prominent ({confidence}%)
      </Badge>
    );
  }
  if (position === 'mentioned') {
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40">
        <AlertCircle className="w-3 h-3 mr-1" />
        Mentioned ({confidence}%)
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-500/20 text-red-400 border-red-500/40">
      <XCircle className="w-3 h-3 mr-1" />
      Not Found
    </Badge>
  );
});
PositionBadge.displayName = 'PositionBadge';

const LLMResultCard = memo(({ result }: { result: LLMResult }) => {
  const icon = LLM_ICONS[result.modelDisplayName] || '🤖';
  
  return (
    <div className={`p-4 rounded-lg border ${
      result.position === 'prominent' 
        ? 'bg-emerald-500/5 border-emerald-500/30' 
        : result.position === 'mentioned'
        ? 'bg-amber-500/5 border-amber-500/30'
        : 'bg-muted/30 border-border/50'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <div>
            <p className="font-semibold text-sm">{result.modelDisplayName}</p>
            <p className="text-[10px] text-muted-foreground capitalize">
              {result.queryUsed} query
            </p>
          </div>
        </div>
        <PositionBadge position={result.position} confidence={result.confidence} />
      </div>
      
      {result.error ? (
        <p className="mt-3 text-xs text-red-400 bg-red-500/10 p-2 rounded">
          Error: {result.error}
        </p>
      ) : result.snippet ? (
        <div className="mt-3 p-3 bg-background/50 rounded-lg border border-border/30">
          <p className="text-xs text-muted-foreground leading-relaxed">
            "{result.snippet}"
          </p>
        </div>
      ) : null}
    </div>
  );
});
LLMResultCard.displayName = 'LLMResultCard';

// Training status component
const TrainingStatusBadge = memo(({ 
  results, 
  timestamp,
  suggestions 
}: { 
  results: LLMResult[];
  timestamp?: string;
  suggestions: string[];
}) => {
  // Check if training is in progress based on suggestions
  const isTraining = suggestions.some(s => s.includes('Training in progress'));
  const trainingMatch = suggestions.find(s => s.includes('Training in progress'))?.match(/Round (\d+)\/(\d+)/);
  const currentRound = trainingMatch ? parseInt(trainingMatch[1]) : 0;
  const totalRounds = trainingMatch ? parseInt(trainingMatch[2]) : 12;
  const progressPercent = isTraining ? (currentRound / totalRounds) * 100 : 100;
  
  // Get training completion info
  const completedSession = suggestions.some(s => s.includes('Training session completed'));
  const achievedTop = suggestions.some(s => s.includes('Achieved #1 prominence'));
  const improved = suggestions.some(s => s.includes('Improved visibility'));
  
  // Calculate best round stats from results
  const roundNumbers = [...new Set(results.filter(r => r.roundNumber).map(r => r.roundNumber))];
  const bestRound = roundNumbers.length > 0 ? Math.max(...roundNumbers.map(rn => 
    results.filter(r => r.roundNumber === rn && r.position === 'prominent').length
  )) : 0;
  
  if (isTraining) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 bg-violet-500/10 border border-violet-500/30 rounded-lg">
        <Loader2 className="w-3 h-3 animate-spin text-violet-400" />
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-violet-400">Training Round {currentRound}/{totalRounds}</span>
          <Progress value={progressPercent} className="h-1 w-16 bg-violet-900/50" />
        </div>
      </div>
    );
  }
  
  if (completedSession) {
    return (
      <div className="flex items-center gap-2">
        {achievedTop && (
          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black border-0 text-[9px] px-1.5">
            🏆 #1 Achieved
          </Badge>
        )}
        {improved && !achievedTop && (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px]">
            📈 Improved
          </Badge>
        )}
        <Badge variant="outline" className="text-[9px] bg-violet-500/10 text-violet-400 border-violet-500/30">
          {roundNumbers.length} rounds trained
        </Badge>
      </div>
    );
  }
  
  if (timestamp) {
    const lastCheck = new Date(timestamp);
    const hoursAgo = Math.floor((Date.now() - lastCheck.getTime()) / (1000 * 60 * 60));
    const daysAgo = Math.floor(hoursAgo / 24);
    
    return (
      <Badge variant="outline" className="text-[9px] text-muted-foreground">
        Last trained: {daysAgo > 0 ? `${daysAgo}d ago` : hoursAgo > 0 ? `${hoursAgo}h ago` : 'Just now'}
      </Badge>
    );
  }
  
  return null;
});
TrainingStatusBadge.displayName = 'TrainingStatusBadge';

// Training details panel showing round-by-round results
const TrainingDetailsPanel = memo(({ results, suggestions }: { results: LLMResult[]; suggestions: string[] }) => {
  const roundNumbers = [...new Set(results.filter(r => r.roundNumber).map(r => r.roundNumber))].sort((a, b) => (a || 0) - (b || 0));
  
  if (roundNumbers.length === 0) return null;
  
  // Group results by round
  const roundStats = roundNumbers.map(rn => {
    const roundResults = results.filter(r => r.roundNumber === rn);
    return {
      round: rn,
      prominent: roundResults.filter(r => r.position === 'prominent').length,
      mentioned: roundResults.filter(r => r.position === 'mentioned').length,
      total: roundResults.length,
    };
  });
  
  // Find best round
  const bestRound = roundStats.reduce((best, curr) => 
    curr.prominent > (best?.prominent || 0) ? curr : best, roundStats[0]);
  
  return (
    <div className="mt-4 p-3 bg-gradient-to-br from-violet-500/5 to-purple-500/5 border border-violet-500/20 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-violet-400" />
        <h4 className="font-semibold text-sm">Training Session Details</h4>
        <Badge variant="outline" className="text-[9px] ml-auto">
          {roundNumbers.length} rounds completed
        </Badge>
      </div>
      
      {/* Training suggestions/achievements */}
      {suggestions.filter(s => s.includes('🎯') || s.includes('🏆') || s.includes('📈')).length > 0 && (
        <div className="mb-3 space-y-1">
          {suggestions.filter(s => s.includes('🎯') || s.includes('🏆') || s.includes('📈')).map((s, i) => (
            <p key={i} className="text-xs text-emerald-400">{s}</p>
          ))}
        </div>
      )}
      
      {/* Round progress visualization */}
      <div className="grid grid-cols-6 md:grid-cols-12 gap-1">
        {roundStats.map(rs => (
          <div 
            key={rs.round}
            className={`p-1.5 rounded text-center text-[9px] ${
              rs.prominent === rs.total 
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50' 
                : rs.prominent > 0 
                  ? 'bg-amber-500/20 text-amber-300' 
                  : rs.mentioned > 0 
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-muted/30 text-muted-foreground'
            }`}
            title={`Round ${rs.round}: ${rs.prominent} prominent, ${rs.mentioned} mentioned`}
          >
            R{rs.round}
          </div>
        ))}
      </div>
      
      {bestRound && (
        <p className="mt-2 text-[10px] text-muted-foreground">
          Best performance: Round {bestRound.round} with {bestRound.prominent}/{bestRound.total} prominent placements
        </p>
      )}
    </div>
  );
});
TrainingDetailsPanel.displayName = 'TrainingDetailsPanel';

const KeywordAEOCard = memo(({ 
  data, 
  isExpanded, 
  onToggle,
  position,
  onRecheck,
  isNested = false,
  isMainKeyword = false,
  childCount = 0,
}: { 
  data: KeywordAEOResult; 
  isExpanded: boolean; 
  onToggle: () => void;
  position?: number;
  onRecheck?: () => void;
  isNested?: boolean;
  isMainKeyword?: boolean;
  childCount?: number;
}) => {
  const prominentCount = data.results.filter(r => r.position === 'prominent').length;
  const mentionedCount = data.results.filter(r => r.position === 'mentioned').length;
  const totalChecked = data.results.filter(r => !r.error).length;
  const successRate = totalChecked > 0 
    ? Math.round(((prominentCount + mentionedCount) / totalChecked) * 100) 
    : 0;
  
  // Check for training rounds
  const hasTrainingData = data.results.some(r => r.roundNumber);
  const roundCount = hasTrainingData 
    ? [...new Set(data.results.filter(r => r.roundNumber).map(r => r.roundNumber))].length 
    : 0;

  return (
    <Card 
      className={`overflow-hidden ${
        isNested 
          ? 'bg-muted/20 border-border/30 ml-6 border-l-2 border-l-cyan-500/30' 
          : isMainKeyword
            ? 'bg-gradient-to-r from-violet-500/10 to-fuchsia-500/5 border-violet-500/30'
            : 'bg-card/80 border-border/50'
      }`} 
      style={{ 
        contain: 'layout style paint',
        transform: 'translateZ(0)',
      }}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/20 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Tree connector for nested keywords */}
                {isNested && (
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-px bg-cyan-500/40" />
                    <GitBranch className="w-3 h-3 text-cyan-500/60 rotate-180" />
                  </div>
                )}
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <div className="flex items-center gap-2">
                  {position && (
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${
                      isNested 
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' 
                        : 'bg-primary/10 text-primary border-primary/30'
                    }`}>
                      #{position}
                    </Badge>
                  )}
                  {isMainKeyword && childCount > 0 && (
                    <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[9px]">
                      +{childCount} supporting
                    </Badge>
                  )}
                  {isNested && (
                    <Badge variant="outline" className="text-[9px] bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                      Supporting
                    </Badge>
                  )}
                  <div>
                    <CardTitle className={`font-semibold ${isNested ? 'text-sm' : 'text-base'}`}>{data.keyword}</CardTitle>
                    <div className="flex items-center gap-2 mt-0.5">
                      {data.timestamp && (
                        <CardDescription className="text-[10px]">
                          Checked: {new Date(data.timestamp).toLocaleString()}
                        </CardDescription>
                      )}
                      <TrainingStatusBadge 
                        results={data.results} 
                        timestamp={data.timestamp} 
                        suggestions={data.suggestions}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Always show training info component */}
                <KeywordTrainingInfo
                  hasResults={data.results.length > 0}
                  prominentCount={prominentCount}
                  mentionedCount={mentionedCount}
                  roundCount={roundCount}
                  lastTrainedAt={data.timestamp}
                  isTraining={data.isLoading}
                  trainingProgress={data.isLoading ? 25 : (hasTrainingData ? 100 : 0)}
                />
                
                {data.results.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Progress value={successRate} className="w-16 h-2" />
                    <span className="text-xs font-medium text-muted-foreground">{successRate}%</span>
                  </div>
                )}
                
                {/* Show re-check button */}
                {!data.isLoading && onRecheck && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRecheck();
                    }}
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            {data.error ? (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{data.error}</p>
              </div>
            ) : data.results.length > 0 ? (
              <div className="space-y-4">
                {/* Training details panel if we have training data */}
                {hasTrainingData && (
                  <TrainingDetailsPanel results={data.results} suggestions={data.suggestions} />
                )}
                
                {/* Latest LLM results - show only most recent round or non-training results */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(hasTrainingData 
                    ? data.results.filter(r => r.roundNumber === Math.max(...data.results.map(x => x.roundNumber || 0)))
                    : data.results
                  ).map((result, idx) => (
                    <LLMResultCard key={`${result.model}-${result.queryUsed}-${idx}`} result={result} />
                  ))}
                </div>
                
                {data.suggestions.length > 0 && data.results.some(r => r.position === 'not_found') && (
                  <div className="mt-6 p-4 bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-5 h-5 text-violet-400" />
                      <h4 className="font-semibold text-sm">Optimization Suggestions</h4>
                    </div>
                    <ul className="space-y-2">
                      {data.suggestions.filter(s => !s.includes('Training')).slice(0, 5).map((suggestion, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Sparkles className="w-3 h-3 text-violet-400 mt-0.5 shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : data.isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Querying AI models...</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <BrainCircuit className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Waiting to check this keyword...</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
});
KeywordAEOCard.displayName = 'KeywordAEOCard';

// Trend analysis component showing improvements over time
const TrendSummaryCard = memo(({ 
  domain, 
  currentStats, 
  availableDates 
}: { 
  domain: string; 
  currentStats: { checked: number; prominent: number; mentioned: number };
  availableDates: string[];
}) => {
  const [historicalStats, setHistoricalStats] = useState<{
    date: string;
    prominent: number;
    mentioned: number;
    total: number;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!domain || availableDates.length < 2) return;
    
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase
          .from('aeo_check_results')
          .select('check_date, prominent_count, mentioned_count')
          .eq('domain', domain)
          .order('check_date', { ascending: true });
        
        if (data) {
          // Group by date
          const dateMap = new Map<string, { prominent: number; mentioned: number; total: number }>();
          data.forEach(row => {
            const existing = dateMap.get(row.check_date) || { prominent: 0, mentioned: 0, total: 0 };
            existing.prominent += row.prominent_count;
            existing.mentioned += row.mentioned_count;
            existing.total += 1;
            dateMap.set(row.check_date, existing);
          });
          
          const history = Array.from(dateMap.entries()).map(([date, stats]) => ({
            date,
            ...stats,
          }));
          setHistoricalStats(history);
        }
      } catch (e) {
        console.error('Failed to load trend history:', e);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadHistory();
  }, [domain, availableDates]);

  // Calculate improvements
  const improvements = useMemo(() => {
    if (historicalStats.length < 2) return null;
    
    const oldest = historicalStats[0];
    const newest = historicalStats[historicalStats.length - 1];
    const daysDiff = differenceInDays(new Date(newest.date), new Date(oldest.date));
    
    const prominentChange = newest.prominent - oldest.prominent;
    const mentionedChange = newest.mentioned - oldest.mentioned;
    const totalVisibilityChange = (newest.prominent + newest.mentioned) - (oldest.prominent + oldest.mentioned);
    
    return {
      prominentChange,
      mentionedChange,
      totalVisibilityChange,
      daysDiff,
      oldestDate: oldest.date,
      newestDate: newest.date,
      checksCompleted: historicalStats.length,
    };
  }, [historicalStats]);

  // Show nothing during loading - prevents flash
  if (isLoading) return null;

  if (!improvements) {
    return (
      <Card 
        className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-violet-500/10 border-blue-500/30"
        style={{ contain: 'layout style paint' }}
      >
        <CardContent className="py-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold">LLM Training Active</p>
              <p className="text-sm text-muted-foreground">
                Automated checks run 3x weekly (Mon, Wed, Fri). More data needed to show trends.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/15 border-emerald-500/40"
      style={{ contain: 'layout style paint' }}
    >
      <CardContent className="py-5">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            {improvements.totalVisibilityChange > 0 ? (
              <TrendingUp className="w-8 h-8 text-white" />
            ) : improvements.totalVisibilityChange < 0 ? (
              <TrendingDown className="w-8 h-8 text-white" />
            ) : (
              <Minus className="w-8 h-8 text-white" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="font-bold text-lg">LLM Visibility Trend</h3>
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-3 py-1">
                {improvements.checksCompleted} checks over {improvements.daysDiff} days
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-5">
              <div className="text-center p-4 bg-background/60 rounded-xl border border-emerald-500/20">
                <div className="flex items-center justify-center gap-2">
                  {improvements.prominentChange > 0 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  ) : improvements.prominentChange < 0 ? (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  ) : (
                    <Minus className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className={`text-3xl font-bold ${
                    improvements.prominentChange > 0 ? 'text-emerald-400' : 
                    improvements.prominentChange < 0 ? 'text-red-400' : 'text-muted-foreground'
                  }`}>
                    {improvements.prominentChange > 0 ? '+' : ''}{improvements.prominentChange}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 font-medium">Prominent</p>
              </div>
              
              <div className="text-center p-4 bg-background/60 rounded-xl border border-amber-500/20">
                <div className="flex items-center justify-center gap-2">
                  {improvements.mentionedChange > 0 ? (
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                  ) : improvements.mentionedChange < 0 ? (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  ) : (
                    <Minus className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className={`text-3xl font-bold ${
                    improvements.mentionedChange > 0 ? 'text-amber-400' : 
                    improvements.mentionedChange < 0 ? 'text-red-400' : 'text-muted-foreground'
                  }`}>
                    {improvements.mentionedChange > 0 ? '+' : ''}{improvements.mentionedChange}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 font-medium">Mentioned</p>
              </div>
              
              <div className="text-center p-4 bg-background/60 rounded-xl border border-cyan-500/20">
                <div className="flex items-center justify-center gap-2">
                  {improvements.totalVisibilityChange > 0 ? (
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                  ) : improvements.totalVisibilityChange < 0 ? (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  ) : (
                    <Minus className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className={`text-3xl font-bold ${
                    improvements.totalVisibilityChange > 0 ? 'text-cyan-400' : 
                    improvements.totalVisibilityChange < 0 ? 'text-red-400' : 'text-muted-foreground'
                  }`}>
                    {improvements.totalVisibilityChange > 0 ? '+' : ''}{improvements.totalVisibilityChange}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 font-medium">Total Visibility</p>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Comparing {format(new Date(improvements.oldestDate), 'MMM d')} → {format(new Date(improvements.newestDate), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
TrendSummaryCard.displayName = 'TrendSummaryCard';

export const AEOGeoDashboard = memo(({ domain }: AEOGeoDashboardProps) => {
  const bronApi = useBronApi();
  const [keywordResults, setKeywordResults] = useState<Record<string, KeywordAEOResult>>({});
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [currentCheckIndex, setCurrentCheckIndex] = useState(0);
  const [bronKeywords, setBronKeywords] = useState<Array<{ 
    keyword: string; 
    position?: number;
    isNested: boolean;
    isMainKeyword: boolean;
    childCount: number;
    parentKeyword?: string;
  }>>([]);
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('today');
  const autoRunAbortRef = useRef(false);
  const hasFetchedRef = useRef<string | null>(null);
  const hasAutoStartedRef = useRef<string | null>(null);
  
  // Load available report dates for domain
  const loadAvailableDates = useCallback(async () => {
    if (!domain) return;
    try {
      const { data } = await supabase
        .from('aeo_check_results')
        .select('check_date')
        .eq('domain', domain)
        .order('check_date', { ascending: false });
      
      if (data) {
        const uniqueDates = [...new Set(data.map(d => d.check_date))];
        setAvailableDates(uniqueDates);
      }
    } catch (e) {
      console.error('Failed to load available dates:', e);
    }
  }, [domain]);

  // Load cached results from database
  const loadCachedResults = useCallback(async (targetDate?: string) => {
    if (!domain) return {};
    
    setIsLoadingHistory(true);
    try {
      let query = supabase
        .from('aeo_check_results')
        .select('*')
        .eq('domain', domain);
      
      if (targetDate && targetDate !== 'today') {
        query = query.eq('check_date', targetDate);
      } else {
        // Get most recent results (within last 7 days for freshness)
        const weekAgo = format(subDays(new Date(), CACHE_TTL_DAYS), 'yyyy-MM-dd');
        query = query.gte('check_date', weekAgo);
      }
      
      const { data, error } = await query.order('checked_at', { ascending: false });
      
      if (error) throw error;
      
      const results: Record<string, KeywordAEOResult> = {};
      if (data) {
        // Group by keyword, take most recent
        const keywordMap = new Map<string, DBResult>();
        data.forEach(row => {
          const existing = keywordMap.get(row.keyword);
          if (!existing || new Date(row.checked_at) > new Date(existing.checked_at)) {
            keywordMap.set(row.keyword, row as unknown as DBResult);
          }
        });
        
        keywordMap.forEach((row, keyword) => {
          results[keyword] = {
            keyword,
            isLoading: false,
            results: Array.isArray(row.results) ? row.results : [],
            suggestions: Array.isArray(row.suggestions) ? row.suggestions : [],
            timestamp: row.checked_at,
          };
        });
      }
      
      return results;
    } catch (e) {
      console.error('Failed to load cached results:', e);
      return {};
    } finally {
      setIsLoadingHistory(false);
    }
  }, [domain]);

  // Save result to database
  const saveResultToDb = useCallback(async (keyword: string, result: KeywordAEOResult) => {
    if (!domain || !result.results.length) return;
    
    const prominentCount = result.results.filter(r => r.position === 'prominent').length;
    const mentionedCount = result.results.filter(r => r.position === 'mentioned').length;
    const today = format(new Date(), 'yyyy-MM-dd');
    
    try {
      // Cast to any to avoid type issues before types are synced
      const insertData = {
        domain,
        keyword,
        results: JSON.parse(JSON.stringify(result.results)),
        suggestions: JSON.parse(JSON.stringify(result.suggestions)),
        prominent_count: prominentCount,
        mentioned_count: mentionedCount,
        check_date: today,
        checked_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('aeo_check_results')
        .insert(insertData as any);
      
      // If duplicate, update instead
      if (error?.code === '23505') {
        await supabase
          .from('aeo_check_results')
          .update({
            results: JSON.parse(JSON.stringify(result.results)),
            suggestions: JSON.parse(JSON.stringify(result.suggestions)),
            prominent_count: prominentCount,
            mentioned_count: mentionedCount,
            checked_at: new Date().toISOString(),
          } as any)
          .eq('domain', domain)
          .eq('keyword', keyword)
          .eq('check_date', today);
      }
    } catch (e) {
      console.error('Failed to save result:', e);
    }
  }, [domain]);

  // Check if keyword needs refresh (older than 7 days)
  const needsRefresh = useCallback((result: KeywordAEOResult | undefined): boolean => {
    if (!result?.timestamp) return true;
    const checked = new Date(result.timestamp);
    const now = new Date();
    const diffDays = (now.getTime() - checked.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= CACHE_TTL_DAYS;
  }, []);

  // Reset state when domain changes
  useEffect(() => {
    if (domain && hasFetchedRef.current !== domain) {
      // Clear stale data from previous domain immediately
      setBronKeywords([]);
      setKeywordResults({});
      setAvailableDates([]);
      hasAutoStartedRef.current = null;
    }
  }, [domain]);
  
  // Fetch BRON keywords for this domain
  useEffect(() => {
    if (!domain || hasFetchedRef.current === domain) return;
    hasFetchedRef.current = domain;
    
    const fetchKeywords = async () => {
      setIsLoadingKeywords(true);
      try {
        // Load cached results and dates in parallel
        const [cached] = await Promise.all([
          loadCachedResults(),
          loadAvailableDates(),
        ]);
        
        if (Object.keys(cached).length > 0) {
          setKeywordResults(cached);
        }
        
        // Fetch BRON keywords
        await bronApi.fetchKeywords(domain);
      } catch (error) {
        console.error('Error fetching BRON keywords:', error);
        toast.error('Failed to load keywords from BRON');
      } finally {
        setIsLoadingKeywords(false);
      }
    };
    
    fetchKeywords();
  }, [domain, bronApi, loadCachedResults, loadAvailableDates]);
  
  // When keywords update, extract keyword text and group into clusters
  const keywordClusters = useMemo(() => {
    if (!bronApi.keywords || bronApi.keywords.length === 0) return [];
    console.log('[AEO] Raw keywords from BRON API:', bronApi.keywords.length);
    // Log supporting keyword data for debugging
    const withSupportingKw = bronApi.keywords.filter(k => k.supporting_keywords && k.supporting_keywords.length > 0);
    const withBubbleFeedId = bronApi.keywords.filter(k => k.bubblefeedid);
    const withParentKwId = bronApi.keywords.filter(k => k.parent_keyword_id);
    console.log('[AEO] Keywords with supporting_keywords array:', withSupportingKw.length);
    console.log('[AEO] Keywords with bubblefeedid:', withBubbleFeedId.length);
    console.log('[AEO] Keywords with parent_keyword_id:', withParentKwId.length);
    
    const clusters = groupKeywords(bronApi.keywords, domain);
    console.log('[AEO] Clusters generated:', clusters.length);
    const clustersWithChildren = clusters.filter(c => c.children && c.children.length > 0);
    console.log('[AEO] Clusters with children:', clustersWithChildren.length);
    
    return clusters;
  }, [bronApi.keywords, domain]);

  // Flatten clusters into keyword list with hierarchy info
  useEffect(() => {
    if (keywordClusters.length > 0) {
      console.log('[AEO] Processing clusters:', keywordClusters.length, 'clusters');
      
      const allKeywords: Array<{ 
        keyword: string; 
        position?: number; 
        isNested: boolean; 
        isMainKeyword: boolean;
        childCount: number;
        parentKeyword?: string;
      }> = [];
      
      let totalChildren = 0;
      
      keywordClusters.forEach((cluster, clusterIdx) => {
        const mainKw = cluster.parent;
        const mainKeywordText = getTargetKeyword(mainKw);
        const children = cluster.children || [];
        totalChildren += children.length;
        
        // Add main keyword
        allKeywords.push({
          keyword: mainKeywordText,
          position: mainKw.position || clusterIdx + 1,
          isNested: false,
          isMainKeyword: children.length > 0,
          childCount: children.length,
        });
        
        // Add ALL supporting keywords (up to 5 per parent)
        children.slice(0, 5).forEach((child, childIdx) => {
          const childKeywordText = getTargetKeyword(child);
          if (childKeywordText && childKeywordText.toLowerCase() !== mainKeywordText.toLowerCase()) {
            allKeywords.push({
              keyword: childKeywordText,
              position: child.position || (clusterIdx + 1) * 100 + childIdx + 1,
              isNested: true,
              isMainKeyword: false,
              childCount: 0,
              parentKeyword: mainKeywordText,
            });
          }
        });
      });
      
      console.log('[AEO] Total children found:', totalChildren);
      console.log('[AEO] Keywords with hierarchy:', allKeywords.filter(k => k.isNested).length, 'nested');
      
      // Limit to reasonable number
      const limitedKeywords = allKeywords.slice(0, 60);
      setBronKeywords(limitedKeywords);
      setIsLoadingKeywords(false);
      
      // Initialize keyword results (preserve cached)
      const initialResults: Record<string, KeywordAEOResult> = {};
      limitedKeywords.forEach(kw => {
        if (!keywordResults[kw.keyword]) {
          initialResults[kw.keyword] = {
            keyword: kw.keyword,
            isLoading: false,
            results: [],
            suggestions: [],
          };
        }
      });
      if (Object.keys(initialResults).length > 0) {
        setKeywordResults(prev => ({ ...prev, ...initialResults }));
      }
    }
  }, [keywordClusters, domain]);

  // Auto-start check when keywords are loaded and we have no cached results
  useEffect(() => {
    if (
      bronKeywords.length > 0 && 
      !isAutoRunning && 
      !isLoadingKeywords &&
      hasAutoStartedRef.current !== domain &&
      selectedDate === 'today'
    ) {
      // Check if we need to run checks
      const uncheckedCount = bronKeywords.filter(kw => {
        const result = keywordResults[kw.keyword];
        return !result?.results?.length || needsRefresh(result);
      }).length;
      
      if (uncheckedCount > 0) {
        hasAutoStartedRef.current = domain;
        // Auto-start after short delay
        setTimeout(() => {
          startAutoRun();
        }, 1000);
      }
    }
  }, [bronKeywords, isAutoRunning, isLoadingKeywords, domain, keywordResults, selectedDate]);

  // Handle date selection change
  const handleDateChange = useCallback(async (date: string) => {
    setSelectedDate(date);
    autoRunAbortRef.current = true;
    setIsAutoRunning(false);
    
    if (date === 'today') {
      const cached = await loadCachedResults();
      setKeywordResults(prev => {
        const merged = { ...prev };
        Object.keys(cached).forEach(k => {
          merged[k] = cached[k];
        });
        return merged;
      });
    } else {
      const historical = await loadCachedResults(date);
      setKeywordResults(historical);
    }
  }, [loadCachedResults]);
  
  const checkKeyword = useCallback(async (keyword: string) => {
    setKeywordResults(prev => ({
      ...prev,
      [keyword]: {
        ...prev[keyword],
        keyword,
        isLoading: true,
        results: [],
        suggestions: [],
      }
    }));
    
    try {
      const { data, error } = await supabase.functions.invoke('aeo-llm-check', {
        body: { keyword, domain, queryType: 'direct' }
      });
      
      if (error) throw error;
      
      const newResult: KeywordAEOResult = {
        keyword,
        isLoading: false,
        results: data.results || [],
        suggestions: data.suggestions || [],
        timestamp: data.timestamp,
      };
      
      setKeywordResults(prev => ({ ...prev, [keyword]: newResult }));
      
      // Save to database
      await saveResultToDb(keyword, newResult);
      
      return true;
    } catch (error) {
      console.error('Error checking keyword:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to check LLMs';
      
      if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
        toast.error('Rate limit hit. Pausing auto-check...');
        return false;
      } else if (errorMessage.includes('Payment required') || errorMessage.includes('402')) {
        toast.error('API credits exhausted. Please add credits to continue.');
        return false;
      }
      
      setKeywordResults(prev => ({
        ...prev,
        [keyword]: {
          keyword,
          isLoading: false,
          results: [],
          suggestions: [],
          error: errorMessage,
        }
      }));
      return true;
    }
  }, [domain, saveResultToDb]);
  
  // Check keyword and then start training session
  const handleCheckAndTrain = useCallback(async (keyword: string) => {
    // First do the initial check
    const checkSuccess = await checkKeyword(keyword);
    if (!checkSuccess) return;
    
    // Then start a training session via the scheduled check function
    toast.info(`Starting LLM training for "${keyword}"...`);
    
    try {
      const { data, error } = await supabase.functions.invoke('aeo-scheduled-check', {
        body: { 
          action: 'train_keyword',
          domain,
          keyword,
        }
      });
      
      if (error) {
        console.error('Training start error:', error);
        toast.error('Failed to start training session');
        return;
      }
      
      // Update the result with training data
      if (data?.results) {
        setKeywordResults(prev => ({
          ...prev,
          [keyword]: {
            keyword,
            isLoading: false,
            results: data.results || [],
            suggestions: data.suggestions || [],
            timestamp: data.timestamp,
          }
        }));
        
        toast.success(`Training session completed for "${keyword}"`);
      }
    } catch (e) {
      console.error('Training error:', e);
      toast.error('Training session failed');
    }
  }, [domain, checkKeyword]);
  
  // Auto-run checks sequentially
  const startAutoRun = useCallback(async () => {
    if (bronKeywords.length === 0) {
      toast.info('No keywords to check');
      return;
    }
    
    setIsAutoRunning(true);
    autoRunAbortRef.current = false;
    
    for (let i = 0; i < bronKeywords.length; i++) {
      if (autoRunAbortRef.current) break;
      
      const keyword = bronKeywords[i].keyword;
      
      // Skip if already checked and fresh
      const existing = keywordResults[keyword];
      if (existing?.results?.length > 0 && !needsRefresh(existing)) {
        continue;
      }
      
      setCurrentCheckIndex(i);
      const success = await checkKeyword(keyword);
      if (!success) break;
      
      // Delay between checks (1.5 seconds)
      if (i < bronKeywords.length - 1 && !autoRunAbortRef.current) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    setIsAutoRunning(false);
    if (!autoRunAbortRef.current) {
      toast.success('Finished checking all keywords');
      loadAvailableDates(); // Refresh available dates
    }
  }, [bronKeywords, keywordResults, checkKeyword, needsRefresh, loadAvailableDates]);
  
  const stopAutoRun = useCallback(() => {
    autoRunAbortRef.current = true;
    setIsAutoRunning(false);
    toast.info('Auto-check paused');
  }, []);
  
  // Stats (memoized) - Only count results for keywords that exist in bronKeywords
  const stats = useMemo(() => {
    // Create a set of valid keyword names for fast lookup
    const validKeywords = new Set(bronKeywords.map(k => k.keyword));
    
    // Only count checked results for keywords that exist in the current bronKeywords list
    const relevantResults = Object.entries(keywordResults)
      .filter(([keyword]) => validKeywords.has(keyword))
      .map(([, result]) => result);
    
    const checked = relevantResults.filter(r => r.results.length > 0).length;
    const prominent = relevantResults
      .flatMap(r => r.results)
      .filter(r => r.position === 'prominent').length;
    const mentioned = relevantResults
      .flatMap(r => r.results)
      .filter(r => r.position === 'mentioned').length;
    
    // Count main vs supporting keywords
    const mainCount = bronKeywords.filter(k => !k.isNested).length;
    const supportingCount = bronKeywords.filter(k => k.isNested).length;
    
    // Total keywords = main + supporting
    const totalKeywords = bronKeywords.length;
    
    // Count training sessions and last trained date
    const trainedKeywords = relevantResults.filter(r => 
      r.suggestions?.some(s => s.includes('Training session completed') || s.includes('rounds trained'))
    );
    const trainingInProgress = relevantResults.some(r => 
      r.suggestions?.some(s => s.includes('Training in progress'))
    );
    
    // Get most recent training timestamp
    const timestamps = relevantResults
      .filter(r => r.timestamp)
      .map(r => new Date(r.timestamp!).getTime())
      .filter(t => !isNaN(t));
    const lastTrainedAt = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null;
    
    // Count total rounds trained across all keywords
    const totalRoundsTrained = relevantResults.reduce((acc, r) => {
      const rounds = [...new Set(r.results.filter(res => res.roundNumber).map(res => res.roundNumber))];
      return acc + rounds.length;
    }, 0);
    
    return { 
      checked, 
      totalKeywords,
      prominent, 
      mentioned, 
      mainCount, 
      supportingCount,
      trainedCount: trainedKeywords.length,
      trainingInProgress,
      lastTrainedAt,
      totalRoundsTrained,
    };
  }, [keywordResults, bronKeywords]);

  // Date options for selector
  const dateOptions = useMemo(() => {
    const options = [{ value: 'today', label: 'Today (Live)' }];
    availableDates.forEach(date => {
      const d = new Date(date + 'T00:00:00');
      if (!isToday(d)) {
        options.push({ 
          value: date, 
          label: format(d, 'MMM d, yyyy')
        });
      }
    });
    return options;
  }, [availableDates]);

  return (
    <div className="space-y-6" style={{ contain: 'layout style' }}>
      {/* Header with Date Selector - Static, no blur effects */}
      <div 
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-fuchsia-500/20 border border-violet-500/30 p-6"
        style={{ contain: 'layout style paint', transform: 'translateZ(0)' }}
      >
        <div className="relative z-10 flex flex-col gap-4">
          {/* Title row */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                AEO / GEO Intelligence
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Checking how your keywords appear across ChatGPT, Gemini, and other AI models.
              </p>
            </div>
          </div>
          
          {/* Controls row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Date Selector */}
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedDate} onValueChange={handleDateChange}>
                <SelectTrigger className="w-[180px] h-9 bg-background/50 border-border/50">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  {dateOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLoadingHistory && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
            
            {/* Stats & Controls */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Training Status Indicator */}
              {stats.trainingInProgress && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/20 border border-violet-500/40 rounded-xl">
                  <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                  <div>
                    <p className="text-sm font-bold text-violet-300">Training Active</p>
                    <p className="text-[10px] text-violet-400/80">LLM optimization in progress</p>
                  </div>
                </div>
              )}
              
              {/* Main Stats Grid - LARGER */}
              <div className="flex items-center gap-3">
                {/* Checked Count */}
                <div className="text-center px-5 py-3 bg-background/60 rounded-xl border border-border/50 min-w-[90px]">
                  <p className="text-2xl font-bold text-foreground">{stats.checked}/{stats.totalKeywords}</p>
                  <p className="text-xs text-muted-foreground font-medium">Checked</p>
                </div>
                
                {/* Main + Support */}
                {stats.supportingCount > 0 && (
                  <div className="text-center px-4 py-3 bg-cyan-500/15 rounded-xl border border-cyan-500/40">
                    <p className="text-xl font-bold text-cyan-400">{stats.mainCount} + {stats.supportingCount}</p>
                    <p className="text-[10px] text-cyan-400/80 font-medium">Main + Support</p>
                  </div>
                )}
                
                {/* Prominent Count */}
                <div className="text-center px-5 py-3 bg-emerald-500/15 rounded-xl border border-emerald-500/40 min-w-[85px]">
                  <p className="text-2xl font-bold text-emerald-400">{stats.prominent}</p>
                  <p className="text-xs text-emerald-400/80 font-medium">Prominent</p>
                </div>
                
                {/* Mentioned Count */}
                <div className="text-center px-5 py-3 bg-amber-500/15 rounded-xl border border-amber-500/40 min-w-[85px]">
                  <p className="text-2xl font-bold text-amber-400">{stats.mentioned}</p>
                  <p className="text-xs text-amber-400/80 font-medium">Mentioned</p>
                </div>
                
                {/* Training Stats */}
                <div className="text-center px-4 py-3 bg-violet-500/15 rounded-xl border border-violet-500/40">
                  <p className="text-xl font-bold text-violet-400">{stats.totalRoundsTrained}</p>
                  <p className="text-[10px] text-violet-400/80 font-medium">Rounds Trained</p>
                </div>
              </div>
              
              {/* Last Trained Badge */}
              {stats.lastTrainedAt && !stats.trainingInProgress && (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-border/50">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div className="text-xs">
                    <span className="text-muted-foreground">Last trained: </span>
                    <span className="font-medium text-foreground">
                      {differenceInDays(new Date(), stats.lastTrainedAt) === 0 
                        ? 'Today'
                        : differenceInDays(new Date(), stats.lastTrainedAt) === 1
                          ? 'Yesterday'
                          : format(stats.lastTrainedAt, 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Action Button */}
              {bronKeywords.length > 0 && selectedDate === 'today' && (
                <Button 
                  onClick={isAutoRunning ? stopAutoRun : startAutoRun}
                  disabled={isLoadingKeywords}
                  size="lg"
                  className={isAutoRunning 
                    ? "bg-red-500 hover:bg-red-600 px-6" 
                    : "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 px-6 shadow-lg shadow-violet-500/30"
                  }
                >
                  {isAutoRunning ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      {stats.checked > 0 ? 'Resume' : 'Start Training'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          
          {/* Progress bar during auto-run */}
          {isAutoRunning && (
            <div className="mt-4 p-3 bg-background/40 rounded-xl">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                  <span className="font-medium">Checking: <span className="text-violet-300">{bronKeywords[currentCheckIndex]?.keyword || '...'}</span></span>
                </div>
                <span className="font-medium">{currentCheckIndex + 1} of {bronKeywords.length}</span>
              </div>
              <Progress value={((currentCheckIndex + 1) / bronKeywords.length) * 100} className="h-2.5" />
            </div>
          )}
        </div>
      </div>
      
      {/* Trend Summary - Shows improvement over time */}
      <TrendSummaryCard 
        domain={domain} 
        currentStats={stats} 
        availableDates={availableDates} 
      />
      
      {/* Keywords List - Render only when keywords exist, no empty states */}
      {bronKeywords.length > 0 && (
        <div 
          className="space-y-2" 
          style={{ 
            contain: 'layout style paint',
            willChange: 'auto',
            transform: 'translateZ(0)',
          }}
        >
          {bronKeywords.map((kw, idx) => (
            <KeywordAEOCard
              key={`${kw.keyword}-${idx}`}
              data={keywordResults[kw.keyword] || { keyword: kw.keyword, isLoading: false, results: [], suggestions: [] }}
              isExpanded={expandedKeyword === kw.keyword}
              onToggle={() => setExpandedKeyword(prev => prev === kw.keyword ? null : kw.keyword)}
              position={kw.isNested ? undefined : kw.position}
              onRecheck={() => handleCheckAndTrain(kw.keyword)}
              isNested={kw.isNested}
              isMainKeyword={kw.isMainKeyword}
              childCount={kw.childCount}
            />
          ))}
        </div>
      )}
      
      {/* Info Card */}
      <Card className="bg-gradient-to-r from-muted/30 to-muted/10 border-muted-foreground/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">About AEO/GEO</p>
              <p>
                Answer Engine Optimization focuses on getting your brand mentioned by AI assistants. 
                Reports are cached weekly and auto-run when keywords are loaded. Use the date selector to view historical results.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

AEOGeoDashboard.displayName = 'AEOGeoDashboard';

export default AEOGeoDashboard;
