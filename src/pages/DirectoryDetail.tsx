import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  MapPin, Phone, Globe, Mail, ArrowLeft, Building2, Clock,
  Send, CheckCircle, Star,
  UtensilsCrossed, ShoppingBag, Heart, Briefcase, Home, Car,
  Sparkles, Landmark, Scale, GraduationCap, Music, Building, 
  Laptop, Plane, Dumbbell
} from "lucide-react";

const iconMap: Record<string, any> = {
  UtensilsCrossed, ShoppingBag, Heart, Briefcase, Home, Car,
  Sparkles, Landmark, Scale, GraduationCap, Music, Building, 
  Laptop, Plane, Dumbbell
};

const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Valid email is required").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional().or(z.literal("")),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(1000, "Message must be less than 1000 characters"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const DirectoryDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ["directory-listing", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directory_listings")
        .select(`
          *,
          directory_categories (name, icon, description)
        `)
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    
    // In a real implementation, this would send an email via edge function
    // For now, we'll simulate success
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitted(true);
    toast.success("Your message has been sent!");
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20">
          <div className="container mx-auto px-6 py-16 max-w-6xl">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-64 bg-muted rounded-2xl" />
              <div className="h-32 bg-muted rounded-xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20">
          <div className="container mx-auto px-6 py-16 max-w-6xl text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Business Not Found</h1>
            <p className="text-muted-foreground mb-8">
              This business listing doesn't exist or is no longer active.
            </p>
            <Button variant="hero" onClick={() => navigate("/directory")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Directory
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const CategoryIcon = listing.directory_categories?.icon 
    ? iconMap[listing.directory_categories.icon] 
    : Building2;

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <Button 
              variant="ghost" 
              className="mb-6"
              onClick={() => navigate("/directory")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Directory
            </Button>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="glass-card rounded-3xl p-8 md:p-12"
            >
              <div className="flex flex-col md:flex-row gap-8">
                {/* Logo/Icon */}
                <div className="flex-shrink-0">
                  {listing.logo_url ? (
                    <img 
                      src={listing.logo_url} 
                      alt={listing.business_name}
                      className="w-32 h-32 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center">
                      <CategoryIcon className="w-16 h-16 text-primary" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    {listing.is_featured && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-400/20 text-amber-400 text-sm font-medium">
                        <Star className="w-4 h-4 mr-1 fill-current" />
                        Featured
                      </span>
                    )}
                    <span className="inline-flex items-center px-3 py-1 rounded-full glass-card text-sm font-medium text-primary">
                      {listing.directory_categories?.name}
                    </span>
                  </div>

                  <h1 className="text-3xl md:text-4xl font-bold mb-4">
                    {listing.business_name}
                  </h1>

                  <p className="text-lg text-muted-foreground mb-6">
                    {listing.description}
                  </p>

                  <div className="flex flex-wrap gap-4">
                    {listing.website_url && (
                      <Button variant="hero" asChild>
                        <a href={listing.website_url} target="_blank" rel="noopener noreferrer">
                          <Globe className="w-4 h-4 mr-2" />
                          Visit Website
                        </a>
                      </Button>
                    )}
                    {listing.phone && (
                      <Button variant="heroOutline" asChild>
                        <a href={`tel:${listing.phone}`}>
                          <Phone className="w-4 h-4 mr-2" />
                          Call Now
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Details Grid */}
        <section className="py-12">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl p-6 lg:col-span-1"
              >
                <h2 className="text-xl font-bold mb-6">Contact Information</h2>
                
                <div className="space-y-4">
                  {(listing.address || listing.city || listing.state) && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Address</p>
                        {listing.address && <p className="text-sm text-muted-foreground">{listing.address}</p>}
                        <p className="text-sm text-muted-foreground">
                          {[listing.city, listing.state, listing.zip_code].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    </div>
                  )}

                  {listing.phone && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Phone</p>
                        <a 
                          href={`tel:${listing.phone}`}
                          className="text-sm text-primary hover:text-hover-accent transition-colors"
                        >
                          {listing.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {listing.email && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Email</p>
                        <a 
                          href={`mailto:${listing.email}`}
                          className="text-sm text-primary hover:text-hover-accent transition-colors break-all"
                        >
                          {listing.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {listing.website_url && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <Globe className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Website</p>
                        <a 
                          href={listing.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:text-hover-accent transition-colors break-all"
                        >
                          {listing.website_url.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {listing.directory_categories?.description && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <CategoryIcon className="w-5 h-5 text-primary" />
                      <h3 className="font-medium">{listing.directory_categories.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {listing.directory_categories.description}
                    </p>
                  </div>
                )}

                {/* Google Maps Embed */}
                {listing.google_maps_embed_url && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-5 h-5 text-primary" />
                      <h3 className="font-medium">Location</h3>
                    </div>
                    <div className="rounded-xl overflow-hidden aspect-video">
                      <iframe
                        src={listing.google_maps_embed_url}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={`${listing.business_name} location map`}
                      />
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2"
              >
                <div className="glass-card rounded-2xl p-6 md:p-8 relative overflow-hidden">
                  {/* Fire glow effect */}
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-gradient-to-tr from-amber-500/20 via-orange-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -top-20 -left-20 w-48 h-48 bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-2">Contact This Business</h2>
                    <p className="text-muted-foreground mb-6">
                      Send a message directly to {listing.business_name}
                    </p>

                    {isSubmitted ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                      >
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                        <p className="text-muted-foreground mb-6">
                          Your message has been sent to {listing.business_name}. They'll get back to you soon.
                        </p>
                        <Button 
                          variant="heroOutline" 
                          onClick={() => {
                            setIsSubmitted(false);
                            form.reset();
                          }}
                        >
                          Send Another Message
                        </Button>
                      </motion.div>
                    ) : (
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                          <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Your Name *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Your Email *</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder="john@example.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Your Phone (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="(555) 123-4567" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Message *</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder={`Hi, I'm interested in learning more about ${listing.business_name}...`}
                                    className="min-h-[150px]"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button 
                            type="submit" 
                            variant="hero"
                            size="lg"
                            disabled={isSubmitting}
                            className="w-full transition-all duration-300 hover:from-amber-400 hover:to-yellow-500 hover:shadow-[0_0_25px_rgba(251,191,36,0.5)]"
                          >
                            {isSubmitting ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Send Message
                              </>
                            )}
                          </Button>
                        </form>
                      </Form>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default DirectoryDetail;
