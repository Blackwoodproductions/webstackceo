import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    category: "Pricing",
    questions: [
      {
        question: "Can I change my plan later?",
        answer:
          "Absolutely! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the change will take effect at your next billing cycle.",
      },
      {
        question: "Is there a free trial?",
        answer:
          "Yes! All plans come with a 14-day free trial. No credit card required to get started. You'll have full access to all features in your chosen plan during the trial period.",
      },
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for Enterprise plans. All payments are processed securely through Stripe.",
      },
    ],
  },
  {
    category: "Features",
    questions: [
      {
        question: "How does uptime monitoring work?",
        answer:
          "Our uptime monitoring checks your websites at regular intervals (every minute for Pro and Enterprise plans). If your site goes down, you'll receive instant alerts via email, SMS, or Slack, depending on your preferences.",
      },
      {
        question: "What SEO tools are included?",
        answer:
          "Our SEO suite includes keyword tracking, competitor analysis, backlink monitoring, technical SEO audits, and actionable recommendations. Pro and Enterprise plans also include content optimization suggestions powered by AI.",
      },
      {
        question: "Can I monitor websites I don't own?",
        answer:
          "Yes, you can monitor any publicly accessible website. This is great for keeping an eye on competitors or tracking client websites. However, some advanced features may require site verification.",
      },
    ],
  },
  {
    category: "Support",
    questions: [
      {
        question: "What kind of support do you offer?",
        answer:
          "Starter plans include email support with 24-hour response times. Pro plans add live chat with priority response. Enterprise customers get a dedicated account manager and 24/7 phone support.",
      },
      {
        question: "Do you offer onboarding assistance?",
        answer:
          "Yes! All new customers receive access to our comprehensive knowledge base and video tutorials. Pro and Enterprise plans include a personalized onboarding session with our success team.",
      },
      {
        question: "What's your refund policy?",
        answer:
          "We offer a 30-day money-back guarantee on all plans. If you're not satisfied with Webstack for any reason, contact our support team within 30 days of your purchase for a full refund.",
      },
    ],
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary font-medium tracking-wider uppercase text-sm">
            FAQ
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to know about Webstack. Can't find what you're
            looking for? Reach out to our support team.
          </p>
        </motion.div>

        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-xl font-semibold mb-4 text-primary">
                {category.category}
              </h3>
              <Accordion type="single" collapsible className="space-y-3">
                {category.questions.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`${category.category}-${index}`}
                    className="glass-card border border-white/10 rounded-xl px-6 data-[state=open]:border-primary/50 transition-colors"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-5">
                      <span className="font-medium">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground">
            Still have questions?{" "}
            <a
              href="#contact"
              className="text-primary hover:underline font-medium"
            >
              Contact our support team
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
