import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  noIndex?: boolean;
  schema?: object;
}

const SEO = ({
  title,
  description,
  keywords,
  canonical,
  ogType = 'website',
  ogImage = 'https://webstackceo.lovable.app/og-default.jpg',
  noIndex = false,
  schema,
}: SEOProps) => {
  const siteUrl = 'https://webstackceo.lovable.app';
  const fullTitle = title.includes('Webstack.ceo') ? title : `${title} | Webstack.ceo`;
  const canonicalUrl = canonical ? `${siteUrl}${canonical}` : undefined;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Helper to update or create meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Primary Meta Tags
    updateMetaTag('title', fullTitle);
    updateMetaTag('description', description);
    if (keywords) {
      updateMetaTag('keywords', keywords);
    }
    updateMetaTag('robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph / Facebook
    updateMetaTag('og:type', ogType, true);
    if (canonicalUrl) {
      updateMetaTag('og:url', canonicalUrl, true);
    }
    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', ogImage, true);
    updateMetaTag('og:site_name', 'Webstack.ceo', true);

    // Twitter
    updateMetaTag('twitter:card', 'summary_large_image');
    if (canonicalUrl) {
      updateMetaTag('twitter:url', canonicalUrl);
    }
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', ogImage);

    // Canonical URL
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonicalUrl) {
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonicalUrl;
    } else if (link) {
      link.remove();
    }

    // Schema.org Structured Data
    const existingSchema = document.getElementById('page-schema');
    if (existingSchema) {
      existingSchema.remove();
    }
    if (schema) {
      const script = document.createElement('script');
      script.id = 'page-schema';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }
  }, [fullTitle, description, keywords, canonicalUrl, ogType, ogImage, noIndex, schema]);

  return null;
};

export default SEO;
