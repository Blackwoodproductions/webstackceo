import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const testimonials = [
  {
    name: "Sarah Chen",
    title: "CEO, TechFlow Solutions",
    company: "TechFlow",
    quote: "Webstack transformed how we manage our online presence. The unified dashboard saved us 20+ hours per week and increased our organic traffic by 340%.",
    rating: 5,
    image: "SC",
  },
  {
    name: "Marcus Johnson",
    title: "CEO, Elevate Commerce",
    company: "Elevate",
    quote: "The traffic de-anonymization feature alone paid for our subscription in the first month. We're now converting visitors we never knew existed.",
    rating: 5,
    image: "MJ",
  },
  {
    name: "Elena Rodriguez",
    title: "CEO, Brightpath Digital",
    company: "Brightpath",
    quote: "Finally, one platform that does it all. No more juggling 10 different tools. Our team productivity has never been higher.",
    rating: 5,
    image: "ER",
  },
  {
    name: "David Park",
    title: "CEO, Velocity SaaS",
    company: "Velocity",
    quote: "The SEO results speak for themselves—we went from page 5 to page 1 in just 3 months. Real backlinks from real businesses made all the difference.",
    rating: 5,
    image: "DP",
  },
  {
    name: "Amanda Foster",
    title: "CEO, GrowthLab Agency",
    company: "GrowthLab",
    quote: "As someone who's tried every tool out there, Webstack is the first platform that truly delivers on its promises. Worth every penny.",
    rating: 5,
    image: "AF",
  },
];

const TestimonialsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const gridY = useTransform(scrollYProgress, [0, 1], [30, -30]);

  return (
    <section ref={sectionRef} id="testimonials" className="py-24 relative overflow-hidden bg-secondary/30">
      <motion.div style={{ y: gridY }} className="absolute inset-0 grid-pattern opacity-20" />
      
      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Trusted by{" "}
            <span className="gradient-text">Industry Leaders</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join over 1,000 CEOs who have transformed their online presence with Webstack.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <div className="h-full glass-card rounded-2xl p-6 relative group transition-all duration-300 hover:shadow-[0_0_30px_rgba(251,191,36,0.4)] hover:border-amber-400/30 border border-transparent">
                    <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/20 group-hover:text-amber-400/30 transition-colors duration-300" />
                    
                    {/* Star Rating */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    
                    {/* Quote */}
                    <p className="text-foreground/90 text-base leading-relaxed mb-6 line-clamp-4">
                      "{testimonial.quote}"
                    </p>
                    
                    {/* Author */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-white font-bold">
                        {testimonial.image}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                      </div>
                    </div>
                    
                    {/* Company Badge */}
                    <div className="absolute bottom-6 right-6">
                      <span className="px-3 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground">
                        {testimonial.company}
                      </span>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-primary-foreground" />
            <CarouselNext className="hidden md:flex -right-4 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-primary-foreground" />
          </Carousel>
          
          {/* Carousel Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full bg-primary/30"
              />
            ))}
          </div>
        </motion.div>

        {/* Trust Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto"
        >
          {[
            { value: "1,000+", label: "CEOs Trust Us" },
            { value: "99.9%", label: "Satisfaction Rate" },
            { value: "340%", label: "Avg Traffic Increase" },
            { value: "4.9/5", label: "Average Rating" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl md:text-4xl font-bold gradient-text mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
