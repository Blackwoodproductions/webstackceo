import { useState, useEffect, memo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Linkedin, Github, Send, Shield, FileDown, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { VisaIcon, MastercardIcon, AmexIcon, DiscoverIcon, StripeLogo } from "@/components/ui/stripe-payment-icons";
import { generateServicesPDF } from "@/lib/generateServicesPDF";

const Footer = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isLogoGold, setIsLogoGold] = useState(false);

  // Listen for logo gold state changes from Navbar
  useEffect(() => {
    const handleLogoGoldChange = (e: CustomEvent<{ isGold: boolean }>) => {
      setIsLogoGold(e.detail.isGold);
    };
    window.addEventListener('logoGoldChange', handleLogoGoldChange as EventListener);
    return () => window.removeEventListener('logoGoldChange', handleLogoGoldChange as EventListener);
  }, []);

  const handleNewsletterSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Thanks for subscribing! Check your inbox for confirmation.");
    setEmail("");
    setIsSubmitting(false);
  }, [email]);

  const footerLinks = {
    Product: [
      { name: "Features", href: "/features" },
      { name: "Pricing", href: "/pricing" },
      { name: "Tools", href: "/tools" },
      { name: "Website Audits", href: "/audits" },
    ],
    "Case Studies": [
      { name: "All Case Studies", href: "/case-studies" },
      { name: "E-Commerce", href: "/case-studies?category=ecommerce" },
      { name: "SaaS", href: "/case-studies?category=saas" },
      { name: "Local Business", href: "/case-studies?category=local_business" },
    ],
    Company: [
      { name: "About", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Contact", href: "/contact" },
    ],
    Resources: [
      { name: "Learning Center", href: "/learn" },
      { name: "SEO Glossary", href: "/learn/glossary" },
      { name: "FAQ", href: "/faq" },
    ],
    Legal: [
      { name: "Privacy", href: "/privacy-policy" },
      { name: "Terms", href: "/terms" },
      { name: "Cookies", href: "/cookies" },
    ],
  };

  const handleLinkClick = useCallback(async (e: React.MouseEvent<HTMLAnchorElement>, href: string, isDownload?: boolean) => {
    if (isDownload) {
      e.preventDefault();
      toast.success("Generating brochure...");
      await generateServicesPDF();
      return;
    }
    if (href.startsWith("/#")) {
      e.preventDefault();
      const anchor = href.substring(1);
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          const element = document.querySelector(anchor);
          element?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        const element = document.querySelector(anchor);
        element?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location.pathname, navigate]);

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
                className="w-full md:w-64 bg-background/50 border-border transition-all duration-300 hover:border-hover-accent/50 focus:border-hover-accent focus:shadow-[var(--hover-accent-glow)]"
              />
              <Button 
                type="submit" 
                variant="hero" 
                disabled={isSubmitting}
                className="transition-all duration-300 hover:shadow-[var(--hover-accent-glow)]"
              >
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
            <a 
              href="/" 
              className="flex items-center gap-2 mb-4"
              onMouseEnter={() => setIsLogoHovered(true)}
              onMouseLeave={() => setIsLogoHovered(false)}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center relative transition-all duration-700 ${
                isLogoHovered || isLogoGold
                  ? "bg-gradient-to-br from-amber-400/20 to-yellow-500/20 shadow-[0_0_25px_rgba(251,191,36,0.5)] scale-110" 
                  : "bg-gradient-to-br from-cyan-400/20 to-violet-500/20"
              }`}>
                <Shield className={`w-7 h-7 transition-colors duration-700 ${
                  isLogoHovered || isLogoGold ? "text-amber-400" : "text-primary"
                }`} />
                <span className={`absolute font-bold text-[9px] tracking-tight transition-all duration-700 ${
                  isLogoHovered || isLogoGold ? "text-amber-400" : "text-primary"
                }`}>AI</span>
              </div>
              <span className="text-xl font-bold text-foreground">
                webstack<span className={`bg-clip-text text-transparent transition-all duration-700 ${
                  isLogoHovered || isLogoGold
                    ? "bg-gradient-to-r from-amber-400 to-yellow-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" 
                    : "bg-gradient-to-r from-cyan-400 to-violet-500"
                }`}>.ceo</span>
              </span>
            </a>
            <p className="text-muted-foreground text-sm mb-4 max-w-xs">
              The unified dashboard for CEOs who demand excellence from their web presence.
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              A product of{" "}
              <span className="text-foreground font-medium">Blackwood Productions</span>
            </p>
            <button
              onClick={async () => {
                toast.success("Generating brochure...");
                await generateServicesPDF();
              }}
              className="group flex items-center gap-1.5 text-sm text-muted-foreground hover:text-hover-accent transition-all duration-300 hover:drop-shadow-[var(--hover-accent-glow)]"
            >
              <FileDown className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5 group-hover:animate-bounce" />
              <span className="relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-hover-accent after:origin-bottom-right after:transition-transform after:duration-300 group-hover:after:scale-x-100 group-hover:after:origin-bottom-left">
                Download Brochure
              </span>
            </button>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-foreground mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      onClick={(e) => handleLinkClick(e, link.href, (link as any).isDownload)}
                      className={`text-sm text-muted-foreground hover:text-hover-accent transition-all duration-300 hover:drop-shadow-[var(--hover-accent-glow)] ${
                        (link as any).isDownload ? 'flex items-center gap-1' : ''
                      }`}
                    >
                      {(link as any).isDownload && <FileDown className="w-3 h-3" />}
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Webstack.ceo by Blackwood Productions. All rights reserved.
            </p>
            <a 
              href="/visitor-intelligence-dashboard" 
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Admin
            </a>
          </div>
          
          {/* Payment Methods */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">Payments by</span>
            <div className="flex items-center gap-1.5">
              <VisaIcon />
              <MastercardIcon />
              <AmexIcon />
              <DiscoverIcon />
            </div>
            <StripeLogo className="h-4 text-muted-foreground" />
          </div>
          
          <div className="flex items-center gap-4">
            {[
              { name: "X", icon: () => (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              ), href: "#" },
              { name: "LinkedIn", icon: Linkedin, href: "https://www.linkedin.com/in/seolocalitcom/" },
              { name: "Facebook", icon: Facebook, href: "#" },
              { name: "GitHub", icon: Github, href: "#" },
            ].map((social) => {
              const IconComponent = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.href}
                  target={social.href !== "#" ? "_blank" : undefined}
                  rel={social.href !== "#" ? "noopener noreferrer" : undefined}
                  className="w-10 h-10 rounded-full glass-card border border-border flex items-center justify-center text-muted-foreground hover:text-hover-accent hover:border-hover-accent/50 hover:shadow-[var(--hover-accent-glow)] transition-all duration-300"
                  aria-label={social.name}
                >
                  <IconComponent className="w-5 h-5" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;