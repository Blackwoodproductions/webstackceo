import jsPDF from 'jspdf';
import diamondFlowImg from '@/assets/bron-seo-diamond-flow.png';

// Helper to load image as base64
const loadImageAsBase64 = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = src;
  });
};

export const generateServicesPDF = async () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;

  // Brand colors
  const colors = {
    primary: [0, 188, 212] as [number, number, number],
    primaryDark: [0, 150, 180] as [number, number, number],
    accent: [139, 92, 246] as [number, number, number],
    dark: [15, 23, 42] as [number, number, number],
    text: [51, 51, 51] as [number, number, number],
    textLight: [100, 100, 100] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    lightBg: [248, 250, 252] as [number, number, number],
    gold: [234, 179, 8] as [number, number, number],
  };

  // Helper: Draw decorative circle
  const drawCircle = (x: number, y: number, r: number, color: [number, number, number], alpha: number = 1) => {
    doc.setFillColor(...color);
    doc.setGState(doc.GState({ opacity: alpha }));
    doc.circle(x, y, r, 'F');
    doc.setGState(doc.GState({ opacity: 1 }));
  };

  // Helper: Draw icon placeholder (circle with letter)
  const drawIcon = (x: number, y: number, letter: string, bgColor: [number, number, number]) => {
    doc.setFillColor(...bgColor);
    doc.circle(x, y, 6, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.white);
    doc.text(letter, x - 2.5, y + 3.5);
  };

  // Helper: Draw checkmark bullet
  const drawCheckmark = (x: number, y: number) => {
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.8);
    doc.line(x, y, x + 2, y + 2);
    doc.line(x + 2, y + 2, x + 5, y - 2);
  };

  // Helper: Draw horizontal line
  const drawDivider = (y: number, style: 'solid' | 'gradient' = 'solid') => {
    if (style === 'gradient') {
      // Simulated gradient with multiple lines
      for (let i = 0; i < 5; i++) {
        const alpha = 1 - (i * 0.2);
        doc.setDrawColor(...colors.primary);
        doc.setGState(doc.GState({ opacity: alpha }));
        doc.setLineWidth(0.3);
        doc.line(margin + (i * 20), y, margin + contentWidth - (i * 20), y);
      }
      doc.setGState(doc.GState({ opacity: 1 }));
    } else {
      doc.setDrawColor(...colors.primary);
      doc.setLineWidth(0.5);
      doc.line(margin, y, margin + contentWidth, y);
    }
  };

  // ===== PAGE 1: Cover =====
  
  // Background decorative elements
  drawCircle(180, 30, 40, colors.primary, 0.1);
  drawCircle(30, 250, 60, colors.accent, 0.08);
  drawCircle(190, 280, 30, colors.primary, 0.05);

  // Header bar
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 55, 'F');
  
  // Accent line under header
  doc.setFillColor(...colors.primary);
  doc.rect(0, 55, pageWidth, 3, 'F');

  // Logo
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('webstack', margin, 35);
  doc.setTextColor(...colors.primary);
  doc.text('.ceo', margin + 62, 35);
  
  doc.setFontSize(11);
  doc.setTextColor(180, 180, 180);
  doc.text('by Blackwood Productions', margin, 48);

  // Tagline on right
  doc.setFontSize(10);
  doc.setTextColor(...colors.primary);
  doc.text('Your Complete Web Command Center', pageWidth - margin - 70, 35);

  yPos = 85;

  // Main title
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('Services', margin, yPos);
  doc.setTextColor(...colors.primary);
  doc.text('Overview', margin + 58, yPos);
  
  yPos += 15;
  
  // Subtitle
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.textLight);
  const subtitle = 'Everything you need to dominate search rankings, convert visitors, and scale your agency.';
  doc.text(subtitle, margin, yPos);

  yPos += 20;
  drawDivider(yPos, 'gradient');
  yPos += 20;

  // Introduction box
  doc.setFillColor(...colors.lightBg);
  doc.roundedRect(margin, yPos, contentWidth, 45, 4, 4, 'F');
  
  // Accent bar on left of box
  doc.setFillColor(...colors.primary);
  doc.rect(margin, yPos, 4, 45, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('Why Choose webstack.ceo?', margin + 12, yPos + 12);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.textLight);
  const introText = doc.splitTextToSize(
    'webstack.ceo is the unified dashboard that simplifies every task—from basic uptime monitoring to advanced SEO and traffic intelligence. Built specifically for agencies, we automate the tedious work so you can focus on growing your clients\' businesses.',
    contentWidth - 20
  );
  doc.text(introText, margin + 12, yPos + 24);

  yPos += 60;

  // Key stats row
  const stats = [
    { value: '99.99%', label: 'Uptime SLA' },
    { value: '50+', label: 'Integrations' },
    { value: '24/7', label: 'Monitoring' },
    { value: '100%', label: 'White Label' },
  ];
  
  const statWidth = contentWidth / 4;
  stats.forEach((stat, i) => {
    const x = margin + (i * statWidth) + (statWidth / 2);
    
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text(stat.value, x, yPos, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textLight);
    doc.text(stat.label, x, yPos + 8, { align: 'center' });
  });

  yPos += 30;
  drawDivider(yPos);
  yPos += 15;

  // Service categories preview
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('Our Service Categories', margin, yPos);
  yPos += 12;

  const categories = [
    { icon: 'S', name: 'SEO & Content', desc: 'On-page optimization, link building, automated content' },
    { icon: 'T', name: 'Traffic Intelligence', desc: 'Visitor de-anonymization, company insights' },
    { icon: 'C', name: 'Conversion & Authority', desc: 'Landing pages, domain authority, analytics' },
    { icon: 'I', name: 'Infrastructure', desc: 'Uptime monitoring, premium hosting' },
  ];

  categories.forEach((cat, i) => {
    const boxY = yPos + (i * 22);
    drawIcon(margin + 6, boxY + 4, cat.icon, colors.primary);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.dark);
    doc.text(cat.name, margin + 18, boxY + 2);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textLight);
    doc.text(cat.desc, margin + 18, boxY + 9);
  });

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(...colors.textLight);
  doc.text('Page 1 of 3', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // ===== PAGE 2: Services Detail =====
  doc.addPage();
  yPos = 20;

  // Page header
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setFillColor(...colors.primary);
  doc.rect(0, 25, pageWidth, 2, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('webstack.ceo', margin, 16);
  doc.setTextColor(...colors.primary);
  doc.text(' | Service Details', margin + 35, 16);

  yPos = 40;

  // SEO & Content Section
  doc.setFillColor(...colors.primary);
  doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('SEO & CONTENT SERVICES', margin + 5, yPos + 8);
  yPos += 20;

  const seoServices = [
    {
      name: 'On-Page SEO Optimization',
      desc: 'Comprehensive technical audits, meta tag optimization, schema markup, and Core Web Vitals improvements. We analyze every element that affects your search rankings.',
      features: ['Technical audits', 'Meta optimization', 'Schema markup', 'Core Web Vitals']
    },
    {
      name: 'Niche Link Building',
      desc: 'Our automated categorization system enables highly relevant, niche-specific backlinks at scale. No PBNs or spammy tactics—only quality links that move the needle.',
      features: ['Automated categorization', 'Niche targeting', 'Quality control', 'Scalable outreach']
    },
    {
      name: 'Automated Blog & Content',
      desc: 'AI-powered blog posts, FAQs, and web copy that positions your clients as industry authorities. Set it and forget it—or customize to your heart\'s content.',
      features: ['AI-powered writing', 'FAQ generation', 'Content scheduling', 'Brand voice matching']
    },
    {
      name: 'Social Signals Amplification',
      desc: 'Automatically share your latest content to X, LinkedIn, and Facebook. Increase engagement and build social proof that search engines love.',
      features: ['Auto-posting', 'Multi-platform', 'Engagement tracking', 'Content recycling']
    },
  ];

  seoServices.forEach((service) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 30;
    }
    
    // Service name with bullet
    doc.setFillColor(...colors.primary);
    doc.circle(margin + 3, yPos + 1, 2, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primaryDark);
    doc.text(service.name, margin + 10, yPos + 3);
    yPos += 8;
    
    // Description
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textLight);
    const descLines = doc.splitTextToSize(service.desc, contentWidth - 15);
    doc.text(descLines, margin + 10, yPos);
    yPos += descLines.length * 4 + 4;
    
    // Feature tags
    let tagX = margin + 10;
    service.features.forEach((feature) => {
      const tagWidth = doc.getTextWidth(feature) + 8;
      if (tagX + tagWidth > pageWidth - margin) {
        tagX = margin + 10;
        yPos += 8;
      }
      doc.setFillColor(230, 245, 248);
      doc.roundedRect(tagX, yPos - 4, tagWidth, 7, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setTextColor(...colors.primaryDark);
      doc.text(feature, tagX + 4, yPos);
      tagX += tagWidth + 4;
    });
    yPos += 12;
  });

  yPos += 5;

  // Traffic Intelligence Section
  doc.setFillColor(...colors.accent);
  doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('TRAFFIC INTELLIGENCE', margin + 5, yPos + 8);
  yPos += 20;

  const trafficServices = [
    {
      name: 'Traffic De-Anonymization',
      desc: 'Identify anonymous website visitors and turn unknown traffic into qualified leads. See which companies are visiting your site, even if they don\'t fill out a form.',
      features: ['Company identification', 'Lead scoring', 'CRM integration', 'Real-time alerts']
    },
    {
      name: 'Visitor Intelligence',
      desc: 'Deep insights into visitor behavior—which pages they view, how long they stay, and when they\'re ready to buy. Arm your sales team with actionable data.',
      features: ['Behavior tracking', 'Intent signals', 'Journey mapping', 'Sales alerts']
    },
  ];

  trafficServices.forEach((service) => {
    doc.setFillColor(...colors.accent);
    doc.circle(margin + 3, yPos + 1, 2, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 60, 180);
    doc.text(service.name, margin + 10, yPos + 3);
    yPos += 8;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textLight);
    const descLines = doc.splitTextToSize(service.desc, contentWidth - 15);
    doc.text(descLines, margin + 10, yPos);
    yPos += descLines.length * 4 + 4;
    
    let tagX = margin + 10;
    service.features.forEach((feature) => {
      const tagWidth = doc.getTextWidth(feature) + 8;
      if (tagX + tagWidth > pageWidth - margin) {
        tagX = margin + 10;
        yPos += 8;
      }
      doc.setFillColor(240, 235, 255);
      doc.roundedRect(tagX, yPos - 4, tagWidth, 7, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setTextColor(100, 60, 180);
      doc.text(feature, tagX + 4, yPos);
      tagX += tagWidth + 4;
    });
    yPos += 12;
  });

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(...colors.textLight);
  doc.text('Page 2 of 4', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // ===== PAGE 3: Diamond Flow Methodology =====
  doc.addPage();
  yPos = 20;

  // Page header
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setFillColor(...colors.primary);
  doc.rect(0, 25, pageWidth, 2, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('webstack.ceo', margin, 16);
  doc.setTextColor(...colors.primary);
  doc.text(' | Link Building Methodology', margin + 35, 16);

  yPos = 40;

  // Diamond Flow Section Header
  doc.setFillColor(...colors.primary);
  doc.roundedRect(margin, yPos, contentWidth, 14, 2, 2, 'F');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('THE DIAMOND FLOW: CONTENT SILO ARCHITECTURE', margin + 5, yPos + 10);
  yPos += 22;

  // Introduction text
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.textLight);
  const diamondIntro = doc.splitTextToSize(
    'Our proprietary Diamond Flow architecture creates content silos that channel link equity directly to your money pages. This bottom-up power structure ensures every inbound link strengthens your most valuable URLs.',
    contentWidth
  );
  doc.text(diamondIntro, margin, yPos);
  yPos += diamondIntro.length * 5 + 8;

  // Load and add the Diamond Flow image
  try {
    const imgData = await loadImageAsBase64(diamondFlowImg);
    const imgWidth = 80;
    const imgHeight = 100;
    const imgX = margin + (contentWidth - imgWidth) / 2;
    doc.addImage(imgData, 'PNG', imgX, yPos, imgWidth, imgHeight);
    yPos += imgHeight + 10;
  } catch (error) {
    console.log('Could not load Diamond Flow image:', error);
    // Fallback: draw a placeholder
    doc.setFillColor(...colors.lightBg);
    doc.roundedRect(margin + 30, yPos, contentWidth - 60, 80, 4, 4, 'F');
    doc.setFontSize(10);
    doc.setTextColor(...colors.textLight);
    doc.text('[Diamond Flow Diagram]', pageWidth / 2, yPos + 40, { align: 'center' });
    yPos += 90;
  }

  // How It Works section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('How the Diamond Flow Works:', margin, yPos);
  yPos += 10;

  const diamondSteps = [
    { title: 'Money Page (Top)', desc: 'Your client\'s target URL—either their existing page or one we create for their main keyword. All link equity flows here.' },
    { title: 'Main Keyword Page', desc: 'If the client doesn\'t have a money page, we create one targeting their primary keyword. If they do, we skip this step.' },
    { title: 'Supporting Pages (2 per cluster)', desc: 'We create niche-relevant content pages that link upward to the money page, passing authority.' },
    { title: 'Resources Page (Topical Index)', desc: 'A comprehensive index of the 3 keyword pages above, reinforcing the silo\'s topical relevance and thematic authority.' },
    { title: 'Real Business Websites', desc: 'All inbound links come from real, relevant business websites in your niche—not PBNs, link farms, or spam sites.' },
  ];

  diamondSteps.forEach((step, index) => {
    // Step number circle
    doc.setFillColor(...colors.primary);
    doc.circle(margin + 5, yPos + 3, 4, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.white);
    doc.text(String(index + 1), margin + 3.5, yPos + 5);
    
    // Step title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.dark);
    doc.text(step.title, margin + 14, yPos + 4);
    yPos += 7;
    
    // Step description
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textLight);
    const stepLines = doc.splitTextToSize(step.desc, contentWidth - 20);
    doc.text(stepLines, margin + 14, yPos);
    yPos += stepLines.length * 4 + 6;
  });

  // Key benefit box
  yPos += 5;
  doc.setFillColor(230, 245, 248);
  doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'F');
  doc.setFillColor(...colors.primary);
  doc.rect(margin, yPos, 4, 25, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primaryDark);
  doc.text('Key Benefit:', margin + 10, yPos + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.textLight);
  const benefitText = doc.splitTextToSize(
    'All inbound links flow upward through the silo structure, concentrating authority on your money page. This strategic architecture maximizes ranking potential.',
    contentWidth - 20
  );
  doc.text(benefitText, margin + 10, yPos + 15);

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(...colors.textLight);
  doc.text('Page 3 of 4', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // ===== PAGE 4: More Services + Pricing + Contact =====
  doc.addPage();
  yPos = 20;

  // Page header
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setFillColor(...colors.primary);
  doc.rect(0, 25, pageWidth, 2, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('webstack.ceo', margin, 16);
  doc.setTextColor(...colors.primary);
  doc.text(' | Conversion & Infrastructure', margin + 35, 16);

  yPos = 40;

  // Conversion & Authority Section
  doc.setFillColor(...colors.gold);
  doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('CONVERSION & AUTHORITY', margin + 5, yPos + 8);
  yPos += 18;

  const conversionServices = [
    { name: 'PPC Landing Pages', desc: 'High-converting landing pages optimized for paid campaigns. Maximize your ad spend ROI.' },
    { name: 'Domain Authority Building', desc: 'Boost your DR and DA scores with proven strategies. Build lasting domain authority.' },
    { name: 'Advanced Analytics', desc: 'Deep insights into search rankings, competitor analysis, and actionable data.' },
    { name: 'Google My Business', desc: 'Dominate local search with optimized GMB profiles and enhanced visibility.' },
  ];

  conversionServices.forEach((service) => {
    drawCheckmark(margin + 2, yPos);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.dark);
    doc.text(service.name, margin + 12, yPos + 2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textLight);
    doc.text(' — ' + service.desc, margin + 12 + doc.getTextWidth(service.name), yPos + 2);
    yPos += 10;
  });

  yPos += 8;

  // Infrastructure Section
  doc.setFillColor(100, 116, 139);
  doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('INFRASTRUCTURE', margin + 5, yPos + 8);
  yPos += 18;

  const infraServices = [
    { name: 'Site Uptime Monitoring', desc: '24/7 monitoring with instant alerts. Know the moment your site goes down.' },
    { name: 'Premium Web Hosting', desc: 'Enterprise-grade hosting with 99.99% uptime SLA, global CDN, and auto-scaling.' },
  ];

  infraServices.forEach((service) => {
    drawCheckmark(margin + 2, yPos);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.dark);
    doc.text(service.name, margin + 12, yPos + 2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textLight);
    doc.text(' — ' + service.desc, margin + 12 + doc.getTextWidth(service.name), yPos + 2);
    yPos += 10;
  });

  yPos += 15;

  // Pricing Overview
  doc.setFillColor(...colors.dark);
  doc.roundedRect(margin, yPos, contentWidth, 55, 4, 4, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('Pricing Plans', margin + 10, yPos + 15);
  
  // Three pricing columns
  const plans = [
    { name: 'Business CEO', price: '$75', period: '/mo', desc: 'Perfect for small agencies' },
    { name: 'White Label', price: '$499', period: '/mo', desc: 'Full rebrandable solution', featured: true },
    { name: 'Super Reseller', price: '$1,499', period: '/mo', desc: 'Enterprise scale' },
  ];
  
  const planWidth = (contentWidth - 30) / 3;
  plans.forEach((plan, i) => {
    const planX = margin + 10 + (i * (planWidth + 5));
    const planY = yPos + 25;
    
    if (plan.featured) {
      doc.setFillColor(...colors.primary);
      doc.roundedRect(planX, planY, planWidth, 25, 2, 2, 'F');
      doc.setTextColor(...colors.white);
    } else {
      doc.setFillColor(40, 50, 70);
      doc.roundedRect(planX, planY, planWidth, 25, 2, 2, 'F');
      doc.setTextColor(200, 200, 200);
    }
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(plan.name, planX + planWidth / 2, planY + 8, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(plan.price, planX + planWidth / 2 - 5, planY + 18, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(plan.period, planX + planWidth / 2 + 12, planY + 18, { align: 'center' });
  });

  yPos += 70;

  // CTA Box
  doc.setFillColor(...colors.lightBg);
  doc.roundedRect(margin, yPos, contentWidth, 40, 4, 4, 'F');
  
  doc.setFillColor(...colors.primary);
  doc.roundedRect(margin + 10, yPos + 10, 80, 20, 3, 3, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('Get Started Free', margin + 50, yPos + 23, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setTextColor(...colors.dark);
  doc.text('Visit webstack.ceo/pricing', margin + 105, yPos + 20);
  doc.setFontSize(9);
  doc.setTextColor(...colors.textLight);
  doc.text('Start your free trial today. No credit card required.', margin + 105, yPos + 30);

  yPos += 50;

  // Contact Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('Contact Us', margin, yPos);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.textLight);
  doc.text('Email: hello@webstack.ceo', margin, yPos);
  doc.text('Web: webstack.ceo', margin + 70, yPos);
  
  // Footer
  doc.setFillColor(...colors.dark);
  doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} | © ${new Date().getFullYear()} Webstack.ceo by Blackwood Productions | All rights reserved`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );
  
  doc.setTextColor(...colors.white);
  doc.text('Page 4 of 4', pageWidth / 2, pageHeight - 14, { align: 'center' });

  // Save the PDF
  doc.save('webstack-ceo-services.pdf');
};
