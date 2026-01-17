import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

interface FeatureBreadcrumbProps {
  featureName: string;
}

const FeatureBreadcrumb = ({ featureName }: FeatureBreadcrumbProps) => {
  return (
    <nav aria-label="Breadcrumb" className="container mx-auto px-6 max-w-6xl pt-24 pb-4">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        <li>
          <Link 
            to="/" 
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </li>
        <li>
          <ChevronRight className="w-4 h-4" />
        </li>
        <li>
          <Link 
            to="/#features" 
            className="hover:text-foreground transition-colors"
          >
            Features
          </Link>
        </li>
        <li>
          <ChevronRight className="w-4 h-4" />
        </li>
        <li>
          <span className="text-foreground font-medium">{featureName}</span>
        </li>
      </ol>
    </nav>
  );
};

export default FeatureBreadcrumb;
