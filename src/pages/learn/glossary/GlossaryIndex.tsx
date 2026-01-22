import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, BookOpen, ArrowRight, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import SEO from "@/components/SEO";
import SEOBreadcrumb from "@/components/ui/seo-breadcrumb";

interface GlossaryItem {
  term: string;
  shortDescription: string;
  slug: string;
  category: string;
}

const glossaryTerms: GlossaryItem[] = [
  { term: "Alt Text", shortDescription: "Descriptive text for images that helps search engines and screen readers understand image content.", slug: "alt-text", category: "On-Page SEO" },
  { term: "Anchor Text", shortDescription: "The clickable, visible text in a hyperlink that provides context about the linked page.", slug: "anchor-text", category: "Link Building" },
  { term: "Backlinks", shortDescription: "Links from other websites pointing to your site, serving as 'votes of confidence' for search engines.", slug: "backlinks", category: "Off-Page SEO" },
  { term: "Bounce Rate", shortDescription: "The percentage of visitors who leave a website after viewing only one page.", slug: "bounce-rate", category: "Analytics" },
  { term: "Conversion Rate", shortDescription: "The percentage of website visitors who complete a desired action or goal.", slug: "conversion-rate", category: "Analytics" },
  { term: "Core Web Vitals", shortDescription: "Google's metrics measuring loading performance, interactivity, and visual stability of web pages.", slug: "core-web-vitals", category: "Technical SEO" },
  { term: "Domain Authority", shortDescription: "A score (1-100) predicting how likely a website is to rank in search engine results.", slug: "domain-authority", category: "Off-Page SEO" },
  { term: "Header Tags (H1-H6)", shortDescription: "HTML elements that define headings and subheadings, creating a hierarchical structure for content.", slug: "header-tags", category: "On-Page SEO" },
  { term: "Internal Linking", shortDescription: "Links that connect pages within the same website, distributing authority and guiding navigation.", slug: "internal-linking", category: "On-Page SEO" },
  { term: "Meta Description", shortDescription: "A brief summary of a page's content that appears in search engine results below the title.", slug: "meta-description", category: "On-Page SEO" },
  { term: "SERP", shortDescription: "Search Engine Results Page—the page displayed by search engines in response to a user's query.", slug: "serp", category: "SEO Fundamentals" },
  { term: "Title Tag", shortDescription: "The HTML element that defines the title of a web page shown in search results and browser tabs.", slug: "title-tag", category: "On-Page SEO" },
];

// Sort alphabetically
const sortedTerms = [...glossaryTerms].sort((a, b) => a.term.localeCompare(b.term));

// Get unique first letters for alphabet nav
const alphabet = [...new Set(sortedTerms.map(t => t.term[0].toUpperCase()))].sort();

const GlossaryIndex = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTerms = useMemo(() => {
    if (!searchQuery.trim()) return sortedTerms;
    const query = searchQuery.toLowerCase();
    return sortedTerms.filter(
      t => t.term.toLowerCase().includes(query) || 
           t.shortDescription.toLowerCase().includes(query) ||
           t.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Group filtered terms by first letter
  const groupedTerms = useMemo(() => {
    const groups: Record<string, GlossaryItem[]> = {};
    filteredTerms.forEach(term => {
      const letter = term.term[0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(term);
    });
    return groups;
  }, [filteredTerms]);

  const scrollToLetter = (letter: string) => {
    const element = document.getElementById(`letter-${letter}`);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="SEO Glossary - Complete A-Z of SEO Terms | Learning Center"
        description="Master SEO terminology with our comprehensive glossary. Learn definitions for title tags, backlinks, domain authority, Core Web Vitals, and more essential SEO terms."
        keywords="SEO glossary, SEO terms, SEO definitions, title tag, meta description, backlinks, domain authority, Core Web Vitals, anchor text"
        canonical="/learn/glossary"
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "SEO Glossary", altText: "Complete A-Z of SEO terms" }
        ]}
      />
      
      <main className="pt-4">
        {/* Hero */}
        <section className="py-16 relative overflow-hidden">
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
                  {sortedTerms.length} Terms
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                SEO <span className="gradient-text">Glossary</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Your complete A-Z reference for SEO terminology. Search or browse to find clear, actionable definitions for every SEO term you need to know.
              </p>

              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search terms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-background/50 border-border text-lg"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Alphabet Navigation */}
        <section className="sticky top-16 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 py-3">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="flex flex-wrap gap-2 justify-center">
              {alphabet.map(letter => (
                <button
                  key={letter}
                  onClick={() => scrollToLetter(letter)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    groupedTerms[letter] 
                      ? "bg-primary/10 text-primary hover:bg-primary/20" 
                      : "bg-secondary/30 text-muted-foreground opacity-50 cursor-not-allowed"
                  }`}
                  disabled={!groupedTerms[letter]}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Terms List */}
        <section className="py-12">
          <div className="container mx-auto px-6 max-w-4xl">
            {filteredTerms.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <p className="text-muted-foreground text-lg mb-4">
                  No terms found matching "{searchQuery}"
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-primary hover:underline"
                >
                  Clear search
                </button>
              </motion.div>
            ) : (
              <div className="space-y-12">
                {Object.entries(groupedTerms).sort().map(([letter, terms]) => (
                  <motion.div
                    key={letter}
                    id={`letter-${letter}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="scroll-mt-32"
                  >
                    <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
                      {letter}
                      <span className="text-sm font-normal text-muted-foreground">
                        ({terms.length} {terms.length === 1 ? "term" : "terms"})
                      </span>
                    </h2>
                    <div className="grid gap-4">
                      {terms.map((term) => (
                        <Link
                          key={term.slug}
                          to={`/learn/glossary/${term.slug}`}
                          className="group glass-card rounded-xl p-5 hover:bg-primary/5 transition-all border border-transparent hover:border-primary/20"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {term.term}
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-secondary/50 text-xs text-muted-foreground">
                                  {term.category}
                                </span>
                              </div>
                              <p className="text-muted-foreground text-sm line-clamp-2">
                                {term.shortDescription}
                              </p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-12">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-cyan-400/10 to-violet-500/10"
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Ready to Put This Knowledge Into Action?
              </h2>
              <p className="text-muted-foreground mb-6">
                Explore our in-depth guides to learn how to apply these SEO concepts to your business.
              </p>
              <Link
                to="/learn"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Browse All Guides <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default GlossaryIndex;
