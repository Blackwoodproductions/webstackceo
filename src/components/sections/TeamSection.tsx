import { motion } from "framer-motion";
import { Linkedin, Twitter, Mail } from "lucide-react";

const teamMembers = [
  {
    name: "Marcus Blackwood",
    role: "Founder & CEO",
    bio: "22+ years in web technology. Visionary leader who built Blackwood Productions from the ground up.",
    initials: "MB",
    gradient: "from-cyan-400 to-violet-500",
  },
  {
    name: "Sarah Chen",
    role: "Chief Technology Officer",
    bio: "Former Google engineer with expertise in scalable architecture and AI-driven solutions.",
    initials: "SC",
    gradient: "from-violet-500 to-pink-500",
  },
  {
    name: "James Rodriguez",
    role: "Head of Product",
    bio: "Product strategist who has launched 50+ successful SaaS products for Fortune 500 companies.",
    initials: "JR",
    gradient: "from-cyan-400 to-emerald-400",
  },
  {
    name: "Emily Watson",
    role: "Head of Customer Success",
    bio: "Dedicated to ensuring every CEO gets maximum value from their Webstack.ceo experience.",
    initials: "EW",
    gradient: "from-orange-400 to-pink-500",
  },
];

const TeamSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
            Our Team
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Meet the <span className="gradient-text">Experts</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A team of industry veterans dedicated to empowering CEOs with the tools they need to dominate online.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card rounded-2xl p-6 text-center group hover:glow-accent transition-all duration-300"
            >
              <div
                className={`w-20 h-20 rounded-full bg-gradient-to-br ${member.gradient} mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300`}
              >
                {member.initials}
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">{member.name}</h3>
              <p className="text-sm text-primary font-medium mb-3">{member.role}</p>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{member.bio}</p>
              <div className="flex justify-center gap-3">
                <button className="p-2 rounded-lg bg-secondary/50 hover:bg-primary/20 transition-colors">
                  <Linkedin className="w-4 h-4 text-muted-foreground hover:text-primary" />
                </button>
                <button className="p-2 rounded-lg bg-secondary/50 hover:bg-primary/20 transition-colors">
                  <Twitter className="w-4 h-4 text-muted-foreground hover:text-primary" />
                </button>
                <button className="p-2 rounded-lg bg-secondary/50 hover:bg-primary/20 transition-colors">
                  <Mail className="w-4 h-4 text-muted-foreground hover:text-primary" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
