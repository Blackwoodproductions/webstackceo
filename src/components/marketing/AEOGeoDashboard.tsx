import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, Search, Loader2, CheckCircle, XCircle, AlertCircle, 
  ChevronDown, ChevronRight, Lightbulb, Sparkles, Target, TrendingUp,
  MessageSquare, Zap, ExternalLink, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  keywords?: Array<{ keyword: string; position?: number }>;
}

const LLM_ICONS: Record<string, string> = {
  'Google Gemini': '🔷',
  'ChatGPT': '🟢',
  'GPT-5 Mini': '🟡',
  'Claude': '🟣',
  'Perplexity': '🔵',
  'Copilot': '🔶',
  'Llama': '🦙',
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
    <div className={`p-4 rounded-lg border transition-all ${
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
  onCheck
}: { 
  data: KeywordAEOResult; 
  isExpanded: boolean; 
  onToggle: () => void;
  onCheck: (keyword: string) => void;
}) => {
  const prominentCount = data.results.filter(r => r.position === 'prominent').length;
  const mentionedCount = data.results.filter(r => r.position === 'mentioned').length;
  const totalChecked = data.results.filter(r => !r.error).length;
  const successRate = totalChecked > 0 
    ? Math.round(((prominentCount + mentionedCount) / totalChecked) * 100) 
    : 0;

  return (
    <Card className="bg-card/80 border-border/50 backdrop-blur-sm overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <div>
                  <CardTitle className="text-base font-semibold">{data.keyword}</CardTitle>
                  {data.timestamp && (
                    <CardDescription className="text-[10px]">
                      Last checked: {new Date(data.timestamp).toLocaleString()}
                    </CardDescription>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {data.isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Checking LLMs...</span>
                  </div>
                ) : data.results.length > 0 ? (
                  <>
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
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCheck(data.keyword);
                    }}
                    className="text-xs"
                  >
                    <Search className="w-3 h-3 mr-1" />
                    Check LLMs
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
                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.results.map((result, idx) => (
                    <LLMResultCard key={`${result.model}-${result.queryUsed}-${idx}`} result={result} />
                  ))}
                </div>
                
                {/* Optimization Suggestions */}
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
            ) : (
              <div className="text-center py-8">
                <BrainCircuit className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Click "Check LLMs" to see how this keyword appears across AI models
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
});
KeywordAEOCard.displayName = 'KeywordAEOCard';

export const AEOGeoDashboard = memo(({ domain, keywords = [] }: AEOGeoDashboardProps) => {
  const [keywordResults, setKeywordResults] = useState<Record<string, KeywordAEOResult>>({});
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null);
  const [customKeyword, setCustomKeyword] = useState('');
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  
  const checkKeyword = useCallback(async (keyword: string) => {
    setKeywordResults(prev => ({
      ...prev,
      [keyword]: {
        keyword,
        isLoading: true,
        results: [],
        suggestions: [],
      }
    }));
    setExpandedKeyword(keyword);
    
    try {
      const { data, error } = await supabase.functions.invoke('aeo-llm-check', {
        body: { keyword, domain, queryType: 'both' }
      });
      
      if (error) throw error;
      
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
    } catch (error) {
      console.error('Error checking keyword:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to check LLMs';
      
      // Handle specific error types
      if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
        toast.error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (errorMessage.includes('Payment required') || errorMessage.includes('402')) {
        toast.error('API credits exhausted. Please add credits to continue.');
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
    }
  }, [domain]);
  
  const handleAddCustomKeyword = useCallback(() => {
    if (!customKeyword.trim()) return;
    checkKeyword(customKeyword.trim());
    setCustomKeyword('');
  }, [customKeyword, checkKeyword]);
  
  const checkAllKeywords = useCallback(async () => {
    if (keywords.length === 0) {
      toast.info('No keywords to check. Add keywords from the BRON tab first.');
      return;
    }
    
    setIsCheckingAll(true);
    
    for (const kw of keywords.slice(0, 10)) { // Limit to 10 to avoid rate limits
      await checkKeyword(kw.keyword);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay between checks
    }
    
    setIsCheckingAll(false);
    toast.success('Finished checking all keywords');
  }, [keywords, checkKeyword]);
  
  // Combine BRON keywords with any custom checks
  const allKeywords = [
    ...keywords.map(k => k.keyword),
    ...Object.keys(keywordResults).filter(k => !keywords.some(kw => kw.keyword === k))
  ];
  
  // Stats
  const checkedCount = Object.values(keywordResults).filter(r => r.results.length > 0).length;
  const prominentCount = Object.values(keywordResults)
    .flatMap(r => r.results)
    .filter(r => r.position === 'prominent').length;
  const mentionedCount = Object.values(keywordResults)
    .flatMap(r => r.results)
    .filter(r => r.position === 'mentioned').length;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-fuchsia-500/20 border border-violet-500/30 p-8">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl"
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 6, repeat: Infinity }}
          />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <BrainCircuit className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                AEO / GEO Intelligence
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                Answer Engine Optimization - Check how your keywords appear across ChatGPT, Gemini, Claude, and other AI models. Get actionable suggestions to improve your AI visibility.
              </p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 bg-background/50 rounded-lg border border-border/50">
              <p className="text-2xl font-bold text-foreground">{checkedCount}</p>
              <p className="text-[10px] text-muted-foreground">Checked</p>
            </div>
            <div className="text-center px-4 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
              <p className="text-2xl font-bold text-emerald-400">{prominentCount}</p>
              <p className="text-[10px] text-emerald-400/70">Prominent</p>
            </div>
            <div className="text-center px-4 py-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <p className="text-2xl font-bold text-amber-400">{mentionedCount}</p>
              <p className="text-[10px] text-amber-400/70">Mentioned</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Add custom keyword to check..."
            value={customKeyword}
            onChange={(e) => setCustomKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomKeyword()}
            className="bg-muted/30"
          />
          <Button 
            onClick={handleAddCustomKeyword}
            disabled={!customKeyword.trim()}
            className="shrink-0"
          >
            <Search className="w-4 h-4 mr-2" />
            Check
          </Button>
        </div>
        
        {keywords.length > 0 && (
          <Button 
            variant="outline" 
            onClick={checkAllKeywords}
            disabled={isCheckingAll}
            className="border-violet-500/30 hover:bg-violet-500/10"
          >
            {isCheckingAll ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Check All ({Math.min(keywords.length, 10)})
              </>
            )}
          </Button>
        )}
      </div>
      
      {/* Keywords List */}
      <div className="space-y-3">
        {allKeywords.length === 0 ? (
          <Card className="bg-muted/20 border-dashed">
            <CardContent className="py-12 text-center">
              <BrainCircuit className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Keywords to Check</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Add keywords from the BRON tab to track them here, or enter a custom keyword above to check its AI engine presence.
              </p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {allKeywords.map((keyword, idx) => (
              <motion.div
                key={keyword}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: idx * 0.05 }}
              >
                <KeywordAEOCard
                  data={keywordResults[keyword] || { keyword, isLoading: false, results: [], suggestions: [] }}
                  isExpanded={expandedKeyword === keyword}
                  onToggle={() => setExpandedKeyword(prev => prev === keyword ? null : keyword)}
                  onCheck={checkKeyword}
                />
              </motion.div>
            ))}
          </AnimatePresence>
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
                Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO) focus on 
                getting your brand and services mentioned by AI assistants like ChatGPT and Google Gemini. 
                Unlike traditional SEO, AEO targets the training data and real-time search integrations 
                that power conversational AI responses.
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
