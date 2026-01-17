import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Handshake, Building2, Mail, User, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const partnershipSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Please enter a valid email address").max(255, "Email must be less than 255 characters"),
  company: z.string().trim().min(2, "Company name must be at least 2 characters").max(100, "Company name must be less than 100 characters"),
  partnershipType: z.string().min(1, "Please select a partnership type"),
  message: z.string().trim().min(20, "Please provide more details (at least 20 characters)").max(1000, "Message must be less than 1000 characters"),
});

type PartnershipFormData = z.infer<typeof partnershipSchema>;

const partnershipTypes = [
  { value: "reseller", label: "Reseller Partnership" },
  { value: "integration", label: "Integration Partner" },
  { value: "affiliate", label: "Affiliate Program" },
  { value: "technology", label: "Technology Partnership" },
  { value: "other", label: "Other" },
];

const PartnershipSection = () => {
  const form = useForm<PartnershipFormData>({
    resolver: zodResolver(partnershipSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      partnershipType: "",
      message: "",
    },
  });

  const onSubmit = (data: PartnershipFormData) => {
    // In production, this would send to an API
    toast.success("Partnership inquiry submitted!", {
      description: "We'll get back to you within 24-48 hours.",
    });
    form.reset();
  };

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tl from-violet-500/5 via-transparent to-cyan-400/5" />
      
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
              Partner With Us
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Let's <span className="gradient-text">Grow Together</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              We're always looking for strategic partners who share our vision of empowering business leaders. 
              Whether you're an agency, technology provider, or industry influencer, let's explore how we can create value together.
            </p>

            <div className="space-y-6">
              {[
                { icon: Building2, title: "Agency Partners", desc: "Offer Webstack.ceo to your clients with exclusive benefits" },
                { icon: Handshake, title: "Integration Partners", desc: "Connect your product with our platform" },
                { icon: MessageSquare, title: "Affiliate Program", desc: "Earn commissions by referring new customers" },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex gap-4 items-start"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card rounded-2xl p-8"
          >
            <h3 className="text-xl font-bold text-foreground mb-6">Partnership Inquiry</h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="John Smith" 
                            className="pl-10 bg-secondary/50 border-border" 
                            {...field} 
                          />
                        </div>
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
                      <FormLabel className="text-foreground">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            type="email"
                            placeholder="john@company.com" 
                            className="pl-10 bg-secondary/50 border-border" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Company Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="Your Company Inc." 
                            className="pl-10 bg-secondary/50 border-border" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="partnershipType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Partnership Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-secondary/50 border-border">
                            <SelectValue placeholder="Select partnership type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {partnershipTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Tell Us About Your Partnership Idea</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your partnership proposal and how you envision us working together..."
                          className="bg-secondary/50 border-border min-h-[120px] resize-none"
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
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Submitting..." : "Submit Partnership Inquiry"}
                </Button>
              </form>
            </Form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PartnershipSection;
