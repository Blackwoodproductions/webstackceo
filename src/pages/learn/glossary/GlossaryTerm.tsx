import { Link, useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import SEO from "@/components/SEO";
import SEOBreadcrumb from "@/components/ui/seo-breadcrumb";

interface TermData {
  term: string;
  shortDescription: string;
  fullDescription: string;
  whyItMatters: string[];
  bestPractices: string[];
  relatedTerms: string[];
  relatedGuide?: { title: string; href: string };
}

const glossaryData: Record<string, TermData> = {
  "title-tag": {
    term: "Title Tag",
    shortDescription: "The HTML element that defines the title of a web page shown in search results and browser tabs.",
    fullDescription: "A title tag is an HTML element (<title>) that specifies the title of a web page. It appears in three key places: browser tabs, search engine results pages (SERPs) as the clickable headline, and social media shares. Title tags are one of the most important on-page SEO elements because they directly impact both rankings and click-through rates.",
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
    relatedGuide: { title: "On-Page SEO Guide", href: "/learn/on-page-seo-guide" }
  },
  "meta-description": {
    term: "Meta Description",
    shortDescription: "A brief summary of a page's content that appears in search engine results below the title.",
    fullDescription: "A meta description is an HTML attribute that provides a concise summary of a web page's content. While it doesn't directly impact search rankings, it significantly influences click-through rates by serving as your 'ad copy' in search results. Google may use your meta description or generate its own based on the search query.",
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
    relatedTerms: ["title-tag", "serp", "ctr"],
    relatedGuide: { title: "On-Page SEO Guide", href: "/learn/on-page-seo-guide" }
  },
  "header-tags": {
    term: "Header Tags (H1-H6)",
    shortDescription: "HTML elements that define headings and subheadings, creating a hierarchical structure for content.",
    fullDescription: "Header tags (H1 through H6) are HTML elements used to define headings and subheadings in your content. They create a hierarchical structure that helps both users and search engines understand the organization and importance of different sections. H1 is the most important (main title), while H6 is the least important.",
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
    relatedGuide: { title: "On-Page SEO Guide", href: "/learn/on-page-seo-guide" }
  },
  "alt-text": {
    term: "Alt Text (Alternative Text)",
    shortDescription: "Descriptive text for images that helps search engines and screen readers understand image content.",
    fullDescription: "Alt text (alternative text) is an HTML attribute added to image tags that describes the content and function of an image. It serves three purposes: providing context for search engines, displaying when images fail to load, and enabling screen readers to describe images to visually impaired users. Well-written alt text improves both SEO and accessibility.",
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
    relatedGuide: { title: "On-Page SEO Guide", href: "/learn/on-page-seo-guide" }
  },
  "core-web-vitals": {
    term: "Core Web Vitals",
    shortDescription: "Google's metrics measuring loading performance, interactivity, and visual stability of web pages.",
    fullDescription: "Core Web Vitals are a set of specific metrics that Google considers essential for user experience. They measure three aspects of page performance: Largest Contentful Paint (LCP) for loading speed, Interaction to Next Paint (INP) for interactivity, and Cumulative Layout Shift (CLS) for visual stability. These are confirmed Google ranking factors.",
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
    relatedGuide: { title: "On-Page SEO Guide", href: "/learn/on-page-seo-guide" }
  },
  "backlinks": {
    term: "Backlinks",
    shortDescription: "Links from other websites pointing to your site, serving as 'votes of confidence' for search engines.",
    fullDescription: "Backlinks (also called inbound links or incoming links) are links from external websites that point to pages on your website. They're one of Google's most important ranking factors because they act as endorsements—when a reputable site links to you, it signals that your content is valuable and trustworthy.",
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
    relatedGuide: { title: "Off-Page SEO Guide", href: "/learn/off-page-seo-guide" }
  },
  "domain-authority": {
    term: "Domain Authority (DA)",
    shortDescription: "A score (1-100) predicting how likely a website is to rank in search engine results.",
    fullDescription: "Domain Authority (DA) is a search engine ranking score developed by Moz that predicts how likely a website is to rank in search results. Scores range from 1 to 100, with higher scores indicating greater ranking potential. While not a Google metric, DA correlates strongly with actual ranking ability and is widely used in the SEO industry.",
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
    relatedGuide: { title: "Domain Authority Guide", href: "/learn/domain-authority-guide" }
  },
  "anchor-text": {
    term: "Anchor Text",
    shortDescription: "The clickable, visible text in a hyperlink that provides context about the linked page.",
    fullDescription: "Anchor text is the visible, clickable text in a hyperlink. It provides context to both users and search engines about the content of the destination page. The words used in anchor text can influence search rankings for the linked page, making it an important factor in both internal linking and backlink strategies.",
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
    relatedGuide: { title: "Off-Page SEO Guide", href: "/learn/off-page-seo-guide" }
  },
  "bounce-rate": {
    term: "Bounce Rate",
    shortDescription: "The percentage of visitors who leave a website after viewing only one page.",
    fullDescription: "Bounce rate is a web analytics metric that measures the percentage of visitors who enter a site and then leave ('bounce') rather than continuing to view other pages. A high bounce rate might indicate that the page content doesn't match user expectations, the page loads too slowly, or there's no clear path to continue exploring.",
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
    relatedTerms: ["session-duration", "conversion-rate", "user-experience"],
    relatedGuide: { title: "Analytics Guide", href: "/learn/analytics-guide" }
  },
  "conversion-rate": {
    term: "Conversion Rate",
    shortDescription: "The percentage of website visitors who complete a desired action or goal.",
    fullDescription: "Conversion rate is the percentage of visitors who complete a desired action on your website, such as making a purchase, filling out a form, or signing up for a newsletter. It's calculated by dividing the number of conversions by the total number of visitors and multiplying by 100. This is one of the most important metrics for measuring website effectiveness.",
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
    relatedGuide: { title: "Analytics Guide", href: "/learn/analytics-guide" }
  },
  "serp": {
    term: "SERP (Search Engine Results Page)",
    shortDescription: "The page displayed by search engines in response to a user's query.",
    fullDescription: "SERP stands for Search Engine Results Page—the page you see after entering a search query in Google, Bing, or other search engines. Modern SERPs include various elements beyond traditional organic listings: featured snippets, People Also Ask boxes, local packs, knowledge panels, images, videos, and paid advertisements.",
    whyItMatters: [
      "Understanding SERPs helps optimize for visibility",
      "Different SERP features require different optimization strategies",
      "SERP layout affects click-through rates for different positions",
      "Featured snippets can capture significant traffic",
      "SERP analysis reveals user intent for keywords"
    ],
    bestPractices: [
      "Analyze SERPs for target keywords before creating content",
      "Optimize for featured snippets with clear, structured answers",
      "Use schema markup to enhance search listings",
      "Target appropriate SERP features (local pack, images, videos)",
      "Monitor SERP changes and algorithm updates",
      "Optimize title tags and meta descriptions for CTR"
    ],
    relatedTerms: ["title-tag", "meta-description", "featured-snippet"],
    relatedGuide: { title: "On-Page SEO Guide", href: "/learn/on-page-seo-guide" }
  },
  "internal-linking": {
    term: "Internal Linking",
    shortDescription: "Links that connect pages within the same website, distributing authority and guiding navigation.",
    fullDescription: "Internal linking refers to hyperlinks that point from one page on a website to another page on the same website. A strong internal linking structure helps search engines discover and understand your content hierarchy, distributes page authority (link equity) throughout your site, and improves user navigation and engagement.",
    whyItMatters: [
      "Helps search engines crawl and index your entire site",
      "Distributes page authority to important pages",
      "Improves user navigation and time on site",
      "Establishes content hierarchy and topic relationships",
      "Reduces bounce rate by providing next steps"
    ],
    bestPractices: [
      "Link from high-authority pages to important target pages",
      "Use descriptive anchor text that includes relevant keywords",
      "Create content hubs linking related articles together",
      "Ensure every page is reachable within 3 clicks from the homepage",
      "Regularly audit for broken internal links",
      "Add contextual links within content, not just navigation"
    ],
    relatedTerms: ["anchor-text", "backlinks", "site-architecture"],
    relatedGuide: { title: "On-Page SEO Guide", href: "/learn/on-page-seo-guide" }
  }
};

const GlossaryTerm = () => {
  const { slug } = useParams<{ slug: string }>();
  const termData = slug ? glossaryData[slug] : null;

  if (!termData) {
    return <Navigate to="/learn" replace />;
  }

  const relatedTermsData = termData.relatedTerms
    .filter(t => glossaryData[t])
    .map(t => ({ slug: t, ...glossaryData[t] }));

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${termData.term} - SEO Glossary | Learning Center`}
        description={termData.shortDescription}
        keywords={`${termData.term}, SEO glossary, SEO terms, ${termData.relatedTerms.join(", ")}`}
        canonical={`/learn/glossary/${slug}`}
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "Glossary", href: "/learn", altText: "SEO terminology glossary" },
          { label: termData.term, altText: `Definition of ${termData.term}` }
        ]}
      />
      
      <main className="pt-4">
        {/* Hero */}
        <section className="py-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Link to="/learn" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Learning Center
              </Link>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  Glossary Term
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {termData.term}
              </h1>
              <p className="text-xl text-muted-foreground">
                {termData.shortDescription}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="space-y-8">
              
              {/* Full Definition */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8"
              >
                <h2 className="text-xl font-bold text-foreground mb-4">Definition</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {termData.fullDescription}
                </p>
              </motion.div>

              {/* Why It Matters */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8"
              >
                <h2 className="text-xl font-bold text-foreground mb-4">Why It Matters</h2>
                <ul className="space-y-3">
                  {termData.whyItMatters.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Best Practices */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8"
              >
                <h2 className="text-xl font-bold text-foreground mb-4">Best Practices</h2>
                <ul className="space-y-3">
                  {termData.bestPractices.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Related Terms */}
              {relatedTermsData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="glass-card rounded-2xl p-8"
                >
                  <h2 className="text-xl font-bold text-foreground mb-4">Related Terms</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {relatedTermsData.map((related) => (
                      <Link
                        key={related.slug}
                        to={`/learn/glossary/${related.slug}`}
                        className="group flex items-start gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-primary/10 transition-colors"
                      >
                        <div>
                          <p className="text-foreground font-medium group-hover:text-primary transition-colors">
                            {related.term}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {related.shortDescription}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* CTA */}
              {termData.relatedGuide && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-cyan-400/10 to-violet-500/10"
                >
                  <h2 className="text-xl font-bold text-foreground mb-3">
                    Learn More in Our Complete Guide
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    See how {termData.term.toLowerCase()} fits into the bigger picture with practical examples and strategies.
                  </p>
                  <Button variant="hero" size="lg" asChild>
                    <Link to={termData.relatedGuide.href}>
                      Read {termData.relatedGuide.title} <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                </motion.div>
              )}

            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default GlossaryTerm;
