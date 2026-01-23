import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { glossaryTerms } from "@/data/glossaryData";
import { BookOpen } from "lucide-react";

interface GlossaryTooltipProps {
  term: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps text with a tooltip that shows the glossary definition.
 * Links to the full glossary term page.
 */
const GlossaryTooltip = ({ term, children, className = "" }: GlossaryTooltipProps) => {
  // Find the matching term in glossary
  const glossaryTerm = glossaryTerms.find(
    (t) => t.term.toLowerCase() === term.toLowerCase() || t.slug === term.toLowerCase()
  );

  if (!glossaryTerm) {
    // If term not found, just render children without tooltip
    return <>{children}</>;
  }

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <span 
          className={`border-b border-dashed border-primary/50 cursor-help hover:border-primary transition-colors ${className}`}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="max-w-xs p-4 bg-card/95 backdrop-blur-sm border-border/50"
        sideOffset={5}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="font-semibold text-foreground text-sm">{glossaryTerm.term}</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {glossaryTerm.shortDescription}
          </p>
          <Link
            to={`/learn/glossary/${glossaryTerm.slug}`}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
          >
            Learn more →
          </Link>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default GlossaryTooltip;
