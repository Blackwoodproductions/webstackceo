import SEOBreadcrumb from "./seo-breadcrumb";

interface FeatureBreadcrumbProps {
  featureName: string;
  featureKeyword?: string; // For SEO alt text
}

const FeatureBreadcrumb = ({ featureName, featureKeyword }: FeatureBreadcrumbProps) => {
  return (
    <SEOBreadcrumb
      items={[
        { 
          label: "Features", 
          href: "/features",
          altText: "View all SEO and website management features"
        },
        { 
          label: featureName,
          altText: featureKeyword || `Learn about ${featureName} for website optimization`
        }
      ]}
    />
  );
};

export default FeatureBreadcrumb;
