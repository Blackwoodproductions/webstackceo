import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Zap, Shield, FileCode, Gauge, ArrowRight, Sparkles } from "lucide-react";

const DomainAuditSection = () => {
  const [domain, setDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    // Clean the domain input
    let cleanDomain = domain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^(https?:\/\/)?(www\.)?/, "");
    cleanDomain = cleanDomain.split("/")[0];

    setIsLoading(true);
    
    // Navigate to results page with domain as URL param
    setTimeout(() => {
      navigate(`/audit/${encodeURIComponent(cleanDomain)}`);
    }, 500);
  };

  const auditFeatures = [
    {
      icon: Gauge,
      title: "Page Speed",
      description: "Core Web Vitals & load times",
    },
    {
      icon: FileCode,
      title: "Schema Markup",
      description: "JSON-LD & structured data",
    },
    {
      icon: Search,
      title: "Meta Analysis",
      description: "Title, description & OG tags",
    },
    {
      icon: Shield,
      title: "SSL & Security",
      description: "HTTPS & security headers",
    },
  ];

  return (
    <section id="audit" className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Free SEO Analysis</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Get Your Free{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-violet-500 to-amber-400 bg-clip-text text-transparent">
              Domain Audit
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enter your domain below to receive an instant SEO health check. 
            We'll analyze your site's speed, schema markup, meta tags, and security.
          </p>
        </motion.div>

        {/* Domain input form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto mb-16"
        >
          <div className="relative flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter your domain (e.g., example.com)"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="pl-12 h-14 text-lg bg-background/80 backdrop-blur border-border/50 focus:border-primary/50"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={isLoading || !domain.trim()}
              className="h-14 px-8 bg-gradient-to-r from-cyan-500 via-violet-500 to-amber-500 hover:from-cyan-600 hover:via-violet-600 hover:to-amber-600 text-white font-semibold group"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Analyze Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </div>
        </motion.form>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {auditFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              className="group p-6 rounded-2xl bg-card/50 backdrop-blur border border-border/50 hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Results delivered instantly • No email required • 100% Free</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DomainAuditSection;
