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
  Share2
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "On-Page SEO",
    description: "Technical audits, meta optimization, content structure, and Core Web Vitals improvements for higher rankings.",
    href: "/features/on-page-seo",
  },
  {
    icon: Link2,
    title: "Off-Page SEO & Link Building",
    description: "Quality inbound links from real business websites. No PBNs, only genuine authority-building partnerships.",
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
    icon: MousePointerClick,
    title: "PPC Landing Pages",
    description: "High-converting landing pages optimized for paid campaigns. Maximize your ad spend with pages built to convert.",
    href: "/features/ppc-landing-pages",
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
    <section ref={sectionRef} id="features" className="py-24 relative overflow-hidden">
      <motion.div style={{ y: gridY }} className="absolute inset-0 grid-pattern opacity-30" />
      
      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Stop Paying More,{" "}
            <span className="gradient-text">Getting Less</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join over 1,000 CEOs who trust Webstack to deliver real results. 
            One platform, every tool you need, zero compromise.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.a
              key={feature.title}
              href={feature.href}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group block"
            >
              <div className="h-full glass-card rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 cursor-pointer">
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
      </div>
    </section>
  );
};

export default FeaturesSection;
