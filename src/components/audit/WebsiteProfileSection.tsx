import { motion } from "framer-motion";
import { 
  Globe, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin,
  ExternalLink,
  Sparkles,
  Tag
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import GlossaryTooltip from "@/components/ui/glossary-tooltip";

interface WebsiteProfileProps {
  domain: string;
  profile: {
    title: string | null;
    description: string | null;
    favicon: string | null;
    logo: string | null;
    summary: string | null;
    socialLinks: {
      facebook: string | null;
      twitter: string | null;
      linkedin: string | null;
      instagram: string | null;
      youtube: string | null;
      tiktok: string | null;
    };
    contactInfo: {
      email: string | null;
      phone: string | null;
      address: string | null;
    };
    detectedCategory: string;
  } | null;
  matchedGlossaryTerms: Array<{ term: string; slug: string; shortDescription: string }>;
  isLoading?: boolean;
}

const categoryLabels: Record<string, string> = {
  ecommerce: 'E-commerce',
  saas: 'SaaS / Software',
  local_business: 'Local Business',
  blog_media: 'Blog / Media',
  professional_services: 'Professional Services',
  healthcare: 'Healthcare',
  finance: 'Finance',
  education: 'Education',
  real_estate: 'Real Estate',
  hospitality: 'Hospitality',
  nonprofit: 'Nonprofit',
  technology: 'Technology',
  other: 'General Business',
};

const SocialIcon = ({ platform, url }: { platform: string; url: string }) => {
  const icons: Record<string, typeof Facebook> = {
    facebook: Facebook,
    twitter: Twitter,
    linkedin: Linkedin,
    instagram: Instagram,
    youtube: Youtube,
  };
  
  const Icon = icons[platform] || Globe;
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 transition-colors group"
      title={platform.charAt(0).toUpperCase() + platform.slice(1)}
    >
      <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </a>
  );
};

export const WebsiteProfileSection = ({ domain, profile, matchedGlossaryTerms, isLoading }: WebsiteProfileProps) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="p-6 rounded-2xl bg-card border border-border/50">
          <div className="flex items-center gap-4 animate-pulse">
            <div className="w-16 h-16 rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-6 w-48 bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-3/4 bg-muted rounded" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!profile) {
    return null;
  }

  const socialLinks = Object.entries(profile.socialLinks || {}).filter(([_, url]) => url);
  const hasContact = profile.contactInfo?.email || profile.contactInfo?.phone || profile.contactInfo?.address;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <h2 className="text-xl font-bold mb-6">Website Profile</h2>
      <div className="p-6 rounded-2xl bg-card border border-border/50">
        {/* Header with Logo/Favicon */}
        <div className="flex items-start gap-4 mb-6">
          <div className="shrink-0">
            {profile.logo ? (
              <img
                src={profile.logo}
                alt={`${domain} logo`}
                className="w-16 h-16 rounded-xl object-cover bg-muted"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center ${profile.logo ? 'hidden' : ''}`}>
              {profile.favicon ? (
                <img
                  src={profile.favicon}
                  alt={`${domain} favicon`}
                  className="w-8 h-8"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <Globe className="w-8 h-8 text-primary" />
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-lg font-semibold truncate">
                {profile.title || domain}
              </h3>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                {categoryLabels[profile.detectedCategory] || 'General'}
              </Badge>
            </div>
            
            <a
              href={`https://${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 mb-3"
            >
              {domain}
              <ExternalLink className="w-3 h-3" />
            </a>
            
            {profile.summary && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {profile.summary}
              </p>
            )}
          </div>
        </div>

        {/* Social Links & Contact */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border/50">
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Social:</span>
              <div className="flex items-center gap-1">
                {socialLinks.map(([platform, url]) => (
                  <SocialIcon key={platform} platform={platform} url={url!} />
                ))}
              </div>
            </div>
          )}
          
          {hasContact && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {profile.contactInfo?.email && (
                <a
                  href={`mailto:${profile.contactInfo.email}`}
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Mail className="w-3 h-3" />
                  {profile.contactInfo.email}
                </a>
              )}
              {profile.contactInfo?.phone && (
                <a
                  href={`tel:${profile.contactInfo.phone}`}
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  {profile.contactInfo.phone}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Matched Glossary Terms */}
        {matchedGlossaryTerms.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Relevant SEO Concepts</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {matchedGlossaryTerms.slice(0, 8).map((term) => (
                <GlossaryTooltip key={term.slug} term={term.term}>
                  <Link
                    to={`/learn/glossary/${term.slug}`}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gradient-to-r from-primary/10 to-violet-500/10 text-primary hover:from-primary/20 hover:to-violet-500/20 transition-colors border border-primary/20"
                  >
                    <Tag className="w-3 h-3" />
                    {term.term}
                  </Link>
                </GlossaryTooltip>
              ))}
              {matchedGlossaryTerms.length > 8 && (
                <Link
                  to="/learn/glossary"
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground hover:text-primary transition-colors"
                >
                  +{matchedGlossaryTerms.length - 8} more
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
