import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Twitter, Linkedin, Github, Send, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Thanks for subscribing! Check your inbox for confirmation.");
    setEmail("");
    setIsSubmitting(false);
  };

  const footerLinks = {
    Product: [
      { name: "Features", href: "/#features" },
      { name: "Pricing", href: "/#pricing" },
      { name: "Integrations", href: "#" },
      { name: "Changelog", href: "#" },
    ],
    Company: [
      { name: "About", href: "/about" },
      { name: "Blog", href: "#" },
      { name: "Careers", href: "/careers" },
      { name: "Contact", href: "/#contact" },
    ],
    Resources: [
      { name: "Documentation", href: "#" },
      { name: "Help Center", href: "#" },
      { name: "API", href: "#" },
      { name: "Status", href: "#" },
    ],
    Legal: [
      { name: "Privacy", href: "/privacy-policy" },
      { name: "Terms", href: "/terms" },
      { name: "Security", href: "/security" },
      { name: "Cookies", href: "/cookies" },
    ],
  };

  return (
    <footer className="border-t border-border py-16 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Newsletter Section */}
        <div className="glass-card rounded-2xl p-8 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-foreground mb-2">
                Stay ahead of the curve
              </h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Get weekly insights on web strategy, SEO tips, and exclusive CEO resources delivered to your inbox.
              </p>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="flex w-full md:w-auto gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full md:w-64 bg-background/50 border-border"
              />
              <Button type="submit" variant="hero" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <>
                    Subscribe <Send className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <a href="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400/20 to-violet-500/20 group-hover:from-amber-400/20 group-hover:to-yellow-500/20 flex items-center justify-center relative transition-all duration-300 group-hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] group-hover:scale-110">
                <Shield className="w-7 h-7 text-primary group-hover:text-amber-400 transition-colors duration-300" />
                <span className="absolute text-primary font-bold text-[9px] tracking-tight transition-all duration-300 group-hover:text-amber-400">AI</span>
              </div>
              <span className="text-xl font-bold text-foreground">
                webstack<span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent transition-all duration-300 group-hover:from-amber-400 group-hover:to-yellow-500 group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">.ceo</span>
              </span>
            </a>
            <p className="text-muted-foreground text-sm mb-4 max-w-xs">
              The unified dashboard for CEOs who demand excellence from their web presence.
            </p>
            <p className="text-sm text-muted-foreground">
              A product of{" "}
              <span className="text-foreground font-medium">Blackwood Productions</span>
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-foreground mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      onClick={(e) => {
                        // Handle anchor links that need to navigate to homepage first
                        if (link.href.startsWith("/#")) {
                          e.preventDefault();
                          const anchor = link.href.substring(1); // Get "#section"
                          if (location.pathname !== "/") {
                            navigate("/");
                            // Wait for navigation then scroll
                            setTimeout(() => {
                              const element = document.querySelector(anchor);
                              element?.scrollIntoView({ behavior: "smooth" });
                            }, 100);
                          } else {
                            const element = document.querySelector(anchor);
                            element?.scrollIntoView({ behavior: "smooth" });
                          }
                        }
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Webstack.ceo by Blackwood Productions. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {[
              { name: "Twitter", icon: Twitter, href: "#" },
              { name: "LinkedIn", icon: Linkedin, href: "#" },
              { name: "GitHub", icon: Github, href: "#" },
            ].map((social) => (
              <a
                key={social.name}
                href={social.href}
                className="w-10 h-10 rounded-full glass-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                aria-label={social.name}
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
