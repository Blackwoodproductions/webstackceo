import { memo } from "react";
import { 
  Zap, 
  Rocket, 
  Sun, 
  Target, 
  Layers, 
  Hexagon, 
  Triangle, 
  Diamond,
  Sparkles,
  Mountain
} from "lucide-react";

const companies = [
  { name: "TechFlow", icon: Zap, style: "font-bold" },
  { name: "Elevate", icon: Rocket, style: "font-light tracking-widest" },
  { name: "Brightpath", icon: Sun, style: "font-bold italic" },
  { name: "Velocity", icon: Target, style: "font-black" },
  { name: "GrowthLab", icon: Layers, style: "font-medium tracking-tight" },
  { name: "Nexus", icon: Hexagon, style: "font-bold tracking-wide" },
  { name: "Pinnacle", icon: Triangle, style: "font-semibold" },
  { name: "Forge", icon: Diamond, style: "font-black uppercase" },
  { name: "Quantum", icon: Sparkles, style: "font-light" },
  { name: "Apex", icon: Mountain, style: "font-bold uppercase tracking-widest" },
];

// Use CSS animation instead of framer-motion for better performance
const LogoCarousel = memo(() => {
  return (
    <section className="py-12 relative overflow-hidden border-y border-border/30">
      <div className="container mx-auto px-6 max-w-6xl">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Trusted by leading SEO agencies worldwide
        </p>

        {/* Infinite scroll container using CSS animation */}
        <div className="relative">
          {/* Gradient fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          {/* Scrolling logos - CSS animation for GPU acceleration */}
          <div className="flex overflow-hidden">
            <div className="flex gap-12 items-center animate-scroll-x">
              {/* Double the logos for seamless loop */}
              {[...companies, ...companies].map((company, index) => {
                const IconComponent = company.icon;
                return (
                  <div
                    key={index}
                    className="flex-shrink-0 flex items-center gap-2 px-6 py-3 opacity-40 hover:opacity-80 transition-opacity duration-300 cursor-default group"
                  >
                    <IconComponent className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
                    <span
                      className={`text-xl md:text-2xl text-foreground whitespace-nowrap ${company.style}`}
                    >
                      {company.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes scroll-x {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-scroll-x {
          animation: scroll-x 25s linear infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-scroll-x {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
});

LogoCarousel.displayName = "LogoCarousel";

export default LogoCarousel;
