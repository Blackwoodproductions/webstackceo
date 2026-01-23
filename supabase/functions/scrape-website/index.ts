const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      // Extract just the URL from the match
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

  // Email extraction
  const emailMatch = html.match(/(?:mailto:|href=["']mailto:)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch) {
    contactInfo.email = emailMatch[1];
  }

  // Phone extraction (various formats)
  const phoneMatch = html.match(/(?:tel:|href=["']tel:)([\d\s\-+().]+)/i);
  if (phoneMatch) {
    contactInfo.phone = phoneMatch[1].trim();
  }

  return contactInfo;
}

function extractMetaTags(html: string, baseUrl: string): { title: string | null; description: string | null; favicon: string | null; logo: string | null } {
  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
  
  // Description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);

  // Favicon
  const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i) ||
                       html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);

  // Logo (og:image or schema logo)
  const logoMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

  // Resolve relative URLs
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

function generateSummary(title: string | null, description: string | null, category: string): string {
  const categoryNames: Record<string, string> = {
    ecommerce: 'e-commerce',
    saas: 'SaaS/software',
    local_business: 'local business',
    blog_media: 'blog/media',
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
  
  if (description) {
    return `${description.substring(0, 200)}${description.length > 200 ? '...' : ''}`;
  }
  
  if (title) {
    return `A ${categoryLabel} website focused on ${title.toLowerCase()}.`;
  }
  
  return `A ${categoryLabel} website.`;
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

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping website:', formattedUrl);

    // Fetch the website
    const response = await fetch(formattedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WebStackCEO-Bot/1.0; +https://webstackceo.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

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
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    const baseUrl = new URL(formattedUrl).origin;

    // Extract metadata
    const metaTags = extractMetaTags(html, baseUrl);
    const socialLinks = extractSocialLinks(html, baseUrl);
    const contactInfo = extractContactInfo(html);
    
    // Detect category from content
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
      summary: generateSummary(metaTags.title, metaTags.description, detectedCategory),
    };

    console.log('Successfully scraped website profile');

    return new Response(
      JSON.stringify({ success: true, profile }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping website:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape website';
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
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
