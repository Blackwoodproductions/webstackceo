import { memo } from "react";
import { Edit2, Save, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      className="border-t border-border/30 p-6 bg-gradient-to-b from-background/50 to-transparent space-y-4"
      onClick={(e) => e.stopPropagation()}
      style={{ contain: 'layout paint' }}
    >
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

      {/* Citation Analytics - Only show cluster-related links */}
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
