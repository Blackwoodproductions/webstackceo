import { motion } from "framer-motion";
import { Twitter, Linkedin, Github } from "lucide-react";
const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: ["Features", "Pricing", "Integrations", "Changelog"],
    Company: ["About", "Blog", "Careers", "Contact"],
    Resources: ["Documentation", "Help Center", "API", "Status"],
    Legal: ["Privacy", "Terms", "Security", "Cookies"],
  };

  return (
    <footer className="border-t border-border py-16 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <a href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
                <span className="text-white font-bold text-xl">W</span>
              </div>
              <span className="text-xl font-bold text-foreground">
                webstack<span className="gradient-text">.ceo</span>
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
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link}
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
