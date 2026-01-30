import { useState, useCallback, memo, useEffect, useRef, useMemo } from 'react';
import { 
  BrainCircuit, Loader2, CheckCircle, XCircle, AlertCircle, 
  ChevronDown, ChevronRight, Lightbulb, Sparkles, 
  MessageSquare, Play, Pause, Calendar, History, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBronApi } from '@/hooks/use-bron-api';
import { getTargetKeyword } from './bron/BronKeywordCard';
import { format, subDays, startOfDay, isToday } from 'date-fns';

interface LLMResult {
  model: string;
  modelDisplayName: string;
  mentioned: boolean;
  snippet: string | null;
  position: 'prominent' | 'mentioned' | 'not_found';
  confidence: number;
  queryUsed: string;
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

const KeywordAEOCard = memo(({ 
  data, 
  isExpanded, 
  onToggle,
  position,
  onRecheck,
}: { 
  data: KeywordAEOResult; 
  isExpanded: boolean; 
  onToggle: () => void;
  position?: number;
  onRecheck?: () => void;
}) => {
  const prominentCount = data.results.filter(r => r.position === 'prominent').length;
  const mentionedCount = data.results.filter(r => r.position === 'mentioned').length;
  const totalChecked = data.results.filter(r => !r.error).length;
  const successRate = totalChecked > 0 
    ? Math.round(((prominentCount + mentionedCount) / totalChecked) * 100) 
    : 0;

  return (
    <Card className="bg-card/80 border-border/50 overflow-hidden" style={{ contain: 'layout style' }}>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/20 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <div className="flex items-center gap-2">
                  {position && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary border-primary/30">
                      #{position}
                    </Badge>
                  )}
                  <div>
                    <CardTitle className="text-base font-semibold">{data.keyword}</CardTitle>
                    {data.timestamp && (
                      <CardDescription className="text-[10px]">
                        Checked: {new Date(data.timestamp).toLocaleString()}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {data.isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Checking...</span>
                  </div>
                ) : data.results.length > 0 ? (
                  <>
                    {/* Show re-check button if less than 3 LLM results (stale cache) */}
                    {data.results.length < 3 && onRecheck && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRecheck();
                        }}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Re-check
                      </Button>
                    )}
                    <div className="flex items-center gap-2">
                      <Progress value={successRate} className="w-20 h-2" />
                      <span className="text-xs font-medium text-muted-foreground">{successRate}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {prominentCount > 0 && (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                          {prominentCount} prominent
                        </Badge>
                      )}
                      {mentionedCount > 0 && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]">
                          {mentionedCount} mentioned
                        </Badge>
                      )}
                    </div>
                  </>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Pending
                  </Badge>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.results.map((result, idx) => (
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
                      {data.suggestions.slice(0, 5).map((suggestion, idx) => (
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

export const AEOGeoDashboard = memo(({ domain }: AEOGeoDashboardProps) => {
  const bronApi = useBronApi();
  const [keywordResults, setKeywordResults] = useState<Record<string, KeywordAEOResult>>({});
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [currentCheckIndex, setCurrentCheckIndex] = useState(0);
  const [bronKeywords, setBronKeywords] = useState<Array<{ keyword: string; position?: number }>>([]);
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

  // Fetch BRON keywords for this domain
  useEffect(() => {
    if (!domain || hasFetchedRef.current === domain) return;
    hasFetchedRef.current = domain;
    
    const fetchKeywords = async () => {
      setIsLoadingKeywords(true);
      try {
        // Load cached results first
        const cached = await loadCachedResults();
        if (Object.keys(cached).length > 0) {
          setKeywordResults(cached);
        }
        
        // Load available dates
        await loadAvailableDates();
        
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
  
  // When keywords update, extract keyword text
  useEffect(() => {
    if (bronApi.keywords && bronApi.keywords.length > 0) {
      const keywordMap = new Map<string, number>();
      bronApi.keywords.forEach((kw, idx) => {
        const keyword = getTargetKeyword(kw);
        const position = kw.position || idx + 1;
        if (keyword && !keywordMap.has(keyword)) {
          keywordMap.set(keyword, position);
        }
      });
      
      const keywords = Array.from(keywordMap.entries())
        .map(([keyword, position]) => ({ keyword, position }))
        .sort((a, b) => (a.position || 999) - (b.position || 999))
        .slice(0, 20);
      
      setBronKeywords(keywords);
      setIsLoadingKeywords(false);
      
      // Initialize keyword results (preserve cached)
      const initialResults: Record<string, KeywordAEOResult> = {};
      keywords.forEach(kw => {
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
  }, [bronApi.keywords]);

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
  
  // Stats (memoized)
  const stats = useMemo(() => {
    const checked = Object.values(keywordResults).filter(r => r.results.length > 0).length;
    const prominent = Object.values(keywordResults)
      .flatMap(r => r.results)
      .filter(r => r.position === 'prominent').length;
    const mentioned = Object.values(keywordResults)
      .flatMap(r => r.results)
      .filter(r => r.position === 'mentioned').length;
    return { checked, prominent, mentioned };
  }, [keywordResults]);

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
    <div className="space-y-6">
      {/* Header with Date Selector */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-fuchsia-500/20 border border-violet-500/30 p-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col gap-4">
          {/* Title row */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
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
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="text-center px-3 py-1.5 bg-background/50 rounded-lg border border-border/50">
                  <p className="text-lg font-bold text-foreground">{stats.checked}/{bronKeywords.length}</p>
                  <p className="text-[9px] text-muted-foreground">Checked</p>
                </div>
                <div className="text-center px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                  <p className="text-lg font-bold text-emerald-400">{stats.prominent}</p>
                  <p className="text-[9px] text-emerald-400/70">Prominent</p>
                </div>
                <div className="text-center px-3 py-1.5 bg-amber-500/10 rounded-lg border border-amber-500/30">
                  <p className="text-lg font-bold text-amber-400">{stats.mentioned}</p>
                  <p className="text-[9px] text-amber-400/70">Mentioned</p>
                </div>
              </div>
              
              {bronKeywords.length > 0 && selectedDate === 'today' && (
                <Button 
                  onClick={isAutoRunning ? stopAutoRun : startAutoRun}
                  disabled={isLoadingKeywords}
                  size="sm"
                  className={isAutoRunning 
                    ? "bg-red-500 hover:bg-red-600" 
                    : "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                  }
                >
                  {isAutoRunning ? (
                    <>
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      {stats.checked > 0 ? 'Resume' : 'Start'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          
          {/* Progress bar during auto-run */}
          {isAutoRunning && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Checking: {bronKeywords[currentCheckIndex]?.keyword || '...'}</span>
                <span>{currentCheckIndex + 1} of {bronKeywords.length}</span>
              </div>
              <Progress value={((currentCheckIndex + 1) / bronKeywords.length) * 100} className="h-2" />
            </div>
          )}
        </div>
      </div>
      
      {/* Keywords List - No animations for stability */}
      <div className="space-y-2">
        {isLoadingKeywords ? (
          <Card className="bg-muted/20 border-dashed">
            <CardContent className="py-12 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Loading keywords from BRON...</p>
            </CardContent>
          </Card>
        ) : bronKeywords.length === 0 ? (
          <Card className="bg-muted/20 border-dashed">
            <CardContent className="py-12 text-center">
              <BrainCircuit className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Keywords Found</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Connect your domain in the BRON tab first to track keywords, then return here to check AI engine presence.
              </p>
            </CardContent>
          </Card>
        ) : (
          bronKeywords.map((kw) => (
            <KeywordAEOCard
              key={kw.keyword}
              data={keywordResults[kw.keyword] || { keyword: kw.keyword, isLoading: false, results: [], suggestions: [] }}
              isExpanded={expandedKeyword === kw.keyword}
              onToggle={() => setExpandedKeyword(prev => prev === kw.keyword ? null : kw.keyword)}
              position={kw.position}
              onRecheck={() => checkKeyword(kw.keyword)}
            />
          ))
        )}
      </div>
      
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
