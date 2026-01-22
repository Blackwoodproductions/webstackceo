import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface Article {
  title: string;
  href: string;
  category?: string;
}

interface ArticleNavigationProps {
  previous?: Article;
  next?: Article;
}

const ArticleNavigation = ({ previous, next }: ArticleNavigationProps) => {
  if (!previous && !next) return null;

  return (
    <motion.nav
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-col sm:flex-row gap-4 mt-12 pt-8 border-t border-border/50"
      aria-label="Article navigation"
    >
      {previous ? (
        <Link
          to={previous.href}
          className="flex-1 group glass-card rounded-xl p-4 hover:bg-primary/5 transition-colors"
        >
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Previous Article</span>
          </div>
          {previous.category && (
            <span className="text-xs text-primary/70">{previous.category}</span>
          )}
          <p className="text-foreground font-medium group-hover:text-primary transition-colors">
            {previous.title}
          </p>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {next ? (
        <Link
          to={next.href}
          className="flex-1 group glass-card rounded-xl p-4 hover:bg-primary/5 transition-colors text-right"
        >
          <div className="flex items-center justify-end gap-2 text-muted-foreground text-sm mb-2">
            <span>Next Article</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
          {next.category && (
            <span className="text-xs text-primary/70">{next.category}</span>
          )}
          <p className="text-foreground font-medium group-hover:text-primary transition-colors">
            {next.title}
          </p>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </motion.nav>
  );
};

export default ArticleNavigation;
