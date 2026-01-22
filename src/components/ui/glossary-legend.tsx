import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, ExternalLink } from "lucide-react";

export interface GlossaryTerm {
  term: string;
  shortDescription: string;
  slug: string;
}

interface GlossaryLegendProps {
  terms: GlossaryTerm[];
  title?: string;
}

const GlossaryLegend = ({ terms, title = "Glossary of Terms" }: GlossaryLegendProps) => {
  if (!terms.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card rounded-2xl p-6 mt-12"
    >
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-primary" />
        {title}
      </h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {terms.map((item) => (
          <Link
            key={item.slug}
            to={`/learn/glossary/${item.slug}`}
            className="group flex items-start gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-primary/10 transition-colors"
          >
            <div className="flex-1">
              <p className="text-foreground font-medium group-hover:text-primary transition-colors flex items-center gap-1">
                {item.term}
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.shortDescription}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
};

export default GlossaryLegend;
