import { motion } from "framer-motion";
import { 
  Link2, FileText, TrendingUp, Target, BarChart3, Zap, Shield, Search,
  ArrowRight
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import SEO from "@/components/SEO";
import QuickMetricCheck from "@/components/QuickMetricCheck";

const tools = [
  {
    id: "backlinks",
    name: "Backlink Analyzer",
    description: "Discover how many sites link to your domain and analyze your link profile quality.",
    icon: Link2,
    color: "from-cyan-400 to-blue-500",
    metricType: "backlinks" as const,
  },
  {
    id: "technical_audit",
    name: "Technical SEO Audit",
    description: "Check your site's technical SEO health including mobile-friendliness, indexability, and more.",
    icon: FileText,
    color: "from-violet-400 to-purple-500",
    metricType: "technical_audit" as const,
  },
  {
    id: "traffic",
    name: "Traffic Estimator",
    description: "Get an estimate of your organic traffic volume and traffic value.",
    icon: TrendingUp,
    color: "from-green-400 to-emerald-500",
    metricType: "traffic" as const,
  },
  {
    id: "keywords",
    name: "Keyword Rankings",
    description: "Discover how many keywords your domain ranks for in search engines.",
    icon: Target,
    color: "from-amber-400 to-orange-500",
    metricType: "keywords" as const,
  },
  {
    id: "domain_rating",
    name: "Domain Authority Checker",
    description: "Check your domain rating and authority score compared to competitors.",
    icon: BarChart3,
    color: "from-pink-400 to-rose-500",
    metricType: "domain_rating" as const,
  },
  {
    id: "page_speed",
    name: "Page Speed Test",
    description: "Test your Core Web Vitals including LCP, FID, and CLS scores.",
    icon: Zap,
    color: "from-yellow-400 to-amber-500",
    metricType: "page_speed" as const,
  },
  {
    id: "schema",
    name: "Schema Markup Checker",
    description: "Verify your structured data implementation and find missing schema types.",
    icon: Search,
    color: "from-indigo-400 to-violet-500",
    metricType: "schema" as const,
  },
  {
    id: "security",
    name: "Security Scanner",
    description: "Check SSL certificate validity and security headers configuration.",
    icon: Shield,
    color: "from-emerald-400 to-teal-500",
    metricType: "security" as const,
  },
];

const Tools = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Free SEO Tools | Webstack.ceo"
        description="Use our free SEO tools to analyze backlinks, check domain authority, test page speed, audit technical SEO, and more. Get instant results for your website."
        keywords="free SEO tools, backlink checker, domain authority checker, page speed test, technical SEO audit, keyword rankings"
        canonical="/tools"
      />
      <ScrollProgress />
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5" />
          <motion.div
            className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-6">
                Free SEO Tools
              </span>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Instant <span className="gradient-text">SEO Insights</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Run quick checks on any domain to analyze backlinks, traffic, rankings, and more. 
                Get actionable insights in seconds.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="py-16">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-8">
              {tools.map((tool, index) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-6 hover:glow-accent transition-all duration-300"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0`}>
                      <tool.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">{tool.name}</h3>
                      <p className="text-muted-foreground text-sm">{tool.description}</p>
                    </div>
                  </div>
                  <QuickMetricCheck metricType={tool.metricType} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-secondary/20">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Want a <span className="gradient-text">Complete Analysis?</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Get a comprehensive SEO audit with detailed recommendations and a free do-follow backlink.
              </p>
              <a
                href="/audits"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-violet-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Run Full Website Audit
                <ArrowRight className="w-5 h-5" />
              </a>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Tools;
