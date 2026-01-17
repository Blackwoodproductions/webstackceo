import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, DollarSign, Briefcase, ChevronRight, Users, Heart, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import JobApplicationDialog from "@/components/JobApplicationDialog";

const benefits = [
  { icon: Heart, title: "Health & Wellness", description: "Comprehensive health, dental, and vision coverage for you and your family" },
  { icon: DollarSign, title: "Competitive Pay", description: "Top-tier salaries with equity options and annual bonuses" },
  { icon: Globe, title: "Remote First", description: "Work from anywhere in the world with flexible hours" },
  { icon: Users, title: "Team Culture", description: "Collaborative environment with regular team events and offsites" },
  { icon: Zap, title: "Growth", description: "Learning budget, conference attendance, and career development programs" },
  { icon: Clock, title: "Time Off", description: "Unlimited PTO, paid parental leave, and sabbaticals" },
];

const openPositions = [
  {
    title: "Senior Full-Stack Engineer",
    department: "Engineering",
    location: "Remote (US/EU)",
    type: "Full-time",
    salary: "$150k - $200k",
    description: "Build and scale our core platform serving thousands of CEOs worldwide.",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
    salary: "$120k - $160k",
    description: "Shape the user experience of our flagship dashboard product.",
  },
  {
    title: "DevOps Engineer",
    department: "Engineering",
    location: "Remote (US/EU)",
    type: "Full-time",
    salary: "$140k - $180k",
    description: "Manage and optimize our cloud infrastructure for maximum reliability.",
  },
  {
    title: "Customer Success Manager",
    department: "Customer Success",
    location: "New York, NY",
    type: "Full-time",
    salary: "$90k - $120k",
    description: "Help enterprise clients get maximum value from Webstack.ceo.",
  },
  {
    title: "Content Marketing Manager",
    department: "Marketing",
    location: "Remote",
    type: "Full-time",
    salary: "$80k - $110k",
    description: "Create compelling content that resonates with our CEO audience.",
  },
  {
    title: "Sales Development Representative",
    department: "Sales",
    location: "Remote (US)",
    type: "Full-time",
    salary: "$60k - $80k + Commission",
    description: "Generate and qualify leads for our enterprise sales team.",
  },
];

const Careers = () => {
  const [selectedPosition, setSelectedPosition] = useState<typeof openPositions[0] | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleApply = (position: typeof openPositions[0]) => {
    setSelectedPosition(position);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl"
            animate={{ y: [0, 30, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
            animate={{ y: [0, -30, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                Join Our Team
              </span>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Build the Future of <span className="gradient-text">Web Management</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                We're on a mission to empower every CEO with the tools they need to dominate online. 
                Join us and make an impact.
              </p>
              <Button variant="hero" size="lg" asChild>
                <a href="#positions">View Open Positions</a>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 bg-secondary/20">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                Why Join Us
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Benefits & <span className="gradient-text">Perks</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                We take care of our team so they can take care of our customers.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-6 hover:glow-accent transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions Section */}
        <section id="positions" className="py-24">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                Open Positions
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Find Your <span className="gradient-text">Role</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Explore our current openings and find where you can make your mark.
              </p>
            </motion.div>

            <div className="space-y-4">
              {openPositions.map((position, index) => (
                <motion.div
                  key={position.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-6 hover:glow-accent transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                          {position.department}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {position.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-3">{position.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {position.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" /> {position.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" /> {position.salary}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Button 
                        variant="heroOutline" 
                        className="group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                        onClick={() => handleApply(position)}
                      >
                        Apply Now <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center mt-12"
            >
              <p className="text-muted-foreground mb-4">
                Don't see a role that fits? We're always looking for talented people.
              </p>
              <Button variant="hero">
                Send General Application
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <JobApplicationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        position={selectedPosition}
      />
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Careers;
