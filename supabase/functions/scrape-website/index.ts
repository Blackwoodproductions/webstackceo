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

// NEW: Content readability metrics
interface ContentMetrics {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgWordsPerSentence: number;
  avgSentencesPerParagraph: number;
  fleschKincaidScore: number; // 0-100, higher = easier to read
  readingLevel: 'Easy' | 'Standard' | 'Difficult';
  readingGrade: string; // e.g., "8th Grade"
  keywordDensity: { keyword: string; count: number; density: number }[];
  longSentences: number; // sentences > 25 words
  shortSentences: number; // sentences < 10 words
}

// NEW: Internal linking analysis
interface InternalLinkingMetrics {
  totalInternalLinks: number;
  totalExternalLinks: number;
  uniqueInternalLinks: number;
  uniqueExternalLinks: number;
  brokenLinkCandidates: string[]; // links that look potentially broken (# only, javascript:void, etc.)
  anchorTextDistribution: { text: string; count: number }[];
  linksPerSection: number; // average links per major section
  hasNavigationLinks: boolean;
  hasFooterLinks: boolean;
  maxLinkDepth: number; // estimated from URL structure
  orphanRisk: boolean; // true if very few internal links point elsewhere
}

// NEW: Local SEO signals from actual page content
interface LocalSEOSignals {
  hasAddress: boolean;
  address: string | null;
  hasPhone: boolean;
  phone: string | null;
  hasBusinessHours: boolean;
  hoursText: string | null;
  hasLocalSchema: boolean;
  localSchemaType: string | null;
  hasGoogleMapsEmbed: boolean;
  hasServiceArea: boolean;
  serviceAreaText: string | null;
  napConsistent: boolean; // Name, Address, Phone consistency
  hasReviewsSection: boolean;
  hasGMBLink: boolean;
  gmbUrl: string | null;
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
  // NEW: Enhanced metrics
  contentMetrics: ContentMetrics;
  internalLinkingMetrics: InternalLinkingMetrics;
  localSEOSignals: LocalSEOSignals;
}

// Category detection keywords
const categoryKeywords: Record<string, string[]> = {
  ecommerce: ['shop', 'store', 'cart', 'buy', 'product', 'checkout', 'price', 'order', 'shipping', 'catalog', 'marketplace'],
  saas: ['software', 'platform', 'dashboard', 'api', 'integration', 'cloud', 'automation', 'analytics', 'subscription', 'trial', 'demo'],
  local_business: ['location', 'directions', 'hours', 'appointment', 'visit us', 'local', 'near me', 'store locator'],
  blog_media: ['blog', 'article', 'news', 'story', 'editorial', 'magazine', 'publish', 'author', 'read more'],
  professional_services: ['services', 'consulting', 'agency', 'firm', 'expertise', 'solutions', 'clients', 'portfolio', 'case study'],
  healthcare: ['health', 'medical', 'doctor', 'patient', 'clinic', 'hospital', 'care', 'treatment', 'wellness', 'therapy', 'dentist', 'dental'],
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

  // Extract address from schema or common patterns
  const addressMatch = html.match(/(?:streetAddress|address)["\s:>]+([^"<]+)/i);
  if (addressMatch) {
    contactInfo.address = addressMatch[1].trim();
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

// NEW: Extract content readability metrics
function extractContentMetrics(html: string): ContentMetrics {
  // Remove scripts, styles, and HTML tags to get clean text
  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '') // Remove navigation
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '') // Remove footer
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '') // Remove header (keep main content)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();

  // Count words
  const words = textContent.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // Count sentences (split by . ! ?)
  const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const sentenceCount = Math.max(1, sentences.length);

  // Count paragraphs (from original HTML)
  const paragraphs = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
  const paragraphCount = paragraphs.length;

  // Calculate averages
  const avgWordsPerSentence = Math.round((wordCount / sentenceCount) * 10) / 10;
  const avgSentencesPerParagraph = paragraphCount > 0 ? Math.round((sentenceCount / paragraphCount) * 10) / 10 : sentenceCount;

  // Count syllables (simplified approximation)
  const countSyllables = (word: string): number => {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? syllables.length : 1;
  };

  let totalSyllables = 0;
  for (const word of words.slice(0, 500)) { // Sample first 500 words for performance
    totalSyllables += countSyllables(word);
  }
  const avgSyllablesPerWord = words.length > 0 ? totalSyllables / Math.min(words.length, 500) : 1;

  // Flesch-Kincaid Reading Ease Score
  // 206.835 - 1.015 × (words/sentences) - 84.6 × (syllables/words)
  const fleschKincaidScore = Math.max(0, Math.min(100, Math.round(
    206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)
  )));

  // Determine reading level
  let readingLevel: 'Easy' | 'Standard' | 'Difficult';
  let readingGrade: string;
  
  if (fleschKincaidScore >= 60) {
    readingLevel = 'Easy';
    readingGrade = fleschKincaidScore >= 80 ? '5th Grade' : '6th-7th Grade';
  } else if (fleschKincaidScore >= 30) {
    readingLevel = 'Standard';
    readingGrade = fleschKincaidScore >= 50 ? '8th-9th Grade' : '10th-12th Grade';
  } else {
    readingLevel = 'Difficult';
    readingGrade = 'College Level';
  }

  // Keyword density (most common words, excluding stop words)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'as', 'if', 'not', 'no', 'yes', 'all', 'any', 'your', 'our', 'we', 'you', 'they', 'them', 'their', 'he', 'she', 'his', 'her']);
  
  const wordFreq: Record<string, number> = {};
  for (const word of words) {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
      wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
    }
  }

  const keywordDensity = Object.entries(wordFreq)
    .filter(([_, count]) => count >= 2)
    .map(([keyword, count]) => ({
      keyword,
      count,
      density: Math.round((count / wordCount) * 10000) / 100 // percentage with 2 decimals
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // Count long and short sentences
  let longSentences = 0;
  let shortSentences = 0;
  for (const sentence of sentences) {
    const sentenceWordCount = sentence.trim().split(/\s+/).length;
    if (sentenceWordCount > 25) longSentences++;
    if (sentenceWordCount < 10 && sentenceWordCount > 0) shortSentences++;
  }

  return {
    wordCount,
    sentenceCount,
    paragraphCount,
    avgWordsPerSentence,
    avgSentencesPerParagraph,
    fleschKincaidScore,
    readingLevel,
    readingGrade,
    keywordDensity,
    longSentences,
    shortSentences,
  };
}

// NEW: Extract internal linking metrics
function extractInternalLinkingMetrics(html: string, baseUrl: string): InternalLinkingMetrics {
  const domain = baseUrl.replace(/https?:\/\//, '').replace(/\/$/, '');
  
  // Extract all links with their anchor text
  const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const allLinks: { href: string; text: string }[] = [];
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    allLinks.push({ href, text });
  }

  const internalLinks: string[] = [];
  const externalLinks: string[] = [];
  const brokenLinkCandidates: string[] = [];
  const anchorTextCount: Record<string, number> = {};

  for (const link of allLinks) {
    const { href, text } = link;
    
    // Check for broken link candidates
    if (href === '#' || href === 'javascript:void(0)' || href === 'javascript:;' || !href) {
      brokenLinkCandidates.push(href || '(empty)');
      continue;
    }

    // Categorize as internal or external
    if (href.startsWith('http') && !href.includes(domain)) {
      externalLinks.push(href);
    } else if (href.startsWith('/') || href.startsWith(baseUrl) || !href.includes('://')) {
      internalLinks.push(href);
    }

    // Count anchor text
    if (text && text.length > 0 && text.length < 100) {
      anchorTextCount[text] = (anchorTextCount[text] || 0) + 1;
    }
  }

  // Calculate unique links
  const uniqueInternalLinks = new Set(internalLinks).size;
  const uniqueExternalLinks = new Set(externalLinks).size;

  // Anchor text distribution (top 10)
  const anchorTextDistribution = Object.entries(anchorTextCount)
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Check for navigation and footer links
  const hasNavigationLinks = /<nav[^>]*>[\s\S]*?<a[^>]*href/i.test(html);
  const hasFooterLinks = /<footer[^>]*>[\s\S]*?<a[^>]*href/i.test(html);

  // Estimate max link depth from internal URLs
  let maxLinkDepth = 1;
  for (const link of internalLinks) {
    const path = link.replace(baseUrl, '').replace(/^\//, '');
    const depth = path.split('/').filter(p => p.length > 0).length;
    if (depth > maxLinkDepth) maxLinkDepth = depth;
  }

  // Calculate links per section (rough estimate based on sections/articles)
  const sectionCount = (html.match(/<(?:section|article|main)[^>]*>/gi) || []).length || 1;
  const linksPerSection = Math.round((internalLinks.length / sectionCount) * 10) / 10;

  // Orphan risk - if there are very few internal links
  const orphanRisk = uniqueInternalLinks < 5;

  return {
    totalInternalLinks: internalLinks.length,
    totalExternalLinks: externalLinks.length,
    uniqueInternalLinks,
    uniqueExternalLinks,
    brokenLinkCandidates: brokenLinkCandidates.slice(0, 5),
    anchorTextDistribution,
    linksPerSection,
    hasNavigationLinks,
    hasFooterLinks,
    maxLinkDepth,
    orphanRisk,
  };
}

// NEW: Extract local SEO signals
function extractLocalSEOSignals(html: string, schemaTypes: string[]): LocalSEOSignals {
  // Check for address patterns
  const addressPatterns = [
    /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct|circle|cir)[,.\s]+[\w\s]+(?:,\s*[\w]+)?\s*(?:[A-Z]{2})?\s*\d{5}/gi,
    /"streetAddress"\s*:\s*"([^"]+)"/i,
    /itemprop=["']streetAddress["'][^>]*>([^<]+)/i,
  ];
  
  let address: string | null = null;
  let hasAddress = false;
  
  for (const pattern of addressPatterns) {
    const match = html.match(pattern);
    if (match) {
      hasAddress = true;
      address = match[1] || match[0];
      break;
    }
  }

  // Phone detection
  const phonePatterns = [
    /(?:tel:|href=["']tel:)([\d\s\-+().]+)/i,
    /"telephone"\s*:\s*"([^"]+)"/i,
    /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
  ];
  
  let phone: string | null = null;
  let hasPhone = false;
  
  for (const pattern of phonePatterns) {
    const match = html.match(pattern);
    if (match) {
      hasPhone = true;
      phone = match[1] || match[0];
      break;
    }
  }

  // Business hours detection
  const hoursPatterns = [
    /"openingHours"\s*:\s*"([^"]+)"/i,
    /(?:hours|open|schedule)[:\s]+(?:mon|tue|wed|thu|fri|sat|sun)[^<]{10,100}/i,
    /\d{1,2}(?::\d{2})?\s*(?:am|pm)\s*[-–]\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)/gi,
  ];
  
  let hoursText: string | null = null;
  let hasBusinessHours = false;
  
  for (const pattern of hoursPatterns) {
    const match = html.match(pattern);
    if (match) {
      hasBusinessHours = true;
      hoursText = match[1] || match[0];
      break;
    }
  }

  // Local schema types
  const localSchemaTypes = ['LocalBusiness', 'Restaurant', 'Store', 'MedicalBusiness', 'Dentist', 'Physician', 'LegalService', 'RealEstateAgent', 'AutomotiveBusiness'];
  const hasLocalSchema = schemaTypes.some(type => localSchemaTypes.includes(type));
  const localSchemaType = schemaTypes.find(type => localSchemaTypes.includes(type)) || null;

  // Google Maps embed detection
  const hasGoogleMapsEmbed = /google\.com\/maps|maps\.google\.com|iframe[^>]*google.*map/i.test(html);

  // Service area detection
  const serviceAreaMatch = html.match(/(?:serving|service area|we serve)[:\s]+([^<.]+)/i);
  const hasServiceArea = !!serviceAreaMatch;
  const serviceAreaText = serviceAreaMatch ? serviceAreaMatch[1].trim() : null;

  // NAP consistency check (simplified - checks if phone appears near address)
  const napConsistent = hasAddress && hasPhone;

  // Reviews section detection
  const hasReviewsSection = /review|testimonial|rating|★|⭐|stars/i.test(html);

  // Google My Business link detection
  const gmbMatch = html.match(/(?:href=["'])(https?:\/\/(?:g\.page|maps\.google\.com|www\.google\.com\/maps)[^"']+)/i);
  const hasGMBLink = !!gmbMatch;
  const gmbUrl = gmbMatch ? gmbMatch[1] : null;

  return {
    hasAddress,
    address,
    hasPhone,
    phone,
    hasBusinessHours,
    hoursText,
    hasLocalSchema,
    localSchemaType,
    hasGoogleMapsEmbed,
    hasServiceArea,
    serviceAreaText,
    napConsistent,
    hasReviewsSection,
    hasGMBLink,
    gmbUrl,
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

// Create empty metrics for error cases
function createEmptyMetrics(): { technicalSEO: TechnicalSEO; contentMetrics: ContentMetrics; internalLinkingMetrics: InternalLinkingMetrics; localSEOSignals: LocalSEOSignals } {
  return {
    technicalSEO: {
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
    },
    contentMetrics: {
      wordCount: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      avgWordsPerSentence: 0,
      avgSentencesPerParagraph: 0,
      fleschKincaidScore: 0,
      readingLevel: 'Standard',
      readingGrade: 'Unknown',
      keywordDensity: [],
      longSentences: 0,
      shortSentences: 0,
    },
    internalLinkingMetrics: {
      totalInternalLinks: 0,
      totalExternalLinks: 0,
      uniqueInternalLinks: 0,
      uniqueExternalLinks: 0,
      brokenLinkCandidates: [],
      anchorTextDistribution: [],
      linksPerSection: 0,
      hasNavigationLinks: false,
      hasFooterLinks: false,
      maxLinkDepth: 0,
      orphanRisk: true,
    },
    localSEOSignals: {
      hasAddress: false,
      address: null,
      hasPhone: false,
      phone: null,
      hasBusinessHours: false,
      hoursText: null,
      hasLocalSchema: false,
      localSchemaType: null,
      hasGoogleMapsEmbed: false,
      hasServiceArea: false,
      serviceAreaText: null,
      napConsistent: false,
      hasReviewsSection: false,
      hasGMBLink: false,
      gmbUrl: null,
    },
  };
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

    const emptyMetrics = createEmptyMetrics();
    emptyMetrics.technicalSEO.isHttps = formattedUrl.startsWith('https://');

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
            ...emptyMetrics,
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    const baseUrl = new URL(formattedUrl).origin;

    // Extract all metrics
    const metaTags = extractMetaTags(html, baseUrl);
    const socialLinks = extractSocialLinks(html, baseUrl);
    const contactInfo = extractContactInfo(html);
    const technicalSEO = extractTechnicalSEO(html, formattedUrl, baseUrl);
    const contentMetrics = extractContentMetrics(html);
    const internalLinkingMetrics = extractInternalLinkingMetrics(html, baseUrl);
    const localSEOSignals = extractLocalSEOSignals(html, technicalSEO.schemaTypes);
    
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
      contentMetrics,
      internalLinkingMetrics,
      localSEOSignals,
    };

    console.log('Successfully scraped website profile with enhanced metrics');
    console.log(`Content: ${contentMetrics.wordCount} words, ${contentMetrics.sentenceCount} sentences, Reading level: ${contentMetrics.readingLevel}`);
    console.log(`Links: ${internalLinkingMetrics.totalInternalLinks} internal, ${internalLinkingMetrics.totalExternalLinks} external`);
    console.log(`Local SEO: Address=${localSEOSignals.hasAddress}, Phone=${localSEOSignals.hasPhone}, GMB=${localSEOSignals.hasGMBLink}`);

    return new Response(
      JSON.stringify({ success: true, profile }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping website:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape website';
    
    const emptyMetrics = createEmptyMetrics();
    
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
          ...emptyMetrics,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
