import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Star, ExternalLink, Mail, Globe, ArrowLeft, Award, 
  CheckCircle2, Clock, Users, TrendingUp, MessageSquare,
  Phone, MapPin, Calendar, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

interface Partner {
  id: string;
  company_name: string;
  slug: string;
  logo_url: string | null;
  description: string;
  website_url: string | null;
  contact_email: string;
  category_id: string | null;
  is_sponsored: boolean;
  rating: number;
  review_count: number;
  ranking_score: number;
  created_at: string;
  marketplace_categories?: Category | null;
}

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional(),
  company: z.string().trim().max(100, "Company must be less than 100 characters").optional(),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message must be less than 2000 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const PartnerDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [relatedPartners, setRelatedPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

  useEffect(() => {
    if (slug) {
      fetchPartner();
    }
  }, [slug]);

  const fetchPartner = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("marketplace_partners")
      .select(`
        *,
        marketplace_categories (
          id, name, slug, description, icon
        )
      `)
      .eq("slug", slug)
      .maybeSingle();

    if (!error && data) {
      setPartner(data as Partner);
      // Fetch related partners from the same category
      if (data.category_id) {
        const { data: related } = await supabase
          .from("marketplace_partners")
          .select(`
            *,
            marketplace_categories (
              id, name, slug, description, icon
            )
          `)
          .eq("category_id", data.category_id)
          .neq("id", data.id)
          .order("ranking_score", { ascending: false })
          .limit(3);
        
        if (related) {
          setRelatedPartners(related as Partner[]);
        }
      }
    }
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (formErrors[name as keyof ContactFormData]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const errors: Partial<Record<keyof ContactFormData, string>> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          errors[err.path[0] as keyof ContactFormData] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    
    // Simulate sending message (in production, you'd send this to an API)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Message sent successfully! The partner will get back to you soon.");
    setFormData({ name: "", email: "", phone: "", company: "", message: "" });
    setIsSubmitting(false);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
        <span className="text-lg font-semibold ml-2">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Services based on category (mock data - could be stored in DB)
  const getServices = (categoryName: string | undefined) => {
    const serviceMap: Record<string, string[]> = {
      "SEO Services": ["Technical SEO Audits", "Keyword Research", "On-Page Optimization", "SEO Strategy", "Rank Tracking"],
      "Link Building": ["Guest Posting", "Digital PR", "Broken Link Building", "Resource Link Building", "HARO Outreach"],
      "Content Marketing": ["Blog Content", "Infographics", "Video Production", "eBooks & Whitepapers", "Content Strategy"],
      "PPC & Paid Ads": ["Google Ads Management", "Facebook Ads", "LinkedIn Ads", "Display Advertising", "Remarketing"],
      "Social Media Marketing": ["Social Strategy", "Content Creation", "Community Management", "Influencer Marketing", "Paid Social"],
      "Email Marketing": ["Email Campaigns", "Automation Flows", "Newsletter Design", "A/B Testing", "List Building"],
      "Web Design & Development": ["Website Design", "Web Development", "Landing Pages", "E-commerce", "CMS Development"],
      "Analytics & Reporting": ["GA4 Setup", "Custom Dashboards", "Attribution Modeling", "Data Analysis", "Conversion Tracking"],
      "Local SEO": ["Google Business Profile", "Local Citations", "Review Management", "Local Link Building", "NAP Consistency"],
      "Technical SEO": ["Site Speed Optimization", "Core Web Vitals", "Schema Markup", "Crawlability", "Site Architecture"],
      "Reputation Management": ["Review Monitoring", "Crisis Management", "Brand Monitoring", "Review Generation", "Sentiment Analysis"],
      "Affiliate Marketing": ["Program Setup", "Affiliate Recruitment", "Commission Management", "Performance Tracking", "Partner Relations"],
    };
    return serviceMap[categoryName || ""] || ["Strategy Consulting", "Implementation", "Reporting", "Support", "Training"];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20">
          <div className="container mx-auto px-6 max-w-6xl py-16">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-32 mb-8" />
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass-card rounded-2xl p-8">
                    <div className="flex items-start gap-6">
                      <div className="w-24 h-24 rounded-xl bg-muted" />
                      <div className="flex-1">
                        <div className="h-8 bg-muted rounded w-1/2 mb-2" />
                        <div className="h-4 bg-muted rounded w-1/3 mb-4" />
                        <div className="h-6 bg-muted rounded w-40" />
                      </div>
                    </div>
                    <div className="h-32 bg-muted rounded mt-6" />
                  </div>
                </div>
                <div className="glass-card rounded-2xl p-6 h-96 bg-muted" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20">
          <div className="container mx-auto px-6 max-w-6xl py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Globe className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Partner Not Found</h1>
            <p className="text-muted-foreground mb-6">The partner you're looking for doesn't exist or has been removed.</p>
            <Button variant="hero" asChild>
              <Link to="/marketplace">Back to Marketplace</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const services = getServices(partner.marketplace_categories?.name);

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <Navbar />
      
      <main className="pt-20">
        {/* Back Link */}
        <div className="container mx-auto px-6 max-w-6xl py-6">
          <Link 
            to="/marketplace" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>
        </div>

        {/* Partner Header */}
        <section className="pb-8">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-2xl p-8"
                >
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center shrink-0">
                      {partner.logo_url ? (
                        <img 
                          src={partner.logo_url} 
                          alt={partner.company_name} 
                          className="w-20 h-20 object-contain rounded-lg" 
                        />
                      ) : (
                        <Globe className="w-12 h-12 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold">{partner.company_name}</h1>
                        {partner.is_sponsored && (
                          <span className="bg-gradient-to-r from-cyan-400 to-violet-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            Featured Partner
                          </span>
                        )}
                      </div>
                      {partner.marketplace_categories && (
                        <span className="text-primary font-medium">
                          {partner.marketplace_categories.name}
                        </span>
                      )}
                      <div className="mt-3">
                        {renderStars(Number(partner.rating))}
                        <span className="text-muted-foreground text-sm ml-2">
                          ({partner.review_count} reviews)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-border">
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-2xl font-bold">{partner.ranking_score}</p>
                      <p className="text-xs text-muted-foreground">Performance Score</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-2xl font-bold">{partner.review_count}</p>
                      <p className="text-xs text-muted-foreground">Client Reviews</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-2xl font-bold">24hr</p>
                      <p className="text-xs text-muted-foreground">Response Time</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-2xl font-bold">Verified</p>
                      <p className="text-xs text-muted-foreground">Partner Status</p>
                    </div>
                  </div>
                </motion.div>

                {/* About Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-card rounded-2xl p-8"
                >
                  <h2 className="text-xl font-bold mb-4">About {partner.company_name}</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {partner.description}
                  </p>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    With a strong focus on delivering measurable results, {partner.company_name} has helped 
                    numerous businesses achieve their digital marketing goals. Their team of experienced 
                    professionals brings expertise in the latest industry trends and best practices.
                  </p>
                </motion.div>

                {/* Services Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card rounded-2xl p-8"
                >
                  <h2 className="text-xl font-bold mb-6">Services Offered</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {services.map((service, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        <span>{service}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Why Choose Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-card rounded-2xl p-8"
                >
                  <h2 className="text-xl font-bold mb-6">Why Choose {partner.company_name}?</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Experienced Team</h3>
                        <p className="text-sm text-muted-foreground">
                          Industry veterans with proven track records in delivering results.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Data-Driven Approach</h3>
                        <p className="text-sm text-muted-foreground">
                          Every strategy is backed by analytics and measurable KPIs.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Clock className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Fast Turnaround</h3>
                        <p className="text-sm text-muted-foreground">
                          Quick response times and efficient project delivery.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Shield className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Trusted & Verified</h3>
                        <p className="text-sm text-muted-foreground">
                          Vetted partner with verified credentials and client testimonials.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-card rounded-2xl p-6 sticky top-24"
                >
                  <h3 className="text-lg font-bold mb-4">Get in Touch</h3>
                  
                  <div className="space-y-3 mb-6">
                    {partner.website_url && (
                      <a 
                        href={partner.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <Globe className="w-5 h-5 text-primary" />
                        <span className="text-sm truncate">{partner.website_url.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
                      </a>
                    )}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                      <Mail className="w-5 h-5 text-primary" />
                      <span className="text-sm truncate">{partner.contact_email}</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="text-sm">Member since {new Date(partner.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {partner.website_url && (
                    <Button variant="hero" className="w-full mb-3" asChild>
                      <a href={partner.website_url} target="_blank" rel="noopener noreferrer">
                        Visit Website
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  )}
                </motion.div>

                {/* Contact Form */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card rounded-2xl p-6"
                >
                  <h3 className="text-lg font-bold mb-4">Send a Message</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Your Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        className={formErrors.name ? "border-destructive" : ""}
                      />
                      {formErrors.name && (
                        <p className="text-xs text-destructive mt-1">{formErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="john@example.com"
                        className={formErrors.email ? "border-destructive" : ""}
                      />
                      {formErrors.email && (
                        <p className="text-xs text-destructive mt-1">{formErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company (Optional)</Label>
                      <Input
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder="Your Company"
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Tell us about your project..."
                        rows={4}
                        className={formErrors.message ? "border-destructive" : ""}
                      />
                      {formErrors.message && (
                        <p className="text-xs text-destructive mt-1">{formErrors.message}</p>
                      )}
                    </div>
                    <Button 
                      type="submit" 
                      variant="hero" 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Partners */}
        {relatedPartners.length > 0 && (
          <section className="py-12 bg-secondary/20">
            <div className="container mx-auto px-6 max-w-6xl">
              <h2 className="text-2xl font-bold mb-8">Similar Partners</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPartners.map((related) => (
                  <Link key={related.id} to={`/marketplace/${related.slug}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="glass-card rounded-2xl p-6 hover:glow-primary transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center shrink-0">
                          {related.logo_url ? (
                            <img src={related.logo_url} alt={related.company_name} className="w-10 h-10 object-contain rounded-lg" />
                          ) : (
                            <Globe className="w-7 h-7 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold truncate">{related.company_name}</h3>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm">{Number(related.rating).toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground">({related.review_count})</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
                        {related.description}
                      </p>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default PartnerDetail;
