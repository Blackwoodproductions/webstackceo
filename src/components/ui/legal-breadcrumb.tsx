import SEOBreadcrumb from "./seo-breadcrumb";

interface LegalBreadcrumbProps {
  pageName: string;
  pageKeyword?: string; // For SEO alt text
}

const LegalBreadcrumb = ({ pageName, pageKeyword }: LegalBreadcrumbProps) => {
  return (
    <SEOBreadcrumb
      items={[
        { 
          label: "Legal",
          altText: "Legal documents and compliance information"
        },
        { 
          label: pageName,
          altText: pageKeyword || `Read our ${pageName}`
        }
      ]}
      className="max-w-4xl"
    />
  );
};

export default LegalBreadcrumb;
