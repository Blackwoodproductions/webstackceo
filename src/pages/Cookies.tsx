import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import LegalBreadcrumb from "@/components/ui/legal-breadcrumb";

const Cookies = () => {
  const lastUpdated = "January 17, 2026";

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <Navbar />
      
      <main>
        <LegalBreadcrumb pageName="Cookie Policy" />
        
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
                Cookie <span className="gradient-text">Policy</span>
              </h1>
              <p className="text-muted-foreground">
                Last updated: {lastUpdated}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Cookie Policy Content */}
        <section className="py-12 pb-24">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="glass-card rounded-2xl p-8 md:p-12 space-y-8">
                {/* Introduction */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    This Cookie Policy explains how Webstack.ceo, operated by Blackwood Productions ("Company," "we," "our," or "us"), uses cookies and similar tracking technologies when you visit our website and use our Services. This policy should be read alongside our Privacy Policy, which explains how we collect and use personal information.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    By continuing to use our website and Services, you consent to our use of cookies as described in this policy. You can manage your cookie preferences at any time using the methods described below.
                  </p>
                </div>

                {/* What Are Cookies */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">2. What Are Cookies?</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when you visit a website. They are widely used to make websites work more efficiently, provide a better user experience, and give website owners information about how their site is being used.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    Cookies can be "persistent" (remaining on your device until deleted or until they expire) or "session" cookies (deleted when you close your browser). First-party cookies are set by the website you are visiting, while third-party cookies are set by a different domain.
                  </p>
                </div>

                {/* Types of Cookies */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">3. Types of Cookies We Use</h2>
                  
                  <h3 className="text-xl font-semibold text-foreground mb-3">3.1 Essential Cookies</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    These cookies are strictly necessary for the operation of our website and Services. They enable core functionality such as security, network management, and account access. You cannot opt out of these cookies as the Services would not function properly without them.
                  </p>
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-foreground font-semibold">Cookie Name</th>
                          <th className="text-left py-3 px-4 text-foreground font-semibold">Purpose</th>
                          <th className="text-left py-3 px-4 text-foreground font-semibold">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4">session_id</td>
                          <td className="py-3 px-4">Maintains your login session</td>
                          <td className="py-3 px-4">Session</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4">csrf_token</td>
                          <td className="py-3 px-4">Security protection against cross-site request forgery</td>
                          <td className="py-3 px-4">Session</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4">auth_token</td>
                          <td className="py-3 px-4">Authentication verification</td>
                          <td className="py-3 px-4">30 days</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4">cookie_consent</td>
                          <td className="py-3 px-4">Stores your cookie preferences</td>
                          <td className="py-3 px-4">1 year</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-3">3.2 Functional Cookies</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    These cookies enable enhanced functionality and personalization, such as remembering your preferences, language settings, and customizations. If you disable these cookies, some features may not work as intended.
                  </p>
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-foreground font-semibold">Cookie Name</th>
                          <th className="text-left py-3 px-4 text-foreground font-semibold">Purpose</th>
                          <th className="text-left py-3 px-4 text-foreground font-semibold">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4">theme</td>
                          <td className="py-3 px-4">Remembers your dark/light mode preference</td>
                          <td className="py-3 px-4">1 year</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4">language</td>
                          <td className="py-3 px-4">Stores your language preference</td>
                          <td className="py-3 px-4">1 year</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4">dashboard_layout</td>
                          <td className="py-3 px-4">Saves your dashboard customizations</td>
                          <td className="py-3 px-4">1 year</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-3">3.3 Analytics Cookies</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our website and Services.
                  </p>
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-foreground font-semibold">Cookie Name</th>
                          <th className="text-left py-3 px-4 text-foreground font-semibold">Purpose</th>
                          <th className="text-left py-3 px-4 text-foreground font-semibold">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4">_ga</td>
                          <td className="py-3 px-4">Google Analytics - Distinguishes unique users</td>
                          <td className="py-3 px-4">2 years</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4">_ga_*</td>
                          <td className="py-3 px-4">Google Analytics - Maintains session state</td>
                          <td className="py-3 px-4">2 years</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4">_gid</td>
                          <td className="py-3 px-4">Google Analytics - Distinguishes users</td>
                          <td className="py-3 px-4">24 hours</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4">amplitude_id</td>
                          <td className="py-3 px-4">Product analytics for feature usage</td>
                          <td className="py-3 px-4">1 year</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-3">3.4 Marketing Cookies</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    These cookies are used to track visitors across websites to display relevant advertisements. They are set by our advertising partners with our permission.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-foreground font-semibold">Cookie Name</th>
                          <th className="text-left py-3 px-4 text-foreground font-semibold">Purpose</th>
                          <th className="text-left py-3 px-4 text-foreground font-semibold">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4">_fbp</td>
                          <td className="py-3 px-4">Facebook Pixel - Ad targeting and measurement</td>
                          <td className="py-3 px-4">3 months</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4">_gcl_au</td>
                          <td className="py-3 px-4">Google Ads conversion tracking</td>
                          <td className="py-3 px-4">3 months</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4">li_fat_id</td>
                          <td className="py-3 px-4">LinkedIn advertising</td>
                          <td className="py-3 px-4">30 days</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Similar Technologies */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">4. Similar Technologies</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    In addition to cookies, we may use other similar technologies:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li><strong className="text-foreground">Web Beacons (Pixel Tags):</strong> Small graphic images embedded in web pages or emails that track whether content has been accessed.</li>
                    <li><strong className="text-foreground">Local Storage:</strong> Browser storage that allows websites to store data locally on your device for improved performance.</li>
                    <li><strong className="text-foreground">Session Storage:</strong> Similar to local storage but data is cleared when the browser session ends.</li>
                    <li><strong className="text-foreground">Fingerprinting:</strong> We do NOT use browser fingerprinting techniques to track users.</li>
                  </ul>
                </div>

                {/* Managing Cookies */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">5. Managing Your Cookie Preferences</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    You have several options for managing cookies:
                  </p>
                  
                  <h3 className="text-xl font-semibold text-foreground mb-3">5.1 Cookie Consent Tool</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    When you first visit our website, you will see a cookie consent banner that allows you to accept or customize your cookie preferences. You can change these preferences at any time by clicking the "Cookie Settings" link in the footer of our website.
                  </p>

                  <h3 className="text-xl font-semibold text-foreground mb-3">5.2 Browser Settings</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Most web browsers allow you to control cookies through their settings. You can typically:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>View what cookies are stored and delete them individually</li>
                    <li>Block third-party cookies</li>
                    <li>Block cookies from specific sites</li>
                    <li>Block all cookies</li>
                    <li>Delete all cookies when you close your browser</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Here are links to cookie management instructions for popular browsers:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
                    <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
                    <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari</a></li>
                    <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
                  </ul>

                  <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">5.3 Opt-Out Tools</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You can opt out of interest-based advertising through:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                    <li><a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Network Advertising Initiative (NAI)</a></li>
                    <li><a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Digital Advertising Alliance (DAA)</a></li>
                    <li><a href="https://www.youronlinechoices.eu/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">European Interactive Digital Advertising Alliance (EDAA)</a></li>
                  </ul>
                </div>

                {/* Impact of Disabling */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">6. Impact of Disabling Cookies</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    If you choose to disable or delete cookies, please be aware that:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                    <li>Some features of our website may not function properly</li>
                    <li>You may need to log in each time you visit</li>
                    <li>Your preferences and customizations may not be saved</li>
                    <li>You may see less relevant advertisements</li>
                    <li>We may not be able to provide personalized content</li>
                  </ul>
                </div>

                {/* Do Not Track */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">7. Do Not Track Signals</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Some browsers include a "Do Not Track" (DNT) feature that signals to websites that you do not want your online activity tracked. Currently, there is no uniform standard for how websites should respond to DNT signals. Our website does not currently respond to DNT signals, but you can use the cookie management options described above to control tracking.
                  </p>
                </div>

                {/* Global Privacy Control */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">8. Global Privacy Control</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We recognize and honor the Global Privacy Control (GPC) signal. If your browser sends a GPC signal, we will treat this as a request to opt out of the sale or sharing of your personal information and limit our use of non-essential cookies.
                  </p>
                </div>

                {/* Updates */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">9. Updates to This Policy</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by updating the "Last updated" date at the top of this policy. We encourage you to review this policy periodically.
                  </p>
                </div>

                {/* Contact */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">10. Contact Us</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    If you have any questions about our use of cookies or this Cookie Policy, please contact us at:
                  </p>
                  <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
                    <p className="text-foreground font-semibold">Webstack.ceo by Blackwood Productions</p>
                    <p className="text-muted-foreground">Email: privacy@webstack.ceo</p>
                    <p className="text-muted-foreground">For general inquiries: support@webstack.ceo</p>
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

export default Cookies;