import { motion } from "framer-motion";
import { Linkedin, Mail } from "lucide-react";

const teamMembers = [
  {
    name: "Que Ratansi",
    role: "Founder & CEO",
    bio: "Visionary leader driving Webstack.ceo's mission to empower SEO agencies with automated niche linking at scale.",
    initials: "QR",
    gradient: "from-cyan-400 to-violet-500",
    linkedin: "https://www.linkedin.com/in/que-ratansi/",
  },
  {
    name: "Aaron Addleman",
    role: "Chief Technology Officer",
    bio: "SEO technology expert with deep expertise in local search optimization and scalable link building architecture.",
    initials: "AA",
    gradient: "from-violet-500 to-pink-500",
    linkedin: "https://www.linkedin.com/in/seolocalitcom/",
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

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
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
                <a 
                  href={member.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-secondary/50 hover:bg-primary/20 transition-colors"
                >
                  <Linkedin className="w-4 h-4 text-muted-foreground hover:text-primary" />
                </a>
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
