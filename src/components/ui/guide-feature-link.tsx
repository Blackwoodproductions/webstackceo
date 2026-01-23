import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

interface GuideFeatureLinkProps {
  featureTitle: string;
  featureHref: string;
  isAddOn?: boolean;
}

const GuideFeatureLink = ({ featureTitle, featureHref, isAddOn = false }: GuideFeatureLinkProps) => {
  return (
    <Link
      to={featureHref}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 ${
        isAddOn
          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
          : "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
      }`}
    >
      <Sparkles className="w-4 h-4" />
      Automate with {featureTitle}
      {isAddOn && <span className="text-xs opacity-75">(Add-on)</span>}
    </Link>
  );
};

export default GuideFeatureLink;
