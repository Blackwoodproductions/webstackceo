import { Link, useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import SEO from "@/components/SEO";
import SEOBreadcrumb from "@/components/ui/seo-breadcrumb";
import { glossaryTerms, GlossaryTermData } from "@/data/glossaryData";

// Create lookup map from slug to term data
const glossaryDataMap: Record<string, GlossaryTermData> = glossaryTerms.reduce((acc, term) => {
  acc[term.slug] = term;
  return acc;
}, {} as Record<string, GlossaryTermData>);

const GlossaryTerm = () => {
  const { slug } = useParams<{ slug: string }>();
  const termData = slug ? glossaryDataMap[slug] : null;

  if (!termData) {
    return <Navigate to="/learn/glossary" replace />;
  }

  const relatedTermsData = termData.relatedTerms
    .filter(t => glossaryDataMap[t])
    .map(t => ({ slug: t, ...glossaryDataMap[t] }));

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
          { label: "Glossary", href: "/learn/glossary", altText: "SEO terminology glossary" },
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
              <Link to="/learn/glossary" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Glossary
              </Link>
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  Glossary Term
                </span>
                <span className="px-3 py-1 rounded-full bg-secondary/50 text-muted-foreground text-sm">
                  {termData.category}
                </span>
              </div>
              
              {/* H1 with optional Feature Link */}
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {termData.relatedFeature ? (
                  <Link 
                    to={termData.relatedFeature.href}
                    className="hover:text-primary transition-colors group inline-flex items-center gap-3 flex-wrap"
                  >
                    {termData.term}
                    <span className="text-lg font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      See our {termData.relatedFeature.title} feature
                    </span>
                  </Link>
                ) : (
                  termData.term
                )}
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                {termData.shortDescription}
              </p>

              {/* Prominent Feature CTA */}
              {termData.relatedFeature && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex"
                >
                  <Link
                    to={termData.relatedFeature.href}
                    className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-400/20 to-violet-500/20 border border-primary/30 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
                  >
                    <Sparkles className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Automate this with</p>
                      <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {termData.relatedFeature.title} →
                      </p>
                    </div>
                  </Link>
                </motion.div>
              )}
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

              {/* Authoritative Resources */}
              {termData.externalResources && termData.externalResources.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="glass-card rounded-2xl p-8"
                >
                  <h2 className="text-xl font-bold text-foreground mb-4">Authoritative Resources</h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    Learn more from these trusted industry sources:
                  </p>
                  <div className="space-y-3">
                    {termData.externalResources.map((resource, i) => (
                      <a
                        key={i}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-primary/10 transition-colors border border-border/50 hover:border-primary/30"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <ExternalLink className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground font-medium group-hover:text-primary transition-colors flex items-center gap-2">
                            {resource.title}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {resource.source}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}

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

              {/* Related Guide CTA */}
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
                  <div className="flex flex-wrap gap-4 justify-center">
                    <Button variant="hero" size="lg" asChild>
                      <Link to={termData.relatedGuide.href}>
                        Read {termData.relatedGuide.title} <ArrowRight className="w-5 h-5 ml-2" />
                      </Link>
                    </Button>
                    {termData.relatedFeature && (
                      <Button variant="heroOutline" size="lg" asChild>
                        <Link to={termData.relatedFeature.href}>
                          Explore {termData.relatedFeature.title}
                        </Link>
                      </Button>
                    )}
                  </div>
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
