import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface GuideFeatureLinkProps {
  title: string;
  gradientText: string;
  featureHref: string;
  isAddOn?: boolean;
}

const GuideFeatureLink = ({ title, gradientText, featureHref, isAddOn = false }: GuideFeatureLinkProps) => {
  return (
    <div className="space-y-4 mb-4">
      <Link to="/learn" className="inline-flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Learning Center
      </Link>
      
      {isAddOn && (
        <div>
          <span className="px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium border border-amber-500/30">
            Add-on Service
          </span>
        </div>
      )}
      
      <Link
        to={featureHref}
        className="group inline-flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <h1 className="text-4xl md:text-5xl font-bold">
          {title} <span className="gradient-text">{gradientText}</span>
        </h1>
        <ArrowRight className="w-8 h-8 text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transition-transform" />
      </Link>
    </div>
  );
};

export default GuideFeatureLink;
