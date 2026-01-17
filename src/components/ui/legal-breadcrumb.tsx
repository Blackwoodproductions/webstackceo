import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

interface LegalBreadcrumbProps {
  pageName: string;
}

const LegalBreadcrumb = ({ pageName }: LegalBreadcrumbProps) => {
  return (
    <nav aria-label="Breadcrumb" className="container mx-auto px-6 max-w-4xl pt-24 pb-4">
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
          <span className="text-muted-foreground">Legal</span>
        </li>
        <li>
          <ChevronRight className="w-4 h-4" />
        </li>
        <li>
          <span className="text-foreground font-medium">{pageName}</span>
        </li>
      </ol>
    </nav>
  );
};

export default LegalBreadcrumb;
