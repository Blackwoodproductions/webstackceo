// Centralized glossary data with terms mapped to features and learning guides

export interface ExternalResource {
  title: string;
  source: string;
  url: string;
}

export interface GlossaryTermData {
  term: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  whyItMatters: string[];
  bestPractices: string[];
  relatedTerms: string[];
  relatedGuide?: { title: string; href: string };
  relatedFeature?: { title: string; href: string };
  externalResources: ExternalResource[];
}

// Feature pages mapping for reference
export const featurePages = {
  onPageSEO: { title: "On-Page SEO", href: "/features/on-page-seo" },
  offPageSEO: { title: "Off-Page SEO", href: "/features/off-page-seo" },
  domainAuthority: { title: "Domain Authority", href: "/features/domain-authority" },
  analytics: { title: "Advanced Analytics", href: "/features/advanced-analytics" },
  automatedBlog: { title: "Automated Blog", href: "/features/automated-blog" },
  faqGeneration: { title: "FAQ Generation", href: "/features/faq-generation" },
  gmbOptimization: { title: "GMB Optimization", href: "/features/gmb-optimization" },
  ppcLandingPages: { title: "PPC Landing Pages", href: "/features/ppc-landing-pages" },
  socialSignals: { title: "Social Signals", href: "/features/social-signals" },
  trafficDeAnonymization: { title: "Traffic De-Anonymization", href: "/features/traffic-de-anonymization" },
  uptimeMonitoring: { title: "Uptime Monitoring", href: "/features/uptime-monitoring" },
  visitorIntelligence: { title: "Visitor Intelligence", href: "/features/visitor-intelligence" },
  webHosting: { title: "Web Hosting", href: "/features/web-hosting" },
};

// Learning guide mapping for reference
export const learningGuides = {
  onPageSEO: { title: "On-Page SEO Guide", href: "/learn/on-page-seo-guide" },
  offPageSEO: { title: "Off-Page SEO Guide", href: "/learn/off-page-seo-guide" },
  domainAuthority: { title: "Domain Authority Guide", href: "/learn/domain-authority-guide" },
  analytics: { title: "Analytics Guide", href: "/learn/analytics-guide" },
  automatedBlogging: { title: "Automated Blogging Guide", href: "/learn/automated-blogging-guide" },
  faqGeneration: { title: "FAQ Generation Guide", href: "/learn/faq-generation-guide" },
  gmbOptimization: { title: "GMB Optimization Guide", href: "/learn/gmb-optimization-guide" },
  ppcLandingPages: { title: "PPC Landing Pages Guide", href: "/learn/ppc-landing-pages-guide" },
  socialSignals: { title: "Social Signals Guide", href: "/learn/social-signals-guide" },
  trafficDeanonymization: { title: "Traffic Deanonymization Guide", href: "/learn/traffic-deanonymization-guide" },
  uptimeMonitoring: { title: "Uptime Monitoring Guide", href: "/learn/uptime-monitoring-guide" },
  visitorIntelligence: { title: "Visitor Intelligence Guide", href: "/learn/visitor-intelligence-guide" },
  webHosting: { title: "Web Hosting Guide", href: "/learn/web-hosting-guide" },
  technicalSEO: { title: "Technical SEO Guide", href: "/learn/technical-seo-guide" },
  localSEO: { title: "Local SEO Guide", href: "/learn/local-seo-guide" },
  linkBuilding: { title: "Link Building Guide", href: "/learn/link-building-guide" },
  coreWebVitals: { title: "Core Web Vitals Guide", href: "/learn/core-web-vitals-guide" },
  cro: { title: "CRO Guide", href: "/learn/cro-guide" },
};

export const glossaryTerms: GlossaryTermData[] = [
  // ===== ON-PAGE SEO TERMS =====
  {
    term: "Title Tag",
    slug: "title-tag",
    shortDescription: "The HTML element that defines the title of a web page shown in search results and browser tabs.",
    fullDescription: "A title tag is an HTML element (<title>) that specifies the title of a web page. It appears in three key places: browser tabs, search engine results pages (SERPs) as the clickable headline, and social media shares. Title tags are one of the most important on-page SEO elements because they directly impact both rankings and click-through rates.",
    category: "On-Page SEO",
    whyItMatters: [
      "Primary factor in helping search engines understand page content",
      "First impression users see in search results—affects click-through rate",
      "Appears in browser tabs for easy navigation between pages",
      "Used as default text when sharing pages on social media"
    ],
    bestPractices: [
      "Keep titles under 60 characters to avoid truncation in search results",
      "Place your primary keyword near the beginning of the title",
      "Make each page's title unique across your entire website",
      "Include your brand name for recognition (usually at the end)",
      "Write for humans first—make it compelling and click-worthy"
    ],
    relatedTerms: ["meta-description", "header-tags", "serp"],
    relatedGuide: learningGuides.onPageSEO,
    relatedFeature: featurePages.onPageSEO,
    externalResources: [
      { title: "Title Tag - HTML Element Reference", source: "MDN Web Docs", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title" },
      { title: "What Are Title Tags? How to Write Title Tags for SEO", source: "Ahrefs", url: "https://ahrefs.com/blog/title-tag-seo/" }
    ]
  },
  {
    term: "Meta Description",
    slug: "meta-description",
    shortDescription: "A brief summary of a page's content that appears in search engine results below the title.",
    fullDescription: "A meta description is an HTML attribute that provides a concise summary of a web page's content. While it doesn't directly impact search rankings, it significantly influences click-through rates by serving as your 'ad copy' in search results. Google may use your meta description or generate its own based on the search query.",
    category: "On-Page SEO",
    whyItMatters: [
      "Acts as a sales pitch to convince users to click your result",
      "Helps differentiate your listing from competitors in search results",
      "Can include a call-to-action to drive specific user behavior",
      "Improves user experience by setting accurate expectations"
    ],
    bestPractices: [
      "Keep descriptions under 160 characters for full visibility",
      "Include your target keyword naturally (it gets bolded when matched)",
      "Write unique descriptions for every page",
      "Include a clear value proposition or benefit",
      "Add a call-to-action when appropriate ('Learn more', 'Get started')"
    ],
    relatedTerms: ["title-tag", "serp", "click-through-rate"],
    relatedGuide: learningGuides.onPageSEO,
    relatedFeature: featurePages.onPageSEO,
    externalResources: [
      { title: "Meta Description", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Meta_element#The_description_attribute" },
      { title: "How to Write the Perfect Meta Description", source: "Moz", url: "https://moz.com/learn/seo/meta-description" }
    ]
  },
  {
    term: "Header Tags (H1-H6)",
    slug: "header-tags",
    shortDescription: "HTML elements that define headings and subheadings, creating a hierarchical structure for content.",
    fullDescription: "Header tags (H1 through H6) are HTML elements used to define headings and subheadings in your content. They create a hierarchical structure that helps both users and search engines understand the organization and importance of different sections. H1 is the most important (main title), while H6 is the least important.",
    category: "On-Page SEO",
    whyItMatters: [
      "Help search engines understand content structure and topic hierarchy",
      "Improve accessibility for screen readers and assistive technologies",
      "Break up content for better readability and user experience",
      "Provide opportunities for keyword optimization",
      "Can appear as rich snippets in search results"
    ],
    bestPractices: [
      "Use only one H1 per page—it should describe the main topic",
      "Maintain logical hierarchy (don't skip from H2 to H4)",
      "Include relevant keywords naturally in headings",
      "Keep headings descriptive and informative",
      "Use headings to create a scannable content outline"
    ],
    relatedTerms: ["title-tag", "content-structure", "accessibility"],
    relatedGuide: learningGuides.onPageSEO,
    relatedFeature: featurePages.onPageSEO,
    externalResources: [
      { title: "Heading Elements (H1-H6)", source: "MDN Web Docs", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements" },
      { title: "How to Use Header Tags for SEO", source: "Semrush", url: "https://www.semrush.com/blog/header-tags/" }
    ]
  },
  {
    term: "Alt Text",
    slug: "alt-text",
    shortDescription: "Descriptive text for images that helps search engines and screen readers understand image content.",
    fullDescription: "Alt text (alternative text) is an HTML attribute added to image tags that describes the content and function of an image. It serves three purposes: providing context for search engines, displaying when images fail to load, and enabling screen readers to describe images to visually impaired users. Well-written alt text improves both SEO and accessibility.",
    category: "On-Page SEO",
    whyItMatters: [
      "Enables images to rank in Google Image Search",
      "Provides context when images don't load",
      "Essential for accessibility and screen reader users",
      "Helps search engines understand page content better",
      "Required for ADA compliance on many websites"
    ],
    bestPractices: [
      "Be specific and descriptive—describe what's actually in the image",
      "Include relevant keywords naturally (but avoid keyword stuffing)",
      "Keep alt text under 125 characters for screen reader compatibility",
      "Don't start with 'Image of' or 'Picture of'—it's redundant",
      "Leave alt empty (\"\") for purely decorative images"
    ],
    relatedTerms: ["image-seo", "accessibility", "core-web-vitals"],
    relatedGuide: learningGuides.onPageSEO,
    relatedFeature: featurePages.onPageSEO,
    externalResources: [
      { title: "Alternative Text - Web Accessibility", source: "W3C WAI", url: "https://www.w3.org/WAI/tutorials/images/decision-tree/" },
      { title: "Image Alt Text: What It Is & How to Write It", source: "Ahrefs", url: "https://ahrefs.com/blog/alt-text/" }
    ]
  },
  {
    term: "Internal Linking",
    slug: "internal-linking",
    shortDescription: "Links that connect pages within the same website, distributing authority and guiding navigation.",
    fullDescription: "Internal linking is the practice of linking one page of a website to another page on the same website. These links help users navigate, establish information hierarchy, and spread link equity (ranking power) throughout the site. A strong internal linking strategy is essential for SEO and user experience.",
    category: "On-Page SEO",
    whyItMatters: [
      "Distributes page authority and ranking power across your site",
      "Helps search engines discover and index new pages",
      "Improves user navigation and time on site",
      "Establishes topical relationships between pages",
      "Reduces bounce rate by providing relevant next steps"
    ],
    bestPractices: [
      "Use descriptive anchor text that indicates the destination page",
      "Link from high-authority pages to important pages",
      "Create content clusters around topic themes",
      "Ensure every page is reachable within 3 clicks from homepage",
      "Regularly audit for broken internal links"
    ],
    relatedTerms: ["anchor-text", "link-equity", "content-silo"],
    relatedGuide: learningGuides.onPageSEO,
    relatedFeature: featurePages.onPageSEO,
    externalResources: [
      { title: "Internal Link", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Internal_link" },
      { title: "Internal Links for SEO: The Complete Guide", source: "Ahrefs", url: "https://ahrefs.com/blog/internal-links-for-seo/" }
    ]
  },
  {
    term: "Schema Markup",
    slug: "schema-markup",
    shortDescription: "Structured data code that helps search engines understand page content and display rich results.",
    fullDescription: "Schema markup is a semantic vocabulary of tags (microdata) added to HTML that helps search engines understand the context and meaning of your content. When implemented correctly, it can result in rich snippets—enhanced search results with ratings, prices, FAQs, and other eye-catching elements.",
    category: "On-Page SEO",
    whyItMatters: [
      "Enables rich snippets that increase click-through rates",
      "Helps search engines understand content context",
      "Improves visibility in search results",
      "Required for certain SERP features like FAQ and How-To",
      "Enhances voice search compatibility"
    ],
    bestPractices: [
      "Use JSON-LD format (Google's preferred method)",
      "Implement relevant schema types for your content",
      "Test markup with Google's Rich Results Test",
      "Include required and recommended properties",
      "Keep schema data consistent with visible page content"
    ],
    relatedTerms: ["rich-snippets", "structured-data", "serp"],
    relatedGuide: learningGuides.technicalSEO,
    relatedFeature: featurePages.onPageSEO,
    externalResources: [
      { title: "Schema.org", source: "Schema.org", url: "https://schema.org/" },
      { title: "Understand How Structured Data Works", source: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data" }
    ]
  },
  {
    term: "Keyword Density",
    slug: "keyword-density",
    shortDescription: "The percentage of times a keyword appears on a page compared to total word count.",
    fullDescription: "Keyword density is a metric that measures how often a specific keyword or phrase appears on a webpage relative to the total word count. While once a critical SEO factor, modern search engines now prioritize natural language and semantic relevance over exact keyword frequency.",
    category: "On-Page SEO",
    whyItMatters: [
      "Historical SEO factor still referenced in audits",
      "Helps avoid keyword stuffing penalties",
      "Indicates topical focus to search engines",
      "Useful for content optimization benchmarking"
    ],
    bestPractices: [
      "Focus on natural writing rather than hitting a specific percentage",
      "Use keyword variations and synonyms (LSI keywords)",
      "Prioritize user experience over keyword placement",
      "Aim for 1-2% keyword density as a rough guideline",
      "Include keywords in strategic locations (title, H1, first paragraph)"
    ],
    relatedTerms: ["keyword-stuffing", "lsi-keywords", "content-optimization"],
    relatedGuide: learningGuides.onPageSEO,
    relatedFeature: featurePages.onPageSEO,
    externalResources: [
      { title: "Keyword Density", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Keyword_density" },
      { title: "Keyword Density: Is It Still Relevant for SEO?", source: "Ahrefs", url: "https://ahrefs.com/blog/keyword-density/" }
    ]
  },

  // ===== TECHNICAL SEO / CORE WEB VITALS =====
  {
    term: "Core Web Vitals",
    slug: "core-web-vitals",
    shortDescription: "Google's metrics measuring loading performance, interactivity, and visual stability of web pages.",
    fullDescription: "Core Web Vitals are a set of specific metrics that Google considers essential for user experience. They measure three aspects of page performance: Largest Contentful Paint (LCP) for loading speed, Interaction to Next Paint (INP) for interactivity, and Cumulative Layout Shift (CLS) for visual stability. These are confirmed Google ranking factors.",
    category: "Technical SEO",
    whyItMatters: [
      "Direct ranking factor in Google's search algorithm",
      "Impacts user experience and bounce rates",
      "Affects conversion rates—faster pages convert better",
      "Google highlights sites with good Core Web Vitals in search",
      "Provides measurable benchmarks for performance optimization"
    ],
    bestPractices: [
      "Target LCP under 2.5 seconds for the largest visible element",
      "Aim for INP under 200ms for responsive interactions",
      "Keep CLS under 0.1 to prevent layout shifts",
      "Optimize images and use modern formats (WebP, AVIF)",
      "Implement lazy loading for below-fold content",
      "Use a Content Delivery Network (CDN) for faster delivery"
    ],
    relatedTerms: ["lcp", "inp", "cls", "page-speed"],
    relatedGuide: learningGuides.coreWebVitals,
    relatedFeature: featurePages.webHosting,
    externalResources: [
      { title: "Core Web Vitals", source: "Google Developers", url: "https://developers.google.com/search/docs/appearance/core-web-vitals" },
      { title: "Web Vitals", source: "web.dev (Google)", url: "https://web.dev/articles/vitals" }
    ]
  },
  {
    term: "Largest Contentful Paint (LCP)",
    slug: "lcp",
    shortDescription: "Core Web Vital measuring how long it takes for the largest content element to become visible.",
    fullDescription: "Largest Contentful Paint (LCP) is a Core Web Vital that measures loading performance by timing how long it takes for the largest visible content element (like an image or text block) to render on the page. Google considers LCP a key user experience metric and uses it as a ranking factor.",
    category: "Technical SEO",
    whyItMatters: [
      "Direct Google ranking factor",
      "Measures perceived loading speed",
      "Impacts user experience and engagement",
      "Affects bounce rates—slow LCP loses visitors"
    ],
    bestPractices: [
      "Target LCP under 2.5 seconds",
      "Optimize largest images with compression",
      "Preload critical resources",
      "Use CDN for faster asset delivery",
      "Minimize render-blocking JavaScript"
    ],
    relatedTerms: ["core-web-vitals", "page-speed", "inp", "cls"],
    relatedGuide: learningGuides.coreWebVitals,
    relatedFeature: featurePages.webHosting,
    externalResources: [
      { title: "Largest Contentful Paint (LCP)", source: "web.dev", url: "https://web.dev/articles/lcp" }
    ]
  },
  {
    term: "Cumulative Layout Shift (CLS)",
    slug: "cls",
    shortDescription: "Core Web Vital measuring visual stability—how much page elements move during loading.",
    fullDescription: "Cumulative Layout Shift (CLS) is a Core Web Vital that measures visual stability by quantifying how much visible content shifts during the page loading process. Unexpected layout shifts frustrate users, especially when they cause accidental clicks on the wrong elements.",
    category: "Technical SEO",
    whyItMatters: [
      "Google ranking factor for page experience",
      "Prevents frustrating user experiences",
      "Reduces accidental clicks and user errors",
      "Indicates professional, polished web design"
    ],
    bestPractices: [
      "Set explicit dimensions for images and videos",
      "Reserve space for ad slots and embeds",
      "Avoid inserting content above existing content",
      "Use CSS aspect-ratio for responsive media",
      "Target CLS score under 0.1"
    ],
    relatedTerms: ["core-web-vitals", "lcp", "inp", "page-speed"],
    relatedGuide: learningGuides.coreWebVitals,
    relatedFeature: featurePages.webHosting,
    externalResources: [
      { title: "Cumulative Layout Shift (CLS)", source: "web.dev", url: "https://web.dev/articles/cls" }
    ]
  },
  {
    term: "Page Speed",
    slug: "page-speed",
    shortDescription: "How fast a webpage loads and becomes interactive for users.",
    fullDescription: "Page speed refers to how quickly a webpage loads its content and becomes fully interactive for users. It encompasses multiple metrics including time to first byte (TTFB), first contentful paint (FCP), and time to interactive (TTI). Page speed is a confirmed Google ranking factor and critical for user experience.",
    category: "Technical SEO",
    whyItMatters: [
      "Direct Google ranking factor",
      "Impacts conversion rates—every second costs sales",
      "Affects user satisfaction and bounce rates",
      "Mobile users especially sensitive to slow speeds",
      "Influences crawl budget efficiency"
    ],
    bestPractices: [
      "Optimize and compress all images",
      "Minify CSS, JavaScript, and HTML",
      "Enable browser caching",
      "Use a Content Delivery Network (CDN)",
      "Reduce server response time",
      "Eliminate render-blocking resources"
    ],
    relatedTerms: ["core-web-vitals", "lcp", "ttfb", "cdn"],
    relatedGuide: learningGuides.technicalSEO,
    relatedFeature: featurePages.webHosting,
    externalResources: [
      { title: "PageSpeed Insights", source: "Google", url: "https://pagespeed.web.dev/" },
      { title: "Why Speed Matters", source: "web.dev", url: "https://web.dev/articles/why-speed-matters" }
    ]
  },
  {
    term: "SSL Certificate",
    slug: "ssl-certificate",
    shortDescription: "Security protocol that encrypts data between a user's browser and your website.",
    fullDescription: "An SSL (Secure Sockets Layer) certificate is a digital certificate that authenticates a website's identity and enables an encrypted connection. Websites with SSL show 'https://' in the URL and a padlock icon. Google has confirmed HTTPS as a ranking signal, making SSL essential for SEO.",
    category: "Technical SEO",
    whyItMatters: [
      "Google ranking factor since 2014",
      "Required for secure data transmission",
      "Builds trust with visitors (padlock icon)",
      "Required for Chrome to show 'Secure' label",
      "Necessary for accepting payments"
    ],
    bestPractices: [
      "Use HTTPS across your entire site",
      "Set up proper 301 redirects from HTTP to HTTPS",
      "Update internal links to HTTPS versions",
      "Ensure mixed content warnings are resolved",
      "Renew certificates before expiration"
    ],
    relatedTerms: ["https", "website-security", "technical-seo"],
    relatedGuide: learningGuides.technicalSEO,
    relatedFeature: featurePages.webHosting,
    externalResources: [
      { title: "SSL/TLS", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Transport_Layer_Security" },
      { title: "HTTPS as a ranking signal", source: "Google Search Central", url: "https://developers.google.com/search/blog/2014/08/https-as-ranking-signal" }
    ]
  },

  // ===== OFF-PAGE SEO / LINK BUILDING =====
  {
    term: "Backlinks",
    slug: "backlinks",
    shortDescription: "Links from other websites pointing to your site, serving as 'votes of confidence' for search engines.",
    fullDescription: "Backlinks (also called inbound links or incoming links) are links from external websites that point to pages on your website. They're one of Google's most important ranking factors because they act as endorsements—when a reputable site links to you, it signals that your content is valuable and trustworthy.",
    category: "Off-Page SEO",
    whyItMatters: [
      "One of the top 3 ranking factors in Google's algorithm",
      "Build domain authority and trust over time",
      "Drive referral traffic directly from linking sites",
      "Help search engines discover new pages faster",
      "Establish topical authority in your industry"
    ],
    bestPractices: [
      "Focus on quality over quantity—one authoritative link beats 100 spammy ones",
      "Earn links naturally through exceptional content",
      "Build relationships with industry publications and bloggers",
      "Diversify anchor text to appear natural",
      "Regularly audit your backlink profile for toxic links",
      "Disavow harmful links using Google's Disavow Tool"
    ],
    relatedTerms: ["domain-authority", "anchor-text", "link-building"],
    relatedGuide: learningGuides.offPageSEO,
    relatedFeature: featurePages.offPageSEO,
    externalResources: [
      { title: "Backlink", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Backlink" },
      { title: "What Are Backlinks? And How to Build Them", source: "Ahrefs", url: "https://ahrefs.com/blog/backlinks/" }
    ]
  },
  {
    term: "Domain Authority",
    slug: "domain-authority",
    shortDescription: "A score (1-100) predicting how likely a website is to rank in search engine results.",
    fullDescription: "Domain Authority (DA) is a search engine ranking score developed by Moz that predicts how likely a website is to rank in search results. Scores range from 1 to 100, with higher scores indicating greater ranking potential. While not a Google metric, DA correlates strongly with actual ranking ability and is widely used in the SEO industry.",
    category: "Off-Page SEO",
    whyItMatters: [
      "Helps evaluate the competitive strength of websites",
      "Used to assess potential link building targets",
      "Correlates strongly with actual search rankings",
      "Serves as a benchmark for measuring SEO progress",
      "Considered by publishers when evaluating guest post opportunities"
    ],
    bestPractices: [
      "Build high-quality backlinks from authoritative sites",
      "Remove or disavow toxic backlinks regularly",
      "Create comprehensive, link-worthy content",
      "Improve internal linking structure",
      "Focus on long-term authority building, not quick fixes",
      "Monitor competitor DA to understand the competitive landscape"
    ],
    relatedTerms: ["backlinks", "domain-rating", "page-authority"],
    relatedGuide: learningGuides.domainAuthority,
    relatedFeature: featurePages.domainAuthority,
    externalResources: [
      { title: "What Is Domain Authority?", source: "Moz", url: "https://moz.com/learn/seo/domain-authority" },
      { title: "Domain Authority vs Domain Rating", source: "Ahrefs", url: "https://ahrefs.com/blog/domain-rating/" }
    ]
  },
  {
    term: "Anchor Text",
    slug: "anchor-text",
    shortDescription: "The clickable, visible text in a hyperlink that provides context about the linked page.",
    fullDescription: "Anchor text is the visible, clickable text in a hyperlink. It provides context to both users and search engines about the content of the destination page. The words used in anchor text can influence search rankings for the linked page, making it an important factor in both internal linking and backlink strategies.",
    category: "Off-Page SEO",
    whyItMatters: [
      "Helps search engines understand what the linked page is about",
      "Influences rankings for the keywords used in the anchor",
      "Improves user experience by setting expectations for the link",
      "Over-optimized anchor text can trigger Google penalties",
      "Part of a natural link profile analysis"
    ],
    bestPractices: [
      "Use descriptive, relevant text instead of 'click here'",
      "Vary anchor text naturally—avoid exact-match keyword stuffing",
      "Keep anchor text concise but informative",
      "Ensure anchor text accurately reflects the destination page",
      "Use branded anchors for a natural link profile",
      "Monitor your anchor text distribution regularly"
    ],
    relatedTerms: ["backlinks", "internal-linking", "link-building"],
    relatedGuide: learningGuides.linkBuilding,
    relatedFeature: featurePages.offPageSEO,
    externalResources: [
      { title: "Anchor Text", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Anchor_text" },
      { title: "Anchor Text: A Data Driven Guide", source: "Backlinko", url: "https://backlinko.com/hub/seo/anchor-text" }
    ]
  },
  {
    term: "Link Building",
    slug: "link-building",
    shortDescription: "The process of acquiring hyperlinks from other websites to improve search rankings.",
    fullDescription: "Link building is the practice of acquiring hyperlinks from other websites to your own. Search engines use links to crawl the web and to evaluate the authority and relevance of pages. Effective link building is one of the most challenging but rewarding aspects of SEO.",
    category: "Off-Page SEO",
    whyItMatters: [
      "Core component of off-page SEO strategy",
      "Builds domain authority over time",
      "Drives referral traffic from linked sites",
      "Establishes industry relationships",
      "Signals trust and credibility to search engines"
    ],
    bestPractices: [
      "Create link-worthy content that others want to reference",
      "Pursue guest posting on relevant industry sites",
      "Build genuine relationships with industry peers",
      "Leverage broken link building opportunities",
      "Avoid purchasing links—focus on earning them"
    ],
    relatedTerms: ["backlinks", "domain-authority", "guest-posting"],
    relatedGuide: learningGuides.linkBuilding,
    relatedFeature: featurePages.offPageSEO,
    externalResources: [
      { title: "Link Building for SEO: The Complete Guide", source: "Ahrefs", url: "https://ahrefs.com/blog/link-building/" }
    ]
  },
  {
    term: "Nofollow Link",
    slug: "nofollow",
    shortDescription: "A link attribute that tells search engines not to pass ranking credit to the destination page.",
    fullDescription: "A nofollow link is a hyperlink with a rel='nofollow' attribute that instructs search engines not to pass PageRank or anchor text signals to the linked page. Originally created to combat spam, nofollow links are commonly used for paid links, user-generated content, and untrusted sources.",
    category: "Off-Page SEO",
    whyItMatters: [
      "Prevents passing link equity for sponsored content",
      "Required by Google for paid or sponsored links",
      "Helps maintain a natural link profile",
      "Still provides traffic even without SEO value",
      "Part of link profile diversity"
    ],
    bestPractices: [
      "Use nofollow for sponsored and paid links",
      "Apply to user-generated content links (comments, forums)",
      "Balance dofollow and nofollow in your profile",
      "Don't nofollow internal links",
      "Consider rel='sponsored' for paid links, rel='ugc' for user content"
    ],
    relatedTerms: ["backlinks", "link-building", "dofollow"],
    relatedGuide: learningGuides.offPageSEO,
    relatedFeature: featurePages.offPageSEO,
    externalResources: [
      { title: "Nofollow", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Nofollow" },
      { title: "Link Spam Update and Qualifying Links", source: "Google Search Central", url: "https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links" }
    ]
  },

  // ===== ANALYTICS =====
  {
    term: "Bounce Rate",
    slug: "bounce-rate",
    shortDescription: "The percentage of visitors who leave a website after viewing only one page.",
    fullDescription: "Bounce rate is a web analytics metric that measures the percentage of visitors who enter a site and then leave ('bounce') rather than continuing to view other pages. A high bounce rate might indicate that the page content doesn't match user expectations, the page loads too slowly, or there's no clear path to continue exploring.",
    category: "Analytics",
    whyItMatters: [
      "Indicates content relevance and user engagement",
      "Can signal user experience problems",
      "Helps identify pages that need optimization",
      "Affects how Google perceives page quality (indirectly)",
      "Important for understanding marketing channel effectiveness"
    ],
    bestPractices: [
      "Ensure page content matches the search query or ad that brought users",
      "Improve page load speed to prevent impatient exits",
      "Add clear calls-to-action and internal links",
      "Use engaging above-the-fold content",
      "Consider context—some pages naturally have higher bounce rates",
      "Segment bounce rate by traffic source for better insights"
    ],
    relatedTerms: ["session-duration", "conversion-rate", "user-engagement"],
    relatedGuide: learningGuides.analytics,
    relatedFeature: featurePages.analytics,
    externalResources: [
      { title: "Bounce Rate", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Bounce_rate" },
      { title: "Bounce Rate Benchmarks: What's a Good Bounce Rate?", source: "Semrush", url: "https://www.semrush.com/blog/bounce-rate/" }
    ]
  },
  {
    term: "Conversion Rate",
    slug: "conversion-rate",
    shortDescription: "The percentage of website visitors who complete a desired action or goal.",
    fullDescription: "Conversion rate is the percentage of visitors who complete a desired action on your website, such as making a purchase, filling out a form, or signing up for a newsletter. It's calculated by dividing the number of conversions by the total number of visitors and multiplying by 100. This is one of the most important metrics for measuring website effectiveness.",
    category: "Analytics",
    whyItMatters: [
      "Directly measures the effectiveness of your website",
      "Helps calculate return on investment (ROI) for marketing",
      "Identifies opportunities for optimization",
      "Benchmarks performance against industry standards",
      "Essential for understanding customer journey effectiveness"
    ],
    bestPractices: [
      "Define clear conversion goals for each page",
      "A/B test different elements (headlines, CTAs, forms)",
      "Reduce friction in the conversion process",
      "Use compelling, benefit-focused copy",
      "Ensure forms are simple and mobile-friendly",
      "Track micro-conversions along the customer journey"
    ],
    relatedTerms: ["bounce-rate", "cta", "landing-page"],
    relatedGuide: learningGuides.cro,
    relatedFeature: featurePages.analytics,
    externalResources: [
      { title: "Conversion Rate Optimization", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Conversion_rate_optimization" },
      { title: "What is Conversion Rate? How to Calculate and Improve", source: "HubSpot", url: "https://blog.hubspot.com/marketing/conversion-rate" }
    ]
  },
  {
    term: "Click-Through Rate (CTR)",
    slug: "click-through-rate",
    shortDescription: "The percentage of people who click on a link after seeing it in search results or ads.",
    fullDescription: "Click-Through Rate (CTR) is the ratio of users who click on a specific link to the total number of users who view that link. In SEO, CTR typically refers to the percentage of searchers who click on your result in the SERPs. A higher CTR signals to Google that your result is relevant and useful.",
    category: "Analytics",
    whyItMatters: [
      "Indicates how compelling your titles and descriptions are",
      "May influence rankings as a user engagement signal",
      "Directly impacts organic traffic volume",
      "Key metric for evaluating meta tag effectiveness",
      "Essential for PPC campaign optimization"
    ],
    bestPractices: [
      "Write compelling, benefit-focused title tags",
      "Include power words and numbers in titles",
      "Optimize meta descriptions with calls-to-action",
      "Use schema markup for rich snippets",
      "Test different title formats to improve CTR"
    ],
    relatedTerms: ["title-tag", "meta-description", "serp"],
    relatedGuide: learningGuides.analytics,
    relatedFeature: featurePages.analytics,
    externalResources: [
      { title: "Click-Through Rate", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Click-through_rate" },
      { title: "Organic CTR Study: 8.5M Google Searches", source: "Backlinko", url: "https://backlinko.com/google-ctr-stats" }
    ]
  },
  {
    term: "Session Duration",
    slug: "session-duration",
    shortDescription: "The average length of time users spend on your website during a single visit.",
    fullDescription: "Session duration (also called average session duration) measures the average time users spend on your website during a single visit. It's calculated by dividing total time spent by all users by the total number of sessions. Longer session durations typically indicate engaging content and good user experience.",
    category: "Analytics",
    whyItMatters: [
      "Indicates content engagement and quality",
      "Suggests how well content meets user needs",
      "Correlates with conversion likelihood",
      "Helps identify problematic pages with low engagement",
      "Used to benchmark content performance"
    ],
    bestPractices: [
      "Create comprehensive, in-depth content",
      "Add engaging multimedia (videos, interactive elements)",
      "Improve internal linking to encourage exploration",
      "Ensure content matches user intent",
      "Optimize page speed to prevent early exits"
    ],
    relatedTerms: ["bounce-rate", "pages-per-session", "user-engagement"],
    relatedGuide: learningGuides.analytics,
    relatedFeature: featurePages.analytics,
    externalResources: [
      { title: "Session Duration Metrics", source: "Google Analytics Help", url: "https://support.google.com/analytics/answer/1006253" }
    ]
  },

  // ===== SERP / SEARCH =====
  {
    term: "SERP",
    slug: "serp",
    shortDescription: "Search Engine Results Page—the page displayed by search engines in response to a user's query.",
    fullDescription: "SERP stands for Search Engine Results Page—the page you see after entering a search query in Google, Bing, or other search engines. Modern SERPs include various elements beyond traditional organic listings: featured snippets, People Also Ask boxes, local packs, knowledge panels, images, videos, and paid advertisements.",
    category: "SEO Fundamentals",
    whyItMatters: [
      "Understanding SERPs helps optimize for visibility",
      "Different SERP features require different optimization strategies",
      "SERP layout affects click-through rates for different positions",
      "Featured snippets can capture significant traffic",
      "SERP analysis reveals user intent for keywords"
    ],
    bestPractices: [
      "Analyze SERP features for target keywords",
      "Optimize for position zero (featured snippets)",
      "Use schema markup to qualify for rich results",
      "Create content that matches SERP intent signals",
      "Monitor SERP changes for ranking fluctuations"
    ],
    relatedTerms: ["featured-snippet", "rich-snippets", "organic-search"],
    relatedGuide: learningGuides.onPageSEO,
    relatedFeature: featurePages.analytics,
    externalResources: [
      { title: "Search Engine Results Page", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Search_engine_results_page" },
      { title: "SERP Features: The Complete Guide", source: "Moz", url: "https://moz.com/learn/seo/serp-features" }
    ]
  },
  {
    term: "Featured Snippet",
    slug: "featured-snippet",
    shortDescription: "A highlighted search result box that appears at the top of Google displaying a direct answer.",
    fullDescription: "A featured snippet is a special search result that appears at the top of Google's organic results in a highlighted box, often called 'position zero.' It extracts and displays content from a webpage that directly answers a user's query, typically in paragraph, list, table, or video format.",
    category: "SEO Fundamentals",
    whyItMatters: [
      "Appears above all organic results (position zero)",
      "Dramatically increases visibility and CTR",
      "Establishes authority and expertise",
      "Powers voice search responses",
      "Can steal traffic from position #1"
    ],
    bestPractices: [
      "Structure content to directly answer questions",
      "Use clear headers with question-based phrasing",
      "Format answers in lists, tables, or concise paragraphs",
      "Target question-based keywords",
      "Include the question and answer near each other"
    ],
    relatedTerms: ["serp", "rich-snippets", "position-zero"],
    relatedGuide: learningGuides.onPageSEO,
    relatedFeature: featurePages.faqGeneration,
    externalResources: [
      { title: "Featured Snippets", source: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/featured-snippets" },
      { title: "How to Get Featured Snippets", source: "Ahrefs", url: "https://ahrefs.com/blog/featured-snippets-study/" }
    ]
  },
  {
    term: "Rich Snippets",
    slug: "rich-snippets",
    shortDescription: "Enhanced search results displaying additional information like ratings, prices, or images.",
    fullDescription: "Rich snippets are enhanced search result listings that display additional information beyond the standard title, URL, and meta description. They can include star ratings, product prices, recipe cooking times, FAQ dropdowns, and more. Rich snippets are generated when search engines understand structured data on your pages.",
    category: "SEO Fundamentals",
    whyItMatters: [
      "Increase visibility and click-through rates",
      "Make listings stand out from competitors",
      "Provide useful information before users click",
      "Indicate content quality and trustworthiness",
      "Can increase organic traffic significantly"
    ],
    bestPractices: [
      "Implement relevant schema markup types",
      "Use JSON-LD format for structured data",
      "Test with Google's Rich Results Test tool",
      "Include required and recommended schema properties",
      "Keep schema data accurate and up-to-date"
    ],
    relatedTerms: ["schema-markup", "structured-data", "serp"],
    relatedGuide: learningGuides.technicalSEO,
    relatedFeature: featurePages.onPageSEO,
    externalResources: [
      { title: "Rich Results Test", source: "Google Search Console", url: "https://search.google.com/test/rich-results" },
      { title: "Search Gallery: Rich Results", source: "Google Developers", url: "https://developers.google.com/search/docs/appearance/structured-data/search-gallery" }
    ]
  },

  // ===== LOCAL SEO / GMB =====
  {
    term: "Google Business Profile",
    slug: "google-business-profile",
    shortDescription: "Free Google tool for managing your business appearance in Google Search and Maps.",
    fullDescription: "Google Business Profile (formerly Google My Business) is a free tool that allows businesses to manage their online presence across Google Search and Maps. It displays crucial business information including address, hours, photos, reviews, and posts. Optimizing your GBP is essential for local SEO success.",
    category: "Local SEO",
    whyItMatters: [
      "Primary factor for local pack rankings",
      "First impression for local searchers",
      "Platform for customer reviews and ratings",
      "Free marketing tool for local businesses",
      "Drives phone calls, directions, and website visits"
    ],
    bestPractices: [
      "Claim and verify your business listing",
      "Complete every section with accurate information",
      "Add high-quality photos and videos regularly",
      "Respond to all customer reviews promptly",
      "Post updates, offers, and events frequently",
      "Use relevant categories and attributes"
    ],
    relatedTerms: ["local-seo", "local-pack", "nap-consistency"],
    relatedGuide: learningGuides.gmbOptimization,
    relatedFeature: featurePages.gmbOptimization,
    externalResources: [
      { title: "Google Business Profile", source: "Google", url: "https://www.google.com/business/" },
      { title: "How to Optimize Google Business Profile", source: "Moz", url: "https://moz.com/learn/seo/google-my-business" }
    ]
  },
  {
    term: "Local Pack",
    slug: "local-pack",
    shortDescription: "The map-based section in Google results showing top 3 local business listings.",
    fullDescription: "The Local Pack (also called Map Pack or 3-Pack) is a prominent SERP feature that displays three local business listings along with a map for location-based searches. Appearing in the Local Pack can dramatically increase visibility and drive foot traffic for local businesses.",
    category: "Local SEO",
    whyItMatters: [
      "Prime real estate in local search results",
      "Displays above organic results for local queries",
      "Shows critical business info at a glance",
      "Drives significant traffic and phone calls",
      "Essential for brick-and-mortar businesses"
    ],
    bestPractices: [
      "Optimize Google Business Profile completely",
      "Build consistent local citations",
      "Earn and respond to customer reviews",
      "Ensure NAP consistency across the web",
      "Use location-specific keywords on your website"
    ],
    relatedTerms: ["google-business-profile", "local-seo", "nap-consistency"],
    relatedGuide: learningGuides.gmbOptimization,
    relatedFeature: featurePages.gmbOptimization,
    externalResources: [
      { title: "Local Pack Ranking Factors", source: "Moz Local Search Ranking Factors", url: "https://moz.com/local-search-ranking-factors" }
    ]
  },
  {
    term: "NAP Consistency",
    slug: "nap-consistency",
    shortDescription: "Ensuring your business Name, Address, and Phone number are identical across all online listings.",
    fullDescription: "NAP stands for Name, Address, and Phone number. NAP consistency refers to ensuring these business details are exactly the same across all online directories, citations, social profiles, and your website. Inconsistent NAP information confuses search engines and can hurt local rankings.",
    category: "Local SEO",
    whyItMatters: [
      "Critical ranking factor for local SEO",
      "Helps search engines verify business legitimacy",
      "Prevents customer confusion",
      "Strengthens local citation value",
      "Required for accurate business directory listings"
    ],
    bestPractices: [
      "Audit all existing citations for consistency",
      "Use exact same format everywhere (Street vs St.)",
      "Update all listings when business info changes",
      "Include NAP in website footer with schema markup",
      "Monitor for duplicate or incorrect listings"
    ],
    relatedTerms: ["local-seo", "local-citations", "google-business-profile"],
    relatedGuide: learningGuides.gmbOptimization,
    relatedFeature: featurePages.gmbOptimization,
    externalResources: [
      { title: "NAP Consistency for Local SEO", source: "BrightLocal", url: "https://www.brightlocal.com/learn/local-seo/introduction-to-local-seo/citation-and-nap-consistency/" }
    ]
  },
  {
    term: "Local SEO",
    slug: "local-seo",
    shortDescription: "Optimization strategies to increase visibility in local search results and map listings.",
    fullDescription: "Local SEO is the practice of optimizing a business's online presence to attract more customers from relevant local searches. These searches take place on Google and other search engines, often with 'near me' or geographic modifiers. Local SEO includes optimizing Google Business Profile, building local citations, managing reviews, and creating location-specific content.",
    category: "Local SEO",
    whyItMatters: [
      "46% of all Google searches have local intent",
      "88% of mobile local searches result in a call or visit within 24 hours",
      "Drives foot traffic to physical locations",
      "Helps compete with larger competitors in specific areas",
      "Essential for service-area and multi-location businesses"
    ],
    bestPractices: [
      "Optimize and maintain your Google Business Profile",
      "Build consistent NAP citations across directories",
      "Encourage and respond to customer reviews",
      "Create location-specific landing pages",
      "Use local schema markup on your website",
      "Build local backlinks from community organizations"
    ],
    relatedTerms: ["google-business-profile", "local-pack", "nap-consistency", "local-citations"],
    relatedGuide: learningGuides.localSEO,
    relatedFeature: featurePages.gmbOptimization,
    externalResources: [
      { title: "Local SEO", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Local_search_(Internet)" },
      { title: "The Complete Guide to Local SEO", source: "Moz", url: "https://moz.com/learn/seo/local" }
    ]
  },
  {
    term: "Local Citations",
    slug: "local-citations",
    shortDescription: "Online mentions of your business name, address, and phone number on directories and websites.",
    fullDescription: "Local citations are any online mention of your business's name, address, and phone number (NAP). Citations can occur on local business directories, websites, apps, and social platforms. They help search engines verify your business information and improve local search rankings.",
    category: "Local SEO",
    whyItMatters: [
      "Helps search engines verify business legitimacy",
      "Improves local search rankings",
      "Increases online visibility across platforms",
      "Builds trust with potential customers",
      "Supports NAP consistency efforts"
    ],
    bestPractices: [
      "List on major directories (Yelp, Yellow Pages, BBB)",
      "Ensure 100% consistent NAP information",
      "Include industry-specific directories",
      "Monitor and update citations regularly",
      "Remove or correct duplicate listings"
    ],
    relatedTerms: ["nap-consistency", "local-seo", "google-business-profile"],
    relatedGuide: learningGuides.localSEO,
    relatedFeature: featurePages.gmbOptimization,
    externalResources: [
      { title: "What Are Local Citations?", source: "BrightLocal", url: "https://www.brightlocal.com/learn/local-seo/introduction-to-local-seo/what-are-local-citations/" }
    ]
  },

  // ===== CONTENT / BLOGGING =====
  {
    term: "Content Marketing",
    slug: "content-marketing",
    shortDescription: "Creating and distributing valuable content to attract and engage target audiences.",
    fullDescription: "Content marketing is a strategic approach focused on creating and distributing valuable, relevant, and consistent content to attract and retain a clearly defined audience. Unlike traditional advertising, content marketing aims to provide value first, building trust that eventually drives profitable customer action.",
    category: "Content Strategy",
    whyItMatters: [
      "Builds brand authority and trust",
      "Attracts organic search traffic",
      "Generates leads at lower cost than paid advertising",
      "Supports all stages of the customer journey",
      "Creates long-term compounding SEO value"
    ],
    bestPractices: [
      "Develop a documented content strategy",
      "Create content for every stage of the buyer journey",
      "Focus on quality and depth over quantity",
      "Optimize content for search and user intent",
      "Repurpose content across multiple channels",
      "Measure and iterate based on performance"
    ],
    relatedTerms: ["blog-post", "content-strategy", "seo"],
    relatedGuide: learningGuides.automatedBlogging,
    relatedFeature: featurePages.automatedBlog,
    externalResources: [
      { title: "Content Marketing", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Content_marketing" },
      { title: "What is Content Marketing?", source: "Content Marketing Institute", url: "https://contentmarketinginstitute.com/what-is-content-marketing/" }
    ]
  },
  {
    term: "Evergreen Content",
    slug: "evergreen-content",
    shortDescription: "Content that remains relevant and valuable over an extended period of time.",
    fullDescription: "Evergreen content is content that maintains its relevance and value long after it's published. Unlike news or trend-based content, evergreen pieces continue to attract traffic and generate leads for months or years. Examples include how-to guides, FAQs, glossaries, and foundational topic explanations.",
    category: "Content Strategy",
    whyItMatters: [
      "Provides long-term ROI on content investment",
      "Continuously attracts organic traffic",
      "Builds authority on foundational topics",
      "Reduces content production pressure",
      "Can be updated to maintain freshness"
    ],
    bestPractices: [
      "Focus on timeless topics in your industry",
      "Create comprehensive, definitive resources",
      "Avoid time-sensitive references",
      "Update regularly to maintain accuracy",
      "Target keywords with consistent search volume"
    ],
    relatedTerms: ["content-marketing", "blog-post", "content-refresh"],
    relatedGuide: learningGuides.automatedBlogging,
    relatedFeature: featurePages.automatedBlog,
    externalResources: [
      { title: "Evergreen Content", source: "Ahrefs", url: "https://ahrefs.com/blog/evergreen-content/" }
    ]
  },
  {
    term: "Keyword Research",
    slug: "keyword-research",
    shortDescription: "The process of finding and analyzing search terms people enter into search engines.",
    fullDescription: "Keyword research is the process of discovering what words and phrases your target audience uses when searching for products, services, or information online. It involves analyzing search volume, competition, and user intent to identify the best keywords to target in your SEO and content strategy.",
    category: "SEO Fundamentals",
    whyItMatters: [
      "Foundation of all SEO and content strategy",
      "Reveals what your audience is searching for",
      "Identifies content opportunities and gaps",
      "Helps prioritize SEO efforts by potential ROI",
      "Uncovers new market opportunities"
    ],
    bestPractices: [
      "Start with seed keywords from your business",
      "Analyze search volume and competition",
      "Consider search intent for each keyword",
      "Group keywords into topic clusters",
      "Target long-tail keywords for easier wins",
      "Regularly refresh keyword research"
    ],
    relatedTerms: ["search-intent", "long-tail-keywords", "content-strategy"],
    relatedGuide: learningGuides.onPageSEO,
    relatedFeature: featurePages.analytics,
    externalResources: [
      { title: "Keyword Research", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Keyword_research" },
      { title: "Keyword Research Guide", source: "Ahrefs", url: "https://ahrefs.com/blog/keyword-research/" }
    ]
  },
  {
    term: "Long-Tail Keywords",
    slug: "long-tail-keywords",
    shortDescription: "Longer, more specific keyword phrases with lower search volume but higher conversion intent.",
    fullDescription: "Long-tail keywords are longer, more specific search phrases that typically have lower search volume but higher conversion rates. They're called 'long-tail' because of their position on the search demand curve. While each long-tail keyword gets fewer searches, they collectively make up the majority of all search traffic.",
    category: "SEO Fundamentals",
    whyItMatters: [
      "Lower competition makes ranking easier",
      "Higher conversion rates due to specific intent",
      "Collectively drive majority of search traffic",
      "Better match user intent",
      "Ideal for newer websites building authority"
    ],
    bestPractices: [
      "Use keyword research tools to find long-tail variations",
      "Answer specific questions your audience asks",
      "Create dedicated pages for long-tail opportunities",
      "Use long-tail keywords naturally in content",
      "Group related long-tail keywords into content clusters"
    ],
    relatedTerms: ["keyword-research", "search-intent", "content-strategy"],
    relatedGuide: learningGuides.onPageSEO,
    relatedFeature: featurePages.analytics,
    externalResources: [
      { title: "Long Tail Keywords", source: "Ahrefs", url: "https://ahrefs.com/blog/long-tail-keywords/" }
    ]
  },

  // ===== FAQ / STRUCTURED CONTENT =====
  {
    term: "FAQ Schema",
    slug: "faq-schema",
    shortDescription: "Structured data markup that enables FAQ dropdowns to appear directly in search results.",
    fullDescription: "FAQ schema is a type of structured data markup (using JSON-LD) that identifies frequently asked questions and answers on a webpage. When properly implemented, it can enable FAQ rich results in Google search—expandable question/answer pairs that appear directly in the SERP.",
    category: "Technical SEO",
    whyItMatters: [
      "Increases SERP real estate and visibility",
      "Improves click-through rates",
      "Answers user questions before they click",
      "Establishes expertise and authority",
      "Powers voice search answers"
    ],
    bestPractices: [
      "Implement JSON-LD format for FAQ markup",
      "Include genuine FAQs that provide value",
      "Keep answers concise but informative",
      "Ensure visible FAQ content matches schema data",
      "Test with Google's Rich Results Test"
    ],
    relatedTerms: ["schema-markup", "rich-snippets", "structured-data"],
    relatedGuide: learningGuides.faqGeneration,
    relatedFeature: featurePages.faqGeneration,
    externalResources: [
      { title: "FAQ Schema Markup", source: "Schema.org", url: "https://schema.org/FAQPage" },
      { title: "FAQ Structured Data", source: "Google Developers", url: "https://developers.google.com/search/docs/appearance/structured-data/faqpage" }
    ]
  },

  // ===== SOCIAL SIGNALS =====
  {
    term: "Social Signals",
    slug: "social-signals",
    shortDescription: "Social media engagement metrics that may indirectly influence search rankings.",
    fullDescription: "Social signals refer to the collective shares, likes, comments, and overall social media visibility of a webpage or brand. While Google has stated that social signals are not a direct ranking factor, they correlate with factors that do influence rankings, such as backlinks, brand awareness, and traffic.",
    category: "Social Media",
    whyItMatters: [
      "Increases content visibility and reach",
      "Can lead to natural backlink acquisition",
      "Builds brand awareness and authority",
      "Drives referral traffic to your website",
      "Indicates content resonance with audience"
    ],
    bestPractices: [
      "Create shareable, valuable content",
      "Make social sharing easy with share buttons",
      "Engage actively on relevant social platforms",
      "Encourage employees to share company content",
      "Monitor brand mentions across social channels"
    ],
    relatedTerms: ["content-marketing", "brand-awareness", "engagement"],
    relatedGuide: learningGuides.socialSignals,
    relatedFeature: featurePages.socialSignals,
    externalResources: [
      { title: "Do Social Signals Affect SEO?", source: "Moz", url: "https://moz.com/blog/do-social-shares-influence-seo" }
    ]
  },

  // ===== PPC / LANDING PAGES =====
  {
    term: "Landing Page",
    slug: "landing-page",
    shortDescription: "A standalone web page designed specifically to convert visitors into leads or customers.",
    fullDescription: "A landing page is a standalone web page created specifically for a marketing or advertising campaign. It's where visitors 'land' after clicking a link in an email, ad, or other digital location. Unlike regular website pages, landing pages have a single focused objective—known as a call to action (CTA).",
    category: "Conversion",
    whyItMatters: [
      "Directly impacts campaign conversion rates",
      "Focused design eliminates distractions",
      "Enables precise A/B testing",
      "Improves Quality Score in paid ads",
      "Provides targeted messaging for specific audiences"
    ],
    bestPractices: [
      "Match landing page message to ad or link source",
      "Include a single, clear call-to-action",
      "Remove navigation and external links",
      "Use compelling headlines and benefits",
      "Optimize for mobile devices",
      "A/B test different elements continuously"
    ],
    relatedTerms: ["conversion-rate", "cta", "a-b-testing"],
    relatedGuide: learningGuides.ppcLandingPages,
    relatedFeature: featurePages.ppcLandingPages,
    externalResources: [
      { title: "Landing Page", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Landing_page" },
      { title: "Landing Page Best Practices", source: "Unbounce", url: "https://unbounce.com/landing-page-articles/what-is-a-landing-page/" }
    ]
  },
  {
    term: "Quality Score",
    slug: "quality-score",
    shortDescription: "Google Ads metric rating the quality of your ads, keywords, and landing pages.",
    fullDescription: "Quality Score is a diagnostic tool in Google Ads that gives you a sense of how well your ad quality compares to other advertisers. It's measured on a scale of 1-10 based on expected click-through rate, ad relevance, and landing page experience. Higher Quality Scores can lead to lower costs and better ad positions.",
    category: "Paid Advertising",
    whyItMatters: [
      "Directly affects cost per click (CPC)",
      "Influences ad position and visibility",
      "Indicates ad and landing page quality",
      "Can significantly impact campaign ROI",
      "Provides optimization guidance"
    ],
    bestPractices: [
      "Ensure tight keyword-ad-landing page relevance",
      "Improve landing page experience and speed",
      "Write compelling, relevant ad copy",
      "Use ad extensions effectively",
      "Continuously test and optimize ads"
    ],
    relatedTerms: ["ppc", "landing-page", "click-through-rate"],
    relatedGuide: learningGuides.ppcLandingPages,
    relatedFeature: featurePages.ppcLandingPages,
    externalResources: [
      { title: "About Quality Score", source: "Google Ads Help", url: "https://support.google.com/google-ads/answer/6167118" }
    ]
  },

  // ===== TRAFFIC / VISITOR INTELLIGENCE =====
  {
    term: "Traffic Source",
    slug: "traffic-source",
    shortDescription: "The origin of visitors to your website, such as organic search, paid ads, or social media.",
    fullDescription: "Traffic source refers to where your website visitors come from. Common traffic sources include organic search (from search engines), paid search (PPC ads), direct (typing URL directly), referral (links from other sites), social (social media platforms), and email (email campaigns).",
    category: "Analytics",
    whyItMatters: [
      "Reveals which channels drive the most traffic",
      "Helps allocate marketing budget effectively",
      "Identifies underperforming channels",
      "Provides insights for optimization",
      "Essential for measuring marketing ROI"
    ],
    bestPractices: [
      "Use UTM parameters to track campaign sources",
      "Segment analytics by traffic source",
      "Compare conversion rates across sources",
      "Diversify traffic sources to reduce risk",
      "Invest more in high-performing channels"
    ],
    relatedTerms: ["organic-traffic", "referral-traffic", "analytics"],
    relatedGuide: learningGuides.analytics,
    relatedFeature: featurePages.visitorIntelligence,
    externalResources: [
      { title: "Traffic Source Analysis", source: "Google Analytics Help", url: "https://support.google.com/analytics/answer/6099206" }
    ]
  },
  {
    term: "Visitor Deanonymization",
    slug: "visitor-deanonymization",
    shortDescription: "The process of identifying anonymous website visitors through reverse IP lookup and data enrichment.",
    fullDescription: "Visitor deanonymization (or reverse IP lookup) is the process of identifying anonymous website visitors by matching their IP addresses to company databases. This B2B marketing technique reveals which companies are visiting your website, even when visitors don't fill out forms, enabling more targeted outreach.",
    category: "Lead Generation",
    whyItMatters: [
      "Reveals companies researching your products",
      "Enables proactive outreach to warm leads",
      "Provides sales intelligence for target accounts",
      "Measures ABM campaign effectiveness",
      "Identifies high-intent visitors for retargeting"
    ],
    bestPractices: [
      "Focus on B2B visitor identification (not individuals)",
      "Integrate with CRM and sales tools",
      "Prioritize leads based on engagement signals",
      "Ensure GDPR and privacy compliance",
      "Combine with intent data for better targeting"
    ],
    relatedTerms: ["lead-generation", "abm", "intent-data"],
    relatedGuide: learningGuides.trafficDeanonymization,
    relatedFeature: featurePages.trafficDeAnonymization,
    externalResources: [
      { title: "Reverse IP Lookup", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Reverse_DNS_lookup" }
    ]
  },
  {
    term: "Intent Data",
    slug: "intent-data",
    shortDescription: "Behavioral signals indicating a prospect's likelihood to purchase based on their online activity.",
    fullDescription: "Intent data is information collected about a prospect's web content consumption that indicates their interest in particular products or services. It includes signals like topic research, competitor comparisons, and solution browsing that suggest buying intent, enabling more timely and relevant outreach.",
    category: "Lead Generation",
    whyItMatters: [
      "Identifies prospects actively researching solutions",
      "Enables timely, relevant outreach",
      "Prioritizes leads most likely to convert",
      "Improves sales and marketing alignment",
      "Increases conversion rates and ROI"
    ],
    bestPractices: [
      "Combine first-party and third-party intent data",
      "Create intent-based lead scoring models",
      "Trigger automated nurture campaigns based on signals",
      "Align content with detected intent topics",
      "Measure intent data accuracy and impact"
    ],
    relatedTerms: ["visitor-deanonymization", "lead-scoring", "abm"],
    relatedGuide: learningGuides.visitorIntelligence,
    relatedFeature: featurePages.visitorIntelligence,
    externalResources: [
      { title: "What is Intent Data?", source: "Gartner", url: "https://www.gartner.com/en/marketing/glossary/intent-data" }
    ]
  },

  // ===== UPTIME / HOSTING =====
  {
    term: "Uptime",
    slug: "uptime",
    shortDescription: "The percentage of time a website is accessible and functioning correctly.",
    fullDescription: "Uptime is a measure of system reliability, expressed as the percentage of time a website or server is operational and accessible. Industry standard for professional hosting is 99.9% uptime, meaning less than 8.76 hours of downtime per year. Downtime can hurt SEO, conversions, and brand reputation.",
    category: "Web Hosting",
    whyItMatters: [
      "Downtime directly costs revenue and leads",
      "Repeated outages can hurt search rankings",
      "Affects user trust and brand reputation",
      "Critical for e-commerce and lead generation",
      "SLA compliance for business clients"
    ],
    bestPractices: [
      "Choose hosts with 99.9%+ uptime guarantees",
      "Implement uptime monitoring with alerts",
      "Have a disaster recovery plan",
      "Use CDN for redundancy",
      "Monitor from multiple geographic locations"
    ],
    relatedTerms: ["website-monitoring", "cdn", "page-speed"],
    relatedGuide: learningGuides.uptimeMonitoring,
    relatedFeature: featurePages.uptimeMonitoring,
    externalResources: [
      { title: "Uptime", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Uptime" }
    ]
  },
  {
    term: "CDN (Content Delivery Network)",
    slug: "cdn",
    shortDescription: "A network of servers that delivers web content based on user's geographic location.",
    fullDescription: "A Content Delivery Network (CDN) is a geographically distributed network of servers that delivers web content to users based on their location, the origin of the content, and the content delivery server. CDNs improve website speed, reduce bandwidth costs, and provide redundancy against server failures.",
    category: "Web Hosting",
    whyItMatters: [
      "Dramatically improves page load speed",
      "Reduces server load and bandwidth costs",
      "Provides DDoS protection and security",
      "Improves global accessibility",
      "Positive impact on SEO rankings"
    ],
    bestPractices: [
      "Choose CDN with edge locations near your audience",
      "Configure proper cache headers",
      "Use CDN for images, CSS, and JavaScript",
      "Monitor CDN performance and hit rates",
      "Implement CDN at the DNS level for full coverage"
    ],
    relatedTerms: ["page-speed", "uptime", "website-performance"],
    relatedGuide: learningGuides.webHosting,
    relatedFeature: featurePages.webHosting,
    externalResources: [
      { title: "Content Delivery Network", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Content_delivery_network" },
      { title: "What is a CDN?", source: "Cloudflare", url: "https://www.cloudflare.com/learning/cdn/what-is-a-cdn/" }
    ]
  },

  // ===== Additional terms for comprehensive coverage =====
  {
    term: "Crawl Budget",
    slug: "crawl-budget",
    shortDescription: "The number of pages search engines will crawl on your site within a given timeframe.",
    fullDescription: "Crawl budget is the number of pages Googlebot will crawl and index on your website within a given timeframe. It's influenced by crawl rate limit (how fast Googlebot can crawl without overloading your server) and crawl demand (how valuable Google considers your pages). Managing crawl budget is crucial for large websites.",
    category: "Technical SEO",
    whyItMatters: [
      "Ensures important pages get crawled and indexed",
      "Critical for large websites with many pages",
      "Affects how quickly new content is discovered",
      "Can impact indexation of priority pages",
      "Prevents wasting budget on low-value pages"
    ],
    bestPractices: [
      "Improve site speed to enable faster crawling",
      "Block unimportant pages via robots.txt",
      "Fix crawl errors and broken links",
      "Use internal linking to prioritize key pages",
      "Submit updated XML sitemaps regularly"
    ],
    relatedTerms: ["indexation", "robots-txt", "xml-sitemap"],
    relatedGuide: learningGuides.technicalSEO,
    relatedFeature: featurePages.onPageSEO,
    externalResources: [
      { title: "Large Site Owner's Guide to Crawl Budget", source: "Google Search Central", url: "https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget" }
    ]
  },
  {
    term: "XML Sitemap",
    slug: "xml-sitemap",
    shortDescription: "A file that lists all important pages on your website to help search engines discover them.",
    fullDescription: "An XML sitemap is a file that lists the important pages of your website, making sure search engines can find and crawl them. It also provides metadata about each URL (when it was last updated, how often it changes, its priority). Sitemaps are especially useful for large or complex websites.",
    category: "Technical SEO",
    whyItMatters: [
      "Helps search engines discover all important pages",
      "Provides metadata about page updates",
      "Essential for large websites with many pages",
      "Speeds up indexation of new content",
      "Identifies pages you want indexed"
    ],
    bestPractices: [
      "Include only canonical, indexable URLs",
      "Update sitemap when content changes",
      "Submit sitemap to Google Search Console",
      "Keep sitemaps under 50MB/50,000 URLs",
      "Use sitemap index for multiple sitemaps"
    ],
    relatedTerms: ["crawl-budget", "indexation", "robots-txt"],
    relatedGuide: learningGuides.technicalSEO,
    relatedFeature: featurePages.onPageSEO,
    externalResources: [
      { title: "Sitemaps XML Format", source: "sitemaps.org", url: "https://www.sitemaps.org/protocol.html" },
      { title: "Build and Submit a Sitemap", source: "Google Search Central", url: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap" }
    ]
  },
  {
    term: "Robots.txt",
    slug: "robots-txt",
    shortDescription: "A file that tells search engine crawlers which pages they can or cannot access.",
    fullDescription: "Robots.txt is a text file at the root of a website that tells search engine crawlers which pages or sections of the site should not be crawled or indexed. It's part of the Robots Exclusion Protocol and is used to manage crawler access, protect server resources, and prevent indexation of private or duplicate content.",
    category: "Technical SEO",
    whyItMatters: [
      "Controls crawler access to your site",
      "Preserves crawl budget for important pages",
      "Prevents indexation of private areas",
      "Required for managing large websites",
      "Affects what appears in search results"
    ],
    bestPractices: [
      "Don't block CSS, JavaScript, or images",
      "Test changes before deploying",
      "Use Google's robots.txt Tester",
      "Combine with meta robots for full control",
      "Include sitemap location in robots.txt"
    ],
    relatedTerms: ["crawl-budget", "xml-sitemap", "indexation"],
    relatedGuide: learningGuides.technicalSEO,
    relatedFeature: featurePages.onPageSEO,
    externalResources: [
      { title: "Robots Exclusion Protocol", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Robots_exclusion_standard" },
      { title: "Introduction to robots.txt", source: "Google Search Central", url: "https://developers.google.com/search/docs/crawling-indexing/robots/intro" }
    ]
  },
  {
    term: "Canonical URL",
    slug: "canonical-url",
    shortDescription: "The preferred URL for a page when multiple URLs have similar content.",
    fullDescription: "A canonical URL is the URL that you want search engines to treat as the authoritative version of a page. When the same content is accessible via multiple URLs (due to URL parameters, www vs non-www, or HTTP vs HTTPS), the canonical tag tells search engines which version to index and rank.",
    category: "Technical SEO",
    whyItMatters: [
      "Prevents duplicate content issues",
      "Consolidates link equity to preferred URL",
      "Helps search engines understand site structure",
      "Essential for e-commerce with filtered URLs",
      "Improves crawl efficiency"
    ],
    bestPractices: [
      "Self-reference canonical on all pages",
      "Use absolute URLs in canonical tags",
      "Ensure canonical URLs are indexable",
      "Choose consistent preferred domain format",
      "Audit for conflicting canonical signals"
    ],
    relatedTerms: ["duplicate-content", "indexation", "technical-seo"],
    relatedGuide: learningGuides.technicalSEO,
    relatedFeature: featurePages.onPageSEO,
    externalResources: [
      { title: "Canonical Link Element", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Canonical_link_element" },
      { title: "Consolidate Duplicate URLs", source: "Google Search Central", url: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls" }
    ]
  }
];

// Helper function to get terms by category
export const getTermsByCategory = (category: string): GlossaryTermData[] => {
  return glossaryTerms.filter(term => term.category === category);
};

// Helper function to get terms related to a feature
export const getTermsByFeature = (featureHref: string): GlossaryTermData[] => {
  return glossaryTerms.filter(term => term.relatedFeature?.href === featureHref);
};

// Helper function to get terms related to a guide
export const getTermsByGuide = (guideHref: string): GlossaryTermData[] => {
  return glossaryTerms.filter(term => term.relatedGuide?.href === guideHref);
};

// Get all unique categories
export const getCategories = (): string[] => {
  return [...new Set(glossaryTerms.map(term => term.category))].sort();
};

// Simple term lookup for GlossaryLegend component
export const getSimpleTerms = () => {
  return glossaryTerms.map(({ term, shortDescription, slug }) => ({
    term,
    shortDescription,
    slug
  }));
};
