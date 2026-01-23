import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { 
  Activity, 
  Server, 
  Search, 
  Link2, 
  UserCheck,
  Eye,
  PenTool,
  MousePointerClick,
  TrendingUp,
  BarChart3,
  MapPin,
  Share2,
  HelpCircle,
  Plus
} from "lucide-react";

const includedFeatures = [
  {
    icon: Link2,
    title: "Niche Link Building",
    description: "Automated categorization of client websites enables highly relevant, niche-specific backlinks at scale. No PBNs.",
    href: "/features/off-page-seo",
  },
  {
    icon: PenTool,
    title: "Automated Blog, FAQ & Content",
    description: "AI-powered blog posts, FAQs, and web copy that positions your brand as the authority and boosts search visibility.",
    href: "/features/automated-blog",
  },
  {
    icon: Share2,
    title: "Social Signals",
    description: "Automatically share your latest blog and FAQ posts to X, LinkedIn, and Facebook to amplify reach and engagement.",
    href: "/features/social-signals",
  },
  {
    icon: UserCheck,
    title: "Traffic De-Anonymization",
    description: "Identify your anonymous website visitors. Turn unknown traffic into qualified leads with company-level insights.",
    href: "/features/traffic-de-anonymization",
  },
  {
    icon: Eye,
    title: "Visitor Intelligence",
    description: "See which companies visit your site, what pages they view, and when they're ready to buy.",
    href: "/features/visitor-intelligence",
  },
  {
    icon: TrendingUp,
    title: "Domain Rating & Authority",
    description: "Boost your DR and DA scores with proven strategies. Build lasting domain authority that drives organic growth.",
    href: "/features/domain-authority",
  },
  {
    icon: BarChart3,
    title: "Advanced Rankings & Analytics",
    description: "Deep insights into your search rankings, competitor analysis, and actionable data to outperform your competition.",
    href: "/features/advanced-analytics",
  },
  {
    icon: MapPin,
    title: "Google My Business Optimization",
    description: "Dominate local search with optimized GMB profiles. Attract nearby customers with enhanced Google Places visibility.",
    href: "/features/gmb-optimization",
  },
  {
    icon: Activity,
    title: "Site Uptime Monitoring",
    description: "24/7 monitoring with instant alerts. Know the moment your site goes down and get detailed incident reports.",
    href: "/features/uptime-monitoring",
  },
];

const addOnFeatures = [
  {
    icon: Search,
    title: "On-Page SEO",
    description: "Technical audits, meta optimization, and Core Web Vitals improvements you can resell to your agency clients.",
    href: "/features/on-page-seo",
  },
  {
    icon: MousePointerClick,
    title: "PPC Landing Pages",
    description: "High-converting landing pages optimized for paid campaigns. Maximize your ad spend with pages built to convert.",
    href: "/features/ppc-landing-pages",
  },
  {
    icon: Server,
    title: "Premium Web Hosting",
    description: "Enterprise-grade hosting with 99.99% uptime SLA, global CDN, and automatic scaling for peak traffic.",
    href: "/features/web-hosting",
  },
];

const FeaturesSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const gridY = useTransform(scrollYProgress, [0, 1], [30, -30]);

  return (
    <section ref={sectionRef} id="features" className="py-12 relative overflow-hidden">
      <motion.div style={{ y: gridY }} className="absolute inset-0 grid-pattern opacity-30" />
      
      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        {/* Included Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {includedFeatures.map((feature, index) => (
            <motion.a
              key={feature.title}
              href={feature.href}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group block relative isolate"
            >
              {/* Blue glow effect on hover - positioned behind */}
              <div className="absolute inset-0 -z-10 bg-cyan-400/0 rounded-2xl blur-xl transition-all duration-500 group-hover:bg-cyan-400/30 group-hover:scale-110 pointer-events-none" />
              
              <div className="relative z-10 h-full glass-card rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 cursor-pointer bg-background/80 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-primary transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Add-ons Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center">
              <Plus className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Available Add-ons</h3>
            <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">Extra Cost</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {addOnFeatures.map((feature, index) => (
            <motion.a
              key={feature.title}
              href={feature.href}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              className="group block relative isolate"
            >
              {/* Amber glow effect on hover for add-ons */}
              <div className="absolute inset-0 -z-10 bg-amber-400/0 rounded-2xl blur-xl transition-all duration-500 group-hover:bg-amber-400/20 group-hover:scale-110 pointer-events-none" />
              
              <div className="relative z-10 h-full glass-card rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 cursor-pointer bg-amber-500/5 dark:bg-amber-500/10 backdrop-blur-sm border border-amber-500/20">
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">ADD-ON</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-amber-500 transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-amber-500 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
