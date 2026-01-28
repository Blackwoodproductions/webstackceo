import { memo } from "react";
import { Edit2, Save, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BronKeyword, BronLink } from "@/hooks/use-bron-api";
import { BronCitationAnalytics } from "./BronCitationAnalytics";
import { getKeywordDisplayText } from "./BronKeywordCard";

interface InlineFormData {
  keywordtitle: string;
  metatitle: string;
  metadescription: string;
  resfeedtext: string;
  linkouturl: string;
  resaddress: string;
  resfb: string;
}

interface BronKeywordExpandedProps {
  keyword: BronKeyword;
  isTrackingOnly: boolean;
  selectedDomain?: string;
  linksIn: BronLink[];
  linksOut: BronLink[];
  formData: InlineFormData;
  isSaving: boolean;
  onUpdateForm: (field: string, value: string) => void;
  onSave: () => void;
  onOpenArticleEditor: () => void;
}

// Helper functions
function decodeHtmlContent(html: string): string {
  if (!html) return '';
  return html
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–').replace(/&nbsp;/g, ' ');
}

function stripHtmlTags(html: string): string {
  return decodeHtmlContent(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getWordCount(html: string): number {
  const text = stripHtmlTags(html);
  if (!text) return 0;
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function getMetaTitleQuality(title: string): { score: 'good' | 'warning' | 'poor'; label: string } {
  const len = title?.length || 0;
  if (len === 0) return { score: 'poor', label: 'Missing' };
  if (len >= 30 && len <= 60) return { score: 'good', label: `${len}/60` };
  if (len < 30) return { score: 'warning', label: `${len}/60 (short)` };
  return { score: 'warning', label: `${len}/60 (long)` };
}

function getMetaDescQuality(desc: string): { score: 'good' | 'warning' | 'poor'; label: string } {
  const len = desc?.length || 0;
  if (len === 0) return { score: 'poor', label: 'Missing' };
  if (len >= 120 && len <= 160) return { score: 'good', label: `${len}/160` };
  if (len < 120) return { score: 'warning', label: `${len}/160 (short)` };
  return { score: 'warning', label: `${len}/160 (long)` };
}

const scoreBg = (score: 'good' | 'warning' | 'poor') => ({
  good: 'bg-emerald-500/10 border-emerald-500/20',
  warning: 'bg-amber-500/10 border-amber-500/20',
  poor: 'bg-red-500/10 border-red-500/20',
}[score]);

export const BronKeywordExpanded = memo(({
  keyword: kw,
  isTrackingOnly,
  selectedDomain,
  linksIn,
  linksOut,
  formData,
  isSaving,
  onUpdateForm,
  onSave,
  onOpenArticleEditor,
}: BronKeywordExpandedProps) => {
  const keywordText = getKeywordDisplayText(kw);
  const titleQuality = getMetaTitleQuality(formData.metatitle);
  const descQuality = getMetaDescQuality(formData.metadescription);
  const wordCount = getWordCount(formData.resfeedtext);

  // Tracking-only keywords show simplified view
  if (isTrackingOnly) {
    return (
      <div 
        className="border-t border-amber-500/20 p-6 bg-gradient-to-b from-amber-500/5 to-transparent"
        onClick={(e) => e.stopPropagation()}
        style={{ contain: 'layout paint' }}
      >
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-amber-400" />
          </div>
          <h4 className="font-semibold text-lg mb-2">Tracking Only Keyword</h4>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
            This keyword is being tracked in SERP rankings but doesn't have a dedicated content page yet.
          </p>
          <Button 
            variant="default"
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={(e) => {
              e.stopPropagation();
              // Could trigger page creation flow here
            }}
          >
            <FileText className="w-4 h-4 mr-2" />
            Create Content Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="border-t border-border/30 p-6 bg-gradient-to-b from-background/50 to-transparent space-y-6"
      onClick={(e) => e.stopPropagation()}
      style={{ contain: 'layout paint' }}
    >
      {/* SEO Fields Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Meta Title */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">Meta Title</Label>
            <span className={`text-[10px] px-2 py-0.5 rounded border ${scoreBg(titleQuality.score)}`}>
              {titleQuality.label}
            </span>
          </div>
          <Input
            value={formData.metatitle}
            onChange={(e) => onUpdateForm('metatitle', e.target.value)}
            placeholder="SEO-optimized meta title..."
            className="h-9 text-sm bg-background/50"
          />
        </div>
        
        {/* Page URL */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Page URL</Label>
          <Input
            value={formData.linkouturl}
            onChange={(e) => onUpdateForm('linkouturl', e.target.value)}
            placeholder={`https://${selectedDomain}/...`}
            className="h-9 text-sm bg-background/50"
          />
        </div>
        
        {/* Meta Description - Full Width */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">Meta Description</Label>
            <span className={`text-[10px] px-2 py-0.5 rounded border ${scoreBg(descQuality.score)}`}>
              {descQuality.label}
            </span>
          </div>
          <Textarea
            value={formData.metadescription}
            onChange={(e) => onUpdateForm('metadescription', e.target.value)}
            placeholder="Compelling meta description for search results..."
            className="min-h-[60px] text-sm bg-background/50 resize-none"
          />
        </div>
      </div>

      {/* Content Preview & Actions */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/30">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Article Content</p>
            <p className="text-xs text-muted-foreground">
              {wordCount > 0 ? `${wordCount} words` : 'No content yet'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onSave}
            disabled={isSaving}
            className="h-8"
          >
            <Save className={`w-3.5 h-3.5 mr-1 ${isSaving ? 'animate-spin' : ''}`} />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={onOpenArticleEditor}
            className="h-8"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1" />
            Edit
          </Button>
        </div>
      </div>

      {/* Citation Analytics */}
      <BronCitationAnalytics
        keywordId={kw.id}
        keywordText={keywordText}
        linksIn={linksIn}
        linksOut={linksOut}
      />
    </div>
  );
});

BronKeywordExpanded.displayName = 'BronKeywordExpanded';
