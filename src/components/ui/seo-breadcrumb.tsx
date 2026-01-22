import { useEffect } from "react";
import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  altText?: string; // For SEO - describes the page
}

interface SEOBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const SEOBreadcrumb = ({ items, className = "" }: SEOBreadcrumbProps) => {
  const siteUrl = "https://webstackceo.lovable.app";

  // Generate BreadcrumbList schema
  useEffect(() => {
    const existingSchema = document.getElementById("breadcrumb-schema");
    if (existingSchema) {
      existingSchema.remove();
    }

    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": siteUrl
        },
        ...items.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 2,
          "name": item.label,
          ...(item.href ? { "item": `${siteUrl}${item.href}` } : {})
        }))
      ]
    };

    const script = document.createElement("script");
    script.id = "breadcrumb-schema";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const schemaToRemove = document.getElementById("breadcrumb-schema");
      if (schemaToRemove) {
        schemaToRemove.remove();
      }
    };
  }, [items, siteUrl]);

  return (
    <nav 
      aria-label="Breadcrumb navigation" 
      className={`container mx-auto px-6 max-w-6xl pt-24 pb-4 ${className}`}
    >
      <ol 
        className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
        itemScope 
        itemType="https://schema.org/BreadcrumbList"
      >
        {/* Home */}
        <li 
          itemScope 
          itemType="https://schema.org/ListItem" 
          itemProp="itemListElement"
        >
          <Link 
            to="/" 
            className="flex items-center gap-1 hover:text-foreground transition-colors"
            itemProp="item"
            title="Return to Webstack.ceo homepage"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span itemProp="name">Home</span>
          </Link>
          <meta itemProp="position" content="1" />
        </li>

        {items.map((item, index) => (
          <li 
            key={index}
            className="flex items-center gap-2"
            itemScope 
            itemType="https://schema.org/ListItem" 
            itemProp="itemListElement"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
            {item.href ? (
              <Link 
                to={item.href}
                className="hover:text-foreground transition-colors"
                itemProp="item"
                title={item.altText || item.label}
              >
                <span itemProp="name">{item.label}</span>
              </Link>
            ) : (
              <span 
                className="text-foreground font-medium"
                itemProp="name"
                aria-current="page"
              >
                {item.label}
              </span>
            )}
            <meta itemProp="position" content={String(index + 2)} />
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default SEOBreadcrumb;
