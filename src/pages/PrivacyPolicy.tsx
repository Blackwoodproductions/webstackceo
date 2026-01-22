import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import LegalBreadcrumb from "@/components/ui/legal-breadcrumb";
import SEO from "@/components/SEO";

const PrivacyPolicy = () => {
  const lastUpdated = "January 17, 2026";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Privacy Policy - Data Protection"
        description="Learn how Webstack.ceo collects, uses, and protects your data. GDPR and CCPA compliant privacy policy. Last updated January 2026."
        keywords="privacy policy, data protection, GDPR, CCPA, data security, personal information"
        canonical="/privacy"
        noIndex={false}
      />
      <ScrollProgress />
      <Navbar />
      
      <main>
        <LegalBreadcrumb pageName="Privacy Policy" />
        
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
                Legal
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Privacy <span className="gradient-text">Policy</span>
              </h1>
              <p className="text-muted-foreground">
                Last updated: {lastUpdated}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Policy Content */}
        <section className="py-12 pb-24">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="prose prose-invert max-w-none"
            >
              <div className="glass-card rounded-2xl p-8 md:p-12 space-y-8">
                {/* Introduction */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Welcome to Webstack.ceo ("Company," "we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Software as a Service (SaaS) platform and related services (collectively, the "Services").
                  </p>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    By accessing or using our Services, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree with our policies and practices, please do not use our Services.
                  </p>
                </div>

                {/* Information We Collect */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">2. Information We Collect</h2>
                  
                  <h3 className="text-xl font-semibold text-foreground mb-3">2.1 Information You Provide Directly</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li><strong className="text-foreground">Account Information:</strong> Name, email address, phone number, company name, job title, and billing information when you create an account or subscribe to our Services.</li>
                    <li><strong className="text-foreground">Profile Data:</strong> Information you add to your account profile, including preferences and settings.</li>
                    <li><strong className="text-foreground">Communications:</strong> Information you provide when contacting our support team, responding to surveys, or participating in promotions.</li>
                    <li><strong className="text-foreground">User Content:</strong> Data, files, and content you upload, store, or transmit through our Services.</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-foreground mb-3">2.2 Information Collected Automatically</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li><strong className="text-foreground">Usage Data:</strong> Information about how you interact with our Services, including features used, pages visited, and actions taken.</li>
                    <li><strong className="text-foreground">Device Information:</strong> IP address, browser type, operating system, device identifiers, and hardware settings.</li>
                    <li><strong className="text-foreground">Cookies and Tracking Technologies:</strong> We use cookies, web beacons, and similar technologies to collect information about your browsing activities.</li>
                    <li><strong className="text-foreground">Log Data:</strong> Server logs that record information such as access times, pages viewed, and referring URLs.</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-foreground mb-3">2.3 Information from Third Parties</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li><strong className="text-foreground">Integration Partners:</strong> Information from third-party services you connect to our platform.</li>
                    <li><strong className="text-foreground">Analytics Providers:</strong> Aggregated data from analytics services to improve our Services.</li>
                    <li><strong className="text-foreground">Business Partners:</strong> Information from our partners for joint marketing initiatives or service enhancements.</li>
                  </ul>
                </div>

                {/* How We Use Your Information */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">3. How We Use Your Information</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">We use the information we collect for the following purposes:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li><strong className="text-foreground">Service Delivery:</strong> To provide, maintain, and improve our Services and fulfill your requests.</li>
                    <li><strong className="text-foreground">Account Management:</strong> To create and manage your account, process transactions, and send related communications.</li>
                    <li><strong className="text-foreground">Personalization:</strong> To customize your experience and provide tailored content and recommendations.</li>
                    <li><strong className="text-foreground">Analytics:</strong> To analyze usage patterns, measure performance, and optimize our Services.</li>
                    <li><strong className="text-foreground">Security:</strong> To detect, prevent, and address fraud, abuse, and security issues.</li>
                    <li><strong className="text-foreground">Communications:</strong> To send you updates, newsletters, marketing materials, and other information (with your consent where required).</li>
                    <li><strong className="text-foreground">Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes.</li>
                  </ul>
                </div>

                {/* Data Sharing */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">4. How We Share Your Information</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">We may share your information in the following circumstances:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li><strong className="text-foreground">Service Providers:</strong> With third-party vendors who perform services on our behalf, such as hosting, analytics, payment processing, and customer support.</li>
                    <li><strong className="text-foreground">Business Transfers:</strong> In connection with a merger, acquisition, reorganization, or sale of assets, your information may be transferred as a business asset.</li>
                    <li><strong className="text-foreground">Legal Requirements:</strong> When required by law, regulation, legal process, or governmental request.</li>
                    <li><strong className="text-foreground">Protection of Rights:</strong> To protect our rights, privacy, safety, or property, or that of our users or others.</li>
                    <li><strong className="text-foreground">With Your Consent:</strong> When you have given us explicit consent to share your information for a specific purpose.</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    We do not sell your personal information to third parties for their marketing purposes.
                  </p>
                </div>

                {/* Data Retention */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">5. Data Retention</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When determining the retention period, we consider the nature and sensitivity of the data, the purposes for processing, and applicable legal requirements.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    Upon termination of your account, we will delete or anonymize your personal information within 90 days, except as required for legal, regulatory, or legitimate business purposes.
                  </p>
                </div>

                {/* Data Security */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">6. Data Security</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We implement industry-standard technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                    <li>Encryption of data in transit and at rest using TLS 1.3 and AES-256</li>
                    <li>Regular security assessments and penetration testing</li>
                    <li>Access controls and authentication mechanisms</li>
                    <li>Employee training on data protection and security practices</li>
                    <li>Incident response procedures and breach notification protocols</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    While we strive to protect your information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.
                  </p>
                </div>

                {/* Your Rights */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">7. Your Privacy Rights</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Depending on your location, you may have certain rights regarding your personal information:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li><strong className="text-foreground">Access:</strong> Request a copy of the personal information we hold about you.</li>
                    <li><strong className="text-foreground">Correction:</strong> Request correction of inaccurate or incomplete information.</li>
                    <li><strong className="text-foreground">Deletion:</strong> Request deletion of your personal information, subject to certain exceptions.</li>
                    <li><strong className="text-foreground">Portability:</strong> Request a copy of your data in a structured, machine-readable format.</li>
                    <li><strong className="text-foreground">Objection:</strong> Object to processing of your information for certain purposes.</li>
                    <li><strong className="text-foreground">Restriction:</strong> Request restriction of processing in certain circumstances.</li>
                    <li><strong className="text-foreground">Withdraw Consent:</strong> Withdraw consent where processing is based on consent.</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    To exercise these rights, please contact us at privacy@webstack.ceo. We will respond to your request within 30 days.
                  </p>
                </div>

                {/* International Transfers */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">8. International Data Transfers</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. When we transfer your information internationally, we implement appropriate safeguards, including Standard Contractual Clauses approved by relevant authorities, to ensure your information receives adequate protection.
                  </p>
                </div>

                {/* Cookies */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">9. Cookies and Tracking Technologies</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We use cookies and similar tracking technologies to collect and store information. You can control cookies through your browser settings and other tools. However, disabling cookies may limit your ability to use certain features of our Services.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We use the following types of cookies:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                    <li><strong className="text-foreground">Essential Cookies:</strong> Required for the operation of our Services.</li>
                    <li><strong className="text-foreground">Analytics Cookies:</strong> Help us understand how visitors interact with our Services.</li>
                    <li><strong className="text-foreground">Functional Cookies:</strong> Enable enhanced functionality and personalization.</li>
                    <li><strong className="text-foreground">Advertising Cookies:</strong> Used to deliver relevant advertisements (with your consent).</li>
                  </ul>
                </div>

                {/* Children's Privacy */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">10. Children's Privacy</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Our Services are not directed to individuals under the age of 16. We do not knowingly collect personal information from children. If we become aware that we have collected personal information from a child without parental consent, we will take steps to delete that information promptly.
                  </p>
                </div>

                {/* Changes to Policy */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">11. Changes to This Privacy Policy</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the updated policy on our website and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.
                  </p>
                </div>

                {/* Contact */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">12. Contact Us</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
                  </p>
                  <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
                    <p className="text-foreground font-semibold">Webstack.ceo by Blackwood Productions</p>
                    <p className="text-muted-foreground">Email: privacy@webstack.ceo</p>
                    <p className="text-muted-foreground">Data Protection Officer: dpo@webstack.ceo</p>
                  </div>
                </div>

                {/* GDPR & CCPA */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">13. Additional Disclosures</h2>
                  
                  <h3 className="text-xl font-semibold text-foreground mb-3">For European Economic Area (EEA) Residents</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Under the General Data Protection Regulation (GDPR), you have additional rights including the right to lodge a complaint with a supervisory authority. Our legal bases for processing include consent, contract performance, legitimate interests, and legal obligations.
                  </p>

                  <h3 className="text-xl font-semibold text-foreground mb-3">For California Residents</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA), California residents have additional rights including the right to know, delete, correct, and opt-out of the sale or sharing of personal information. We do not sell personal information. To exercise your rights, contact us at privacy@webstack.ceo.
                  </p>
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

export default PrivacyPolicy;