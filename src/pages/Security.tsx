import { motion } from "framer-motion";
import { Shield, Lock, Server, Eye, FileCheck, Users, Globe, AlertTriangle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import LegalBreadcrumb from "@/components/ui/legal-breadcrumb";

const securityFeatures = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.",
  },
  {
    icon: Server,
    title: "Secure Infrastructure",
    description: "Hosted on enterprise-grade cloud infrastructure with SOC 2 Type II compliance.",
  },
  {
    icon: Eye,
    title: "Access Controls",
    description: "Role-based access control (RBAC) with multi-factor authentication support.",
  },
  {
    icon: FileCheck,
    title: "Regular Audits",
    description: "Annual third-party penetration testing and continuous security monitoring.",
  },
  {
    icon: Users,
    title: "Employee Security",
    description: "Background checks, security training, and strict access policies for all team members.",
  },
  {
    icon: Globe,
    title: "Global Compliance",
    description: "GDPR, CCPA, and international data protection regulation compliance.",
  },
];

const Security = () => {
  const lastUpdated = "January 17, 2026";

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <Navbar />
      
      <main>
        <LegalBreadcrumb pageName="Security" />
        
        {/* Hero Section */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                Trust & Security
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Security at <span className="gradient-text">Webstack.ceo</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Your data security is our top priority. We implement industry-leading security measures to protect your information.
              </p>
              <p className="text-muted-foreground mt-4">
                Last updated: {lastUpdated}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Security Features Grid */}
        <section className="py-12">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {securityFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-6 hover:glow-accent transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Security Content */}
        <section className="py-12 pb-24">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="glass-card rounded-2xl p-8 md:p-12 space-y-8">
                {/* Infrastructure Security */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Infrastructure Security</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Our platform is built on a secure, scalable cloud infrastructure designed to meet the most stringent security requirements:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li><strong className="text-foreground">Cloud Provider:</strong> We utilize AWS and Google Cloud Platform with multiple availability zones for redundancy and disaster recovery.</li>
                    <li><strong className="text-foreground">Network Security:</strong> Virtual Private Cloud (VPC) isolation, Web Application Firewall (WAF), and DDoS protection.</li>
                    <li><strong className="text-foreground">Container Security:</strong> Hardened container images with automated vulnerability scanning and runtime protection.</li>
                    <li><strong className="text-foreground">Database Security:</strong> Encrypted databases with automated backups, point-in-time recovery, and strict access controls.</li>
                    <li><strong className="text-foreground">Monitoring:</strong> 24/7 infrastructure monitoring with automated alerting and incident response.</li>
                  </ul>
                </div>

                {/* Data Protection */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Lock className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Data Protection</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We implement comprehensive data protection measures to ensure your information remains secure:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li><strong className="text-foreground">Encryption in Transit:</strong> All data transmitted between your browser and our servers is encrypted using TLS 1.3 with perfect forward secrecy.</li>
                    <li><strong className="text-foreground">Encryption at Rest:</strong> All stored data is encrypted using AES-256 encryption with regularly rotated keys managed by AWS KMS.</li>
                    <li><strong className="text-foreground">Key Management:</strong> Encryption keys are stored in hardware security modules (HSMs) with strict access controls.</li>
                    <li><strong className="text-foreground">Data Isolation:</strong> Customer data is logically isolated using secure multi-tenancy architecture.</li>
                    <li><strong className="text-foreground">Secure Deletion:</strong> When you delete data, it is permanently removed from our systems within 90 days.</li>
                  </ul>
                </div>

                {/* Application Security */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <FileCheck className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Application Security</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Security is embedded throughout our software development lifecycle:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li><strong className="text-foreground">Secure Development:</strong> OWASP-compliant development practices with mandatory security training for all engineers.</li>
                    <li><strong className="text-foreground">Code Review:</strong> All code changes undergo peer review with security-focused checks before deployment.</li>
                    <li><strong className="text-foreground">Static Analysis:</strong> Automated static application security testing (SAST) on every commit.</li>
                    <li><strong className="text-foreground">Dynamic Testing:</strong> Regular dynamic application security testing (DAST) in staging environments.</li>
                    <li><strong className="text-foreground">Dependency Scanning:</strong> Automated scanning for vulnerable dependencies with immediate patching protocols.</li>
                    <li><strong className="text-foreground">Penetration Testing:</strong> Annual third-party penetration testing by certified security professionals.</li>
                  </ul>
                </div>

                {/* Access Control */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Access Control & Authentication</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We provide robust access control mechanisms to protect your account:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li><strong className="text-foreground">Multi-Factor Authentication:</strong> Support for TOTP-based MFA, SMS, and hardware security keys (WebAuthn/FIDO2).</li>
                    <li><strong className="text-foreground">Single Sign-On:</strong> Enterprise SSO integration with SAML 2.0 and OpenID Connect providers.</li>
                    <li><strong className="text-foreground">Role-Based Access Control:</strong> Granular permissions with customizable roles for team members.</li>
                    <li><strong className="text-foreground">Session Management:</strong> Secure session handling with configurable timeout policies.</li>
                    <li><strong className="text-foreground">Audit Logging:</strong> Comprehensive audit logs of all authentication and authorization events.</li>
                    <li><strong className="text-foreground">Password Policy:</strong> Strong password requirements with breach detection integration.</li>
                  </ul>
                </div>

                {/* Compliance */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Compliance & Certifications</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We maintain compliance with industry standards and regulations:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li><strong className="text-foreground">SOC 2 Type II:</strong> Annual audit for security, availability, and confidentiality controls.</li>
                    <li><strong className="text-foreground">GDPR:</strong> Full compliance with the General Data Protection Regulation for EU data subjects.</li>
                    <li><strong className="text-foreground">CCPA/CPRA:</strong> Compliance with California privacy regulations.</li>
                    <li><strong className="text-foreground">ISO 27001:</strong> Information security management system certification.</li>
                    <li><strong className="text-foreground">PCI DSS:</strong> Payment card industry data security standards for payment processing.</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    Compliance documentation and audit reports are available to enterprise customers upon request under NDA.
                  </p>
                </div>

                {/* Incident Response */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Incident Response</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We maintain a comprehensive incident response program:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li><strong className="text-foreground">24/7 Monitoring:</strong> Continuous security monitoring and automated threat detection.</li>
                    <li><strong className="text-foreground">Response Team:</strong> Dedicated security incident response team with defined escalation procedures.</li>
                    <li><strong className="text-foreground">Communication:</strong> Timely notification of security incidents affecting your data as required by law.</li>
                    <li><strong className="text-foreground">Post-Incident Review:</strong> Thorough analysis and implementation of preventive measures after incidents.</li>
                  </ul>
                </div>

                {/* Bug Bounty */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Responsible Disclosure</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We value the security research community and welcome responsible disclosure of security vulnerabilities. If you discover a security issue, please report it to <span className="text-primary">security@webstack.ceo</span>. We commit to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                    <li>Acknowledge receipt of your report within 24 hours</li>
                    <li>Provide regular updates on our investigation progress</li>
                    <li>Work with you to understand and resolve the issue</li>
                    <li>Recognize your contribution if desired</li>
                  </ul>
                </div>

                {/* Contact */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Security Contact</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    For security-related inquiries or to report a vulnerability:
                  </p>
                  <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
                    <p className="text-foreground font-semibold">Webstack.ceo Security Team</p>
                    <p className="text-muted-foreground">Email: security@webstack.ceo</p>
                    <p className="text-muted-foreground">PGP Key: Available upon request</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Security;