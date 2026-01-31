import { memo } from "react";
import { BarChart3, Link2, TrendingUp, LucideIcon } from "lucide-react";

// Info Card Component (non-clickable)
interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: "cyan" | "violet" | "primary";
}

const colorClasses: Record<string, { border: string; icon: string }> = {
  cyan: { 
    border: "border-cyan-500/30", 
    icon: "from-cyan-500/30 to-cyan-600/20 text-cyan-400",
  },
  violet: { 
    border: "border-violet-500/30", 
    icon: "from-violet-500/30 to-violet-600/20 text-violet-400",
  },
  primary: { 
    border: "border-primary/30", 
    icon: "from-primary/30 to-primary/20 text-primary",
  },
};

const InfoCard = memo(({ icon: Icon, title, description, color }: InfoCardProps) => {
  const styles = colorClasses[color];

  return (
    <div
      className={`relative rounded-xl border ${styles.border} bg-card/50 backdrop-blur-sm p-4`}
      style={{ contain: "layout style paint" }}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${styles.icon} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
});

InfoCard.displayName = 'InfoCard';

/**
 * Pre-configured info cards for the BRON keywords tab header
 */
export const BronKeywordsInfoCards = memo(() => (
  <div className="grid grid-cols-2 gap-4 mb-2">
    <InfoCard
      icon={BarChart3}
      title="Keyword Content"
      description="Manage your target keywords and edit content to optimize search visibility."
      color="cyan"
    />
    <InfoCard
      icon={TrendingUp}
      title="Ranking/Analytics"
      description="Track search engine rankings and monitor your campaign progress."
      color="primary"
    />
  </div>
));

BronKeywordsInfoCards.displayName = 'BronKeywordsInfoCards';

export { InfoCard };
