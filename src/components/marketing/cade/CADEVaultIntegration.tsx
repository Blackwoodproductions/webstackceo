import { useState, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Archive, FileText, Star, RefreshCw, Loader2, Sparkles, 
  ChevronRight, ExternalLink, Play, Tag, Calendar, Target, Trash2, Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface VaultItem {
  id: string;
  title: string;
  report_type: string;
  summary: string | null;
  content: unknown;
  tags: string[] | null;
  is_favorite: boolean | null;
  created_at: string;
  domain: string | null;
}

interface CADEVaultIntegrationProps {
  domain?: string;
  onGenerateFromPlan?: (vaultItem: VaultItem) => Promise<void>;
  /** Compact mode shows a condensed view for sidebar/floating panels */
  compact?: boolean;
  /** Height for the scroll area (default: 450px, compact: 250px) */
  height?: string;
}

export const CADEVaultIntegration = memo(function CADEVaultIntegration({
  domain,
  onGenerateFromPlan,
  compact = false,
  height,
}: CADEVaultIntegrationProps) {
  const { user } = useAuth();
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch vault items for the current domain
  const fetchVaultItems = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      let query = supabase
        .from('seo_vault')
        .select('id, title, report_type, summary, content, tags, is_favorite, created_at, domain')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Filter by domain - show domain-specific items only (not global)
      if (domain) {
        query = query.eq('domain', domain);
      }

      const { data, error } = await query.limit(20);

      if (error) {
        console.error('[Vault] Fetch error:', error);
        return;
      }

      setVaultItems(data || []);
    } catch (err) {
      console.error('[Vault] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, domain]);

  // Initial load
  useEffect(() => {
    fetchVaultItems();
  }, [fetchVaultItems]);

  // Delete vault item
  const handleDeleteItem = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('seo_vault')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setVaultItems(prev => prev.filter(item => item.id !== id));
      toast.success('Report deleted from vault');
    } catch (err) {
      console.error('Failed to delete vault item:', err);
      toast.error('Failed to delete report');
    }
  }, [user]);

  // Generate article from vault plan
  const handleGenerateFromVault = useCallback(async (item: VaultItem) => {
    if (!domain) {
      toast.error("Please select a domain first");
      return;
    }

    setGeneratingId(item.id);
    try {
      // Extract keywords/topics from the vault item content
      const content = item.content as Record<string, unknown> | null;
      const keywords = extractKeywordsFromContent(content, item.title);

      // Call CADE API to generate content based on vault plan
      const { data, error } = await supabase.functions.invoke("cade-api", {
        body: {
          action: "generate-content",
          domain,
          params: {
            keyword: keywords[0] || item.title,
            title_suggestion: item.title,
            source: "seo_vault",
            vault_item_id: item.id,
            context: item.summary || '',
            additional_keywords: keywords.slice(1),
          },
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast.success("Article generation started from SEO plan!", {
        description: `Creating content for: ${item.title}`,
      });

      // Call parent callback if provided
      if (onGenerateFromPlan) {
        await onGenerateFromPlan(item);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate article";
      toast.error(message);
    } finally {
      setGeneratingId(null);
    }
  }, [domain, onGenerateFromPlan]);

  // Extract keywords from vault content
  const extractKeywordsFromContent = (content: unknown, fallbackTitle: string): string[] => {
    if (!content || typeof content !== 'object') {
      return [fallbackTitle];
    }

    const c = content as Record<string, unknown>;
    const keywords: string[] = [];

    // Try to extract keywords from various content formats
    if (Array.isArray(c.keywords)) {
      keywords.push(...c.keywords.filter((k): k is string => typeof k === 'string'));
    }
    if (Array.isArray(c.target_keywords)) {
      keywords.push(...c.target_keywords.filter((k): k is string => typeof k === 'string'));
    }
    if (typeof c.primary_keyword === 'string') {
      keywords.unshift(c.primary_keyword);
    }
    if (typeof c.keyword === 'string') {
      keywords.unshift(c.keyword);
    }
    // Try to extract from nested structures
    if (c.plan && typeof c.plan === 'object') {
      const plan = c.plan as Record<string, unknown>;
      if (typeof plan.keyword === 'string') keywords.push(plan.keyword);
      if (Array.isArray(plan.topics)) {
        keywords.push(...plan.topics.filter((t): t is string => typeof t === 'string'));
      }
    }

    return keywords.length > 0 ? [...new Set(keywords)] : [fallbackTitle];
  };

  // Get report type color - expanded to include more types
  const getReportTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      keyword_research: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
      content_plan: 'from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-400',
      seo_audit: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
      competitor_analysis: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
      backlink_report: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
      serp_analysis: 'from-pink-500/20 to-pink-600/10 border-pink-500/30 text-pink-400',
      monthly_seo_report: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
      traffic_report: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
      topic_cluster: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-400',
    };
    return colors[type] || 'from-primary/20 to-primary/10 border-primary/30 text-primary';
  };

  // Content plans that can be used for article generation - expanded list
  const actionablePlans = vaultItems.filter(item => 
    ['keyword_research', 'content_plan', 'topic_cluster', 'monthly_seo_report', 'competitor_analysis'].includes(item.report_type)
  );

  const scrollHeight = height || (compact ? "h-[250px]" : "h-[450px]");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`${compact ? 'w-10 h-10' : 'w-14 h-14'} rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-600/20 flex items-center justify-center border-2 border-amber-500/50 shadow-lg shadow-amber-500/20 relative overflow-hidden`}>
            {/* Safe door effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-400/10 to-transparent" />
            <div className="absolute top-1 left-1 right-1 h-0.5 bg-amber-400/30 rounded-full" />
            <div className="relative flex flex-col items-center">
              <Archive className={`${compact ? 'w-5 h-5' : 'w-7 h-7'} text-amber-400`} />
              {!compact && <div className="w-2 h-2 rounded-full bg-amber-500 mt-0.5 shadow-sm shadow-amber-400/50" />}
            </div>
          </div>
          <div>
            <h3 className={`font-semibold text-foreground ${compact ? 'text-sm' : ''}`}>SEO Vault</h3>
            <p className="text-xs text-muted-foreground">
              {vaultItems.length} report{vaultItems.length !== 1 ? 's' : ''} saved{actionablePlans.length > 0 ? ` • ${actionablePlans.length} actionable` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Generate Ideas Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const aiGenerateCadeIdeas = (window as any).aiGenerateCadeIdeas;
                    if (aiGenerateCadeIdeas) {
                      aiGenerateCadeIdeas();
                      window.dispatchEvent(new CustomEvent('open-ai-assistant'));
                    } else {
                      toast.info('Open the AI Assistant to generate content ideas');
                      window.dispatchEvent(new CustomEvent('open-ai-assistant'));
                    }
                  }}
                  className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10"
                >
                  <Wand2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Generate ideas with AI</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Refresh Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchVaultItems}
                  disabled={isLoading}
                  className="h-8 w-8"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh vault</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Vault Items List */}
      <ScrollArea className={scrollHeight}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : vaultItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
              <Archive className="w-8 h-8 text-amber-400/50" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">No saved plans yet</p>
            <p className="text-xs text-muted-foreground/70 max-w-[200px] mb-4">
              Use the AI Assistant to create keyword research and content plans, then save them to the vault
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // Trigger AI to generate content ideas
                const aiGenerateCadeIdeas = (window as any).aiGenerateCadeIdeas;
                if (aiGenerateCadeIdeas) {
                  aiGenerateCadeIdeas();
                  // Open AI assistant panel
                  window.dispatchEvent(new CustomEvent('open-ai-assistant'));
                } else {
                  toast.info('Open the AI Assistant to generate content ideas');
                  window.dispatchEvent(new CustomEvent('open-ai-assistant'));
                }
              }}
              className="gap-2 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
            >
              <Wand2 className="w-4 h-4" />
              Generate Ideas with AI
            </Button>
          </div>
        ) : (
          <div className="space-y-2 pr-2">
            {vaultItems.map((item) => {
              // Expanded list of actionable report types for CADE content generation
              const isActionable = ['keyword_research', 'content_plan', 'topic_cluster', 'monthly_seo_report', 'competitor_analysis'].includes(item.report_type);
              const isExpanded = expandedId === item.id;
              const isGenerating = generatingId === item.id;
              const colorClasses = getReportTypeColor(item.report_type);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group"
                >
                  <Card
                    className={`p-3 cursor-pointer transition-all hover:border-primary/30 ${
                      isExpanded ? 'border-primary/50 bg-primary/5' : ''
                    }`}
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${colorClasses} flex items-center justify-center shrink-0 border`}>
                        <FileText className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            className="font-medium text-sm text-foreground line-clamp-1 flex-1"
                            title={item.title}
                          >
                            {item.title}
                          </span>
                          {item.is_favorite && (
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                          )}
                          <ChevronRight 
                            className={`w-4 h-4 text-muted-foreground transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          />
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <Badge 
                            variant="outline" 
                            className={`text-[9px] px-1.5 py-0 h-4 bg-gradient-to-r ${colorClasses}`}
                          >
                            {item.report_type.replace(/_/g, ' ')}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                          {item.domain && (
                            <span className="flex items-center gap-1 truncate max-w-[100px]">
                              <Target className="w-3 h-3" />
                              {item.domain}
                            </span>
                          )}
                        </div>

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            <Tag className="w-3 h-3 text-muted-foreground" />
                            {item.tags.slice(0, 3).map((tag, i) => (
                              <Badge 
                                key={i} 
                                variant="secondary" 
                                className="text-[9px] px-1.5 py-0 h-4"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {item.tags.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{item.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                            {/* Summary */}
                            {item.summary && (
                              <p className="text-xs text-muted-foreground line-clamp-3">
                                {item.summary}
                              </p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              {isActionable && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGenerateFromVault(item);
                                  }}
                                  disabled={isGenerating || !domain}
                                  className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white h-7 text-xs"
                                >
                                  {isGenerating ? (
                                    <>
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      Generating...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3 h-3 mr-1" />
                                      Generate Article
                                    </>
                                  )}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Open in AI assistant to view full content
                                  window.dispatchEvent(new CustomEvent('open-ai-assistant'));
                                  window.dispatchEvent(new CustomEvent('ai-show-vault-item', { 
                                    detail: { itemId: item.id } 
                                  }));
                                }}
                                className="h-7 text-xs"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View Full
                              </Button>
                              {/* Delete Button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteItem(item.id);
                                }}
                                className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </div>

                            {!isActionable && (
                              <p className="text-[10px] text-muted-foreground/70 italic">
                                This report type cannot be used for article generation
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Quick Stats */}
      {vaultItems.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              {vaultItems.length} items
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              {actionablePlans.length} actionable
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              {vaultItems.filter(i => i.is_favorite).length} favorites
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

export default CADEVaultIntegration;
