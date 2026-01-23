import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface GuideFeatureLinkProps {
  title: string;
  gradientText: string;
  featureHref: string;
  isAddOn?: boolean;
}

const GuideFeatureLink = ({ title, gradientText, featureHref, isAddOn = false }: GuideFeatureLinkProps) => {
  return (
    <Link
      to={featureHref}
      className="group inline-flex items-center gap-3 hover:opacity-80 transition-opacity"
    >
      <h1 className="text-4xl md:text-5xl font-bold">
        {title} <span className="gradient-text">{gradientText}</span>
      </h1>
      <ArrowRight className="w-8 h-8 text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transition-transform" />
      {isAddOn && (
        <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium border border-amber-500/30">
          Add-on
        </span>
      )}
    </Link>
  );
};

export default GuideFeatureLink;
