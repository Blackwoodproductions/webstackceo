import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  ChevronRight, FileText, Search, Code, Gauge, ImageIcon, Link2, Type 
} from 'lucide-react';

const allFeatures = [
  { icon: ImageIcon, label: 'Image Alt Tags', desc: 'SEO-optimized alt text automatically generated for all images across your site' },
  { icon: Link2, label: 'Internal Linking', desc: 'Smart anchor text optimization and strategic internal link suggestions' },
  { icon: Type, label: 'Header Hierarchy', desc: 'Proper H1-H6 structure enforced across all pages for optimal crawlability' },
  { icon: FileText, label: 'Meta Titles', desc: 'AI-generated, keyword-rich title tags optimized for click-through rates' },
  { icon: Search, label: 'Meta Descriptions', desc: 'Compelling meta descriptions under 160 characters with strong CTAs' },
  { icon: Code, label: 'Schema Markup', desc: 'Auto-generated structured data for rich snippets in search results' },
  { icon: Gauge, label: 'Readability Scoring', desc: 'Real-time content scoring with automatic optimization suggestions' },
];

export const OnPageSEOCarousel = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = 280 + 16; // card width + gap
      container.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  };

  // Auto-scroll effect
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const interval = setInterval(() => {
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (container.scrollLeft >= maxScroll - 10) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: 296, behavior: 'smooth' });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <div className="flex items-center justify-end mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={scrollRight}
          className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {allFeatures.map((feature, i) => (
          <motion.div
            key={feature.label}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="flex-shrink-0 w-[280px] p-5 rounded-xl bg-gradient-to-br from-amber-500/5 to-orange-500/10 border border-amber-500/20 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <feature.icon className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="font-medium text-sm mb-1">{feature.label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
      {/* Gradient fade on right edge */}
      <div className="absolute right-0 top-[52px] bottom-2 w-16 bg-gradient-to-l from-card to-transparent pointer-events-none" />
    </div>
  );
};

export default OnPageSEOCarousel;
