const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TechnicalSEO {
  // Meta tags
  hasTitle: boolean;
  titleLength: number;
  hasMetaDescription: boolean;
  descriptionLength: number;
  hasCanonical: boolean;
  canonicalUrl: string | null;
  hasViewport: boolean;
  hasRobotsMeta: boolean;
  robotsContent: string | null;
  
  // Open Graph
  hasOgTitle: boolean;
  hasOgDescription: boolean;
  hasOgImage: boolean;
  hasOgUrl: boolean;
  hasTwitterCard: boolean;
  
  // Headings
  h1Count: number;
  h1Text: string[];
  h2Count: number;
  h3Count: number;
  hasProperHeadingHierarchy: boolean;
  
  // Images
  totalImages: number;
  imagesWithAlt: number;
  imagesWithoutAlt: number;
  altCoverage: number;
  
  // Schema/Structured Data
  hasSchemaMarkup: boolean;
  schemaTypes: string[];
  
  // Links
  internalLinks: number;
  externalLinks: number;
  
  // SSL
  isHttps: boolean;
  
  // Technical files (detected from HTML references)
  hasSitemapLink: boolean;
  
  // Language
  hasLangAttribute: boolean;
  langValue: string | null;
}

interface WebsiteProfile {
  title: string | null;
  description: string | null;
  favicon: string | null;
  logo: string | null;
  socialLinks: {
    facebook: string | null;
    twitter: string | null;
    linkedin: string | null;
    instagram: string | null;
    youtube: string | null;
    tiktok: string | null;
  };
  contactInfo: {
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  detectedCategory: string;
  summary: string | null;
  technicalSEO: TechnicalSEO;
}

// Category detection keywords
const categoryKeywords: Record<string, string[]> = {
  ecommerce: ['shop', 'store', 'cart', 'buy', 'product', 'checkout', 'price', 'order', 'shipping', 'catalog', 'marketplace'],
  saas: ['software', 'platform', 'dashboard', 'api', 'integration', 'cloud', 'automation', 'analytics', 'subscription', 'trial', 'demo'],
  local_business: ['location', 'directions', 'hours', 'appointment', 'visit us', 'local', 'near me', 'store locator'],
  blog_media: ['blog', 'article', 'news', 'story', 'editorial', 'magazine', 'publish', 'author', 'read more'],
  professional_services: ['services', 'consulting', 'agency', 'firm', 'expertise', 'solutions', 'clients', 'portfolio', 'case study'],
  healthcare: ['health', 'medical', 'doctor', 'patient', 'clinic', 'hospital', 'care', 'treatment', 'wellness', 'therapy'],
  finance: ['finance', 'banking', 'investment', 'insurance', 'loan', 'mortgage', 'credit', 'wealth', 'trading'],
  education: ['learn', 'course', 'training', 'education', 'school', 'university', 'tutorial', 'certificate', 'student'],
  real_estate: ['property', 'real estate', 'homes', 'listing', 'rent', 'buy', 'mortgage', 'agent', 'realtor'],
  hospitality: ['hotel', 'restaurant', 'booking', 'reservation', 'travel', 'vacation', 'rooms', 'dining', 'tourism'],
  nonprofit: ['donate', 'nonprofit', 'charity', 'mission', 'volunteer', 'foundation', 'cause', 'support'],
  technology: ['tech', 'digital', 'innovation', 'startup', 'developer', 'engineering', 'ai', 'machine learning'],
};

function detectCategory(text: string): string {
  const lowerText = text.toLowerCase();
  let maxScore = 0;
  let detectedCategory = 'other';

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        score++;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      detectedCategory = category;
    }
  }

  return detectedCategory;
}

function extractSocialLinks(html: string, baseUrl: string): WebsiteProfile['socialLinks'] {
  const socialPatterns = {
    facebook: /(?:href|content)=["']?(https?:\/\/(?:www\.)?facebook\.com\/[^"'\s>]+)/gi,
    twitter: /(?:href|content)=["']?(https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^"'\s>]+)/gi,
    linkedin: /(?:href|content)=["']?(https?:\/\/(?:www\.)?linkedin\.com\/[^"'\s>]+)/gi,
    instagram: /(?:href|content)=["']?(https?:\/\/(?:www\.)?instagram\.com\/[^"'\s>]+)/gi,
    youtube: /(?:href|content)=["']?(https?:\/\/(?:www\.)?youtube\.com\/[^"'\s>]+)/gi,
    tiktok: /(?:href|content)=["']?(https?:\/\/(?:www\.)?tiktok\.com\/[^"'\s>]+)/gi,
  };

  const socialLinks: WebsiteProfile['socialLinks'] = {
    facebook: null,
    twitter: null,
    linkedin: null,
    instagram: null,
    youtube: null,
    tiktok: null,
  };

  for (const [platform, pattern] of Object.entries(socialPatterns)) {
    const match = html.match(pattern);
    if (match && match[0]) {
      const urlMatch = match[0].match(/https?:\/\/[^"'\s>]+/);
      if (urlMatch) {
        socialLinks[platform as keyof typeof socialLinks] = urlMatch[0];
      }
    }
  }

  return socialLinks;
}

function extractContactInfo(html: string): WebsiteProfile['contactInfo'] {
  const contactInfo: WebsiteProfile['contactInfo'] = {
    email: null,
    phone: null,
    address: null,
  };

  const emailMatch = html.match(/(?:mailto:|href=["']mailto:)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch) {
    contactInfo.email = emailMatch[1];
  }

  const phoneMatch = html.match(/(?:tel:|href=["']tel:)([\d\s\-+().]+)/i);
  if (phoneMatch) {
    contactInfo.phone = phoneMatch[1].trim();
  }

  return contactInfo;
}

function extractMetaTags(html: string, baseUrl: string): { title: string | null; description: string | null; favicon: string | null; logo: string | null } {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
  
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);

  const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i) ||
                       html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);

  const logoMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

  const resolveUrl = (url: string | undefined | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) return `${baseUrl}${url}`;
    return `${baseUrl}/${url}`;
  };

  return {
    title: ogTitleMatch?.[1] || titleMatch?.[1] || null,
    description: ogDescMatch?.[1] || descMatch?.[1] || null,
    favicon: resolveUrl(faviconMatch?.[1]) || `${baseUrl}/favicon.ico`,
    logo: resolveUrl(logoMatch?.[1]),
  };
}

function extractTechnicalSEO(html: string, url: string, baseUrl: string): TechnicalSEO {
  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const hasTitle = !!titleMatch && titleMatch[1].trim().length > 0;
  const titleLength = titleMatch ? titleMatch[1].trim().length : 0;
  
  // Meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const hasMetaDescription = !!descMatch && descMatch[1].trim().length > 0;
  const descriptionLength = descMatch ? descMatch[1].trim().length : 0;
  
  // Canonical
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) ||
                         html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
  const hasCanonical = !!canonicalMatch;
  const canonicalUrl = canonicalMatch ? canonicalMatch[1] : null;
  
  // Viewport
  const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html);
  
  // Robots meta
  const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']robots["']/i);
  const hasRobotsMeta = !!robotsMatch;
  const robotsContent = robotsMatch ? robotsMatch[1] : null;
  
  // Open Graph
  const hasOgTitle = /<meta[^>]*property=["']og:title["']/i.test(html);
  const hasOgDescription = /<meta[^>]*property=["']og:description["']/i.test(html);
  const hasOgImage = /<meta[^>]*property=["']og:image["']/i.test(html);
  const hasOgUrl = /<meta[^>]*property=["']og:url["']/i.test(html);
  const hasTwitterCard = /<meta[^>]*name=["']twitter:card["']/i.test(html);
  
  // Headings
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h1Count = h1Matches.length;
  const h1Text = h1Matches.map(h => h.replace(/<[^>]+>/g, '').trim()).filter(t => t.length > 0);
  
  const h2Matches = html.match(/<h2[^>]*>/gi) || [];
  const h2Count = h2Matches.length;
  
  const h3Matches = html.match(/<h3[^>]*>/gi) || [];
  const h3Count = h3Matches.length;
  
  // Check heading hierarchy (should have exactly 1 H1, and H2s should come after H1)
  const hasProperHeadingHierarchy = h1Count === 1;
  
  // Images
  const imgMatches = html.match(/<img[^>]*>/gi) || [];
  const totalImages = imgMatches.length;
  let imagesWithAlt = 0;
  let imagesWithoutAlt = 0;
  
  for (const img of imgMatches) {
    const hasAlt = /alt=["'][^"']+["']/i.test(img);
    const hasEmptyAlt = /alt=["']\s*["']/i.test(img);
    if (hasAlt && !hasEmptyAlt) {
      imagesWithAlt++;
    } else {
      imagesWithoutAlt++;
    }
  }
  
  const altCoverage = totalImages > 0 ? Math.round((imagesWithAlt / totalImages) * 100) : 100;
  
  // Schema/Structured Data
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const hasSchemaMarkup = jsonLdMatches.length > 0 || /itemtype=["']https?:\/\/schema\.org/i.test(html);
  
  const schemaTypes: string[] = [];
  for (const match of jsonLdMatches) {
    try {
      const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
      const parsed = JSON.parse(jsonContent);
      if (parsed['@type']) {
        const types = Array.isArray(parsed['@type']) ? parsed['@type'] : [parsed['@type']];
        schemaTypes.push(...types);
      }
    } catch {
      // Ignore parse errors
    }
  }
  
  // Links
  const linkMatches = html.match(/<a[^>]*href=["']([^"']+)["']/gi) || [];
  let internalLinks = 0;
  let externalLinks = 0;
  
  for (const link of linkMatches) {
    const hrefMatch = link.match(/href=["']([^"']+)["']/i);
    if (hrefMatch) {
      const href = hrefMatch[1];
      if (href.startsWith('http') && !href.includes(baseUrl.replace(/https?:\/\//, ''))) {
        externalLinks++;
      } else if (href.startsWith('/') || href.startsWith(baseUrl) || !href.includes('://')) {
        internalLinks++;
      }
    }
  }
  
  // SSL
  const isHttps = url.startsWith('https://');
  
  // Sitemap link in HTML
  const hasSitemapLink = /sitemap\.xml|sitemap_index\.xml/i.test(html);
  
  // Language
  const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
  const hasLangAttribute = !!langMatch;
  const langValue = langMatch ? langMatch[1] : null;
  
  return {
    hasTitle,
    titleLength,
    hasMetaDescription,
    descriptionLength,
    hasCanonical,
    canonicalUrl,
    hasViewport,
    hasRobotsMeta,
    robotsContent,
    hasOgTitle,
    hasOgDescription,
    hasOgImage,
    hasOgUrl,
    hasTwitterCard,
    h1Count,
    h1Text,
    h2Count,
    h3Count,
    hasProperHeadingHierarchy,
    totalImages,
    imagesWithAlt,
    imagesWithoutAlt,
    altCoverage,
    hasSchemaMarkup,
    schemaTypes,
    internalLinks,
    externalLinks,
    isHttps,
    hasSitemapLink,
    hasLangAttribute,
    langValue,
  };
}

function generateSummary(title: string | null, description: string | null, category: string, textContent: string): string {
  const categoryNames: Record<string, string> = {
    ecommerce: 'e-commerce',
    saas: 'SaaS and software',
    local_business: 'local business',
    blog_media: 'blog and media',
    professional_services: 'professional services',
    healthcare: 'healthcare',
    finance: 'finance',
    education: 'education',
    real_estate: 'real estate',
    hospitality: 'hospitality',
    nonprofit: 'nonprofit',
    technology: 'technology',
    other: 'general business',
  };

  const categoryLabel = categoryNames[category] || 'business';
  const parts: string[] = [];
  
  if (title) {
    parts.push(`${title} is a ${categoryLabel} website.`);
  } else {
    parts.push(`This is a ${categoryLabel} website.`);
  }
  
  if (description) {
    parts.push(description);
  }
  
  const cleanText = textContent
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 3000);
  
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 30 && s.trim().length < 200);
  
  const descriptiveSentences = sentences.filter(s => {
    const lower = s.toLowerCase();
    return lower.includes(' we ') || lower.includes('our ') || lower.includes(' provide') || 
           lower.includes(' offer') || lower.includes(' specialize') || lower.includes(' help') ||
           lower.includes(' service') || lower.includes(' solution') || lower.includes(' deliver');
  });
  
  for (let i = 0; i < Math.min(3, descriptiveSentences.length); i++) {
    const sentence = descriptiveSentences[i].trim();
    if (sentence && !parts.some(p => p.includes(sentence.substring(0, 30)))) {
      parts.push(sentence + '.');
    }
  }
  
  const categoryContext: Record<string, string> = {
    ecommerce: 'The website appears to offer products or services for online purchase, featuring e-commerce functionality for a seamless shopping experience.',
    saas: 'This platform provides software solutions designed to help businesses streamline their operations and improve productivity through digital tools.',
    local_business: 'Serving the local community, this business offers in-person services and maintains a physical presence for customer convenience.',
    blog_media: 'The site publishes content and articles to inform, educate, or entertain its audience with regularly updated material.',
    professional_services: 'This organization offers specialized expertise and consulting services to help clients achieve their goals.',
    healthcare: 'Focused on health and wellness, this provider offers medical services, treatments, or health-related information.',
    finance: 'Operating in the financial sector, this entity provides services related to money management, investments, or financial planning.',
    education: 'Dedicated to learning and development, this platform offers educational resources, courses, or training programs.',
    real_estate: 'Specializing in property, this business helps clients buy, sell, rent, or manage real estate assets.',
    hospitality: 'In the hospitality industry, this business provides accommodation, dining, or travel-related services for guests.',
    nonprofit: 'As a mission-driven organization, this nonprofit works to create positive impact in its community or cause area.',
    technology: 'At the forefront of innovation, this technology company develops digital solutions and technical products.',
    other: 'This website serves its audience with information, products, or services tailored to their needs.',
  };
  
  if (categoryContext[category]) {
    parts.push(categoryContext[category]);
  }
  
  let summary = parts.join(' ').replace(/\s+/g, ' ').trim();
  
  if (summary.length < 200) {
    summary += ` Visitors can explore the website to learn more about the offerings, get in touch with the team, and discover how this ${categoryLabel} organization can meet their needs.`;
  }
  
  return summary;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping website:', formattedUrl);

    const response = await fetch(formattedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WebStackCEO-Bot/1.0; +https://webstackceo.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    const emptyTechnicalSEO: TechnicalSEO = {
      hasTitle: false,
      titleLength: 0,
      hasMetaDescription: false,
      descriptionLength: 0,
      hasCanonical: false,
      canonicalUrl: null,
      hasViewport: false,
      hasRobotsMeta: false,
      robotsContent: null,
      hasOgTitle: false,
      hasOgDescription: false,
      hasOgImage: false,
      hasOgUrl: false,
      hasTwitterCard: false,
      h1Count: 0,
      h1Text: [],
      h2Count: 0,
      h3Count: 0,
      hasProperHeadingHierarchy: false,
      totalImages: 0,
      imagesWithAlt: 0,
      imagesWithoutAlt: 0,
      altCoverage: 0,
      hasSchemaMarkup: false,
      schemaTypes: [],
      internalLinks: 0,
      externalLinks: 0,
      isHttps: formattedUrl.startsWith('https://'),
      hasSitemapLink: false,
      hasLangAttribute: false,
      langValue: null,
    };

    if (!response.ok) {
      console.error('Failed to fetch website:', response.status);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to fetch website: ${response.status}`,
          profile: {
            title: null,
            description: null,
            favicon: null,
            logo: null,
            socialLinks: { facebook: null, twitter: null, linkedin: null, instagram: null, youtube: null, tiktok: null },
            contactInfo: { email: null, phone: null, address: null },
            detectedCategory: 'other',
            summary: 'Unable to analyze this website.',
            technicalSEO: emptyTechnicalSEO,
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    const baseUrl = new URL(formattedUrl).origin;

    const metaTags = extractMetaTags(html, baseUrl);
    const socialLinks = extractSocialLinks(html, baseUrl);
    const contactInfo = extractContactInfo(html);
    const technicalSEO = extractTechnicalSEO(html, formattedUrl, baseUrl);
    
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .substring(0, 10000);
    
    const detectedCategory = detectCategory(textContent + ' ' + (metaTags.title || '') + ' ' + (metaTags.description || ''));
    
    const profile: WebsiteProfile = {
      title: metaTags.title,
      description: metaTags.description,
      favicon: metaTags.favicon,
      logo: metaTags.logo,
      socialLinks,
      contactInfo,
      detectedCategory,
      summary: generateSummary(metaTags.title, metaTags.description, detectedCategory, textContent),
      technicalSEO,
    };

    console.log('Successfully scraped website profile with technical SEO data');

    return new Response(
      JSON.stringify({ success: true, profile }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping website:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape website';
    
    const emptyTechnicalSEO: TechnicalSEO = {
      hasTitle: false,
      titleLength: 0,
      hasMetaDescription: false,
      descriptionLength: 0,
      hasCanonical: false,
      canonicalUrl: null,
      hasViewport: false,
      hasRobotsMeta: false,
      robotsContent: null,
      hasOgTitle: false,
      hasOgDescription: false,
      hasOgImage: false,
      hasOgUrl: false,
      hasTwitterCard: false,
      h1Count: 0,
      h1Text: [],
      h2Count: 0,
      h3Count: 0,
      hasProperHeadingHierarchy: false,
      totalImages: 0,
      imagesWithAlt: 0,
      imagesWithoutAlt: 0,
      altCoverage: 0,
      hasSchemaMarkup: false,
      schemaTypes: [],
      internalLinks: 0,
      externalLinks: 0,
      isHttps: false,
      hasSitemapLink: false,
      hasLangAttribute: false,
      langValue: null,
    };
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        profile: {
          title: null,
          description: null,
          favicon: null,
          logo: null,
          socialLinks: { facebook: null, twitter: null, linkedin: null, instagram: null, youtube: null, tiktok: null },
          contactInfo: { email: null, phone: null, address: null },
          detectedCategory: 'other',
          summary: 'Unable to analyze this website.',
          technicalSEO: emptyTechnicalSEO,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
