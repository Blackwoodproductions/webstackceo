import jsPDF from 'jspdf';

export const generateServicesPDF = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;

  // Helper functions
  const addText = (text: string, fontSize: number, isBold: boolean = false, color: [number, number, number] = [51, 51, 51]) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, yPos);
    yPos += lines.length * (fontSize * 0.5) + 4;
  };

  const addSection = (title: string, items: { name: string; description: string }[]) => {
    // Section title
    doc.setFillColor(0, 188, 212);
    doc.rect(margin, yPos - 4, contentWidth, 10, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin + 4, yPos + 3);
    yPos += 16;

    items.forEach((item) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 150, 180);
      doc.text(`• ${item.name}`, margin + 4, yPos);
      yPos += 6;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      const descLines = doc.splitTextToSize(item.description, contentWidth - 10);
      doc.text(descLines, margin + 8, yPos);
      yPos += descLines.length * 5 + 6;
    });
    yPos += 6;
  };

  // Header with brand colors
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Logo text
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('webstack', margin, 28);
  
  doc.setTextColor(0, 188, 212);
  doc.text('.ceo', margin + 55, 28);
  
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('by Blackwood Productions', margin, 38);

  // Tagline
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text('Your Complete Web Command Center', pageWidth - margin - 65, 28);

  yPos = 60;

  // Introduction
  addText('SERVICE OVERVIEW', 18, true, [0, 150, 180]);
  yPos += 2;
  addText(
    'webstack.ceo is the unified dashboard that simplifies every task—from basic uptime monitoring to advanced SEO and traffic intelligence. Everything you need to run a modern, high-converting website, all in one place.',
    11,
    false,
    [80, 80, 80]
  );
  yPos += 8;

  // Core Services
  addSection('SEO & CONTENT SERVICES', [
    {
      name: 'On-Page SEO',
      description: 'Technical audits, meta optimization, and Core Web Vitals improvements to boost your search rankings.',
    },
    {
      name: 'Niche Link Building',
      description: 'Automated categorization enables highly relevant, niche-specific backlinks at scale. No PBNs.',
    },
    {
      name: 'Automated Blog, FAQ & Content',
      description: 'AI-powered blog posts, FAQs, and web copy that positions your brand as the authority.',
    },
    {
      name: 'Social Signals',
      description: 'Automatically share your latest content to X, LinkedIn, and Facebook to amplify reach.',
    },
  ]);

  addSection('TRAFFIC INTELLIGENCE', [
    {
      name: 'Traffic De-Anonymization',
      description: 'Identify anonymous website visitors. Turn unknown traffic into qualified leads with company-level insights.',
    },
    {
      name: 'Visitor Intelligence',
      description: 'See which companies visit your site, what pages they view, and when they\'re ready to buy.',
    },
  ]);

  addSection('CONVERSION & AUTHORITY', [
    {
      name: 'PPC Landing Pages',
      description: 'High-converting landing pages optimized for paid campaigns. Maximize your ad spend ROI.',
    },
    {
      name: 'Domain Rating & Authority',
      description: 'Boost your DR and DA scores with proven strategies. Build lasting domain authority.',
    },
    {
      name: 'Advanced Rankings & Analytics',
      description: 'Deep insights into search rankings, competitor analysis, and actionable data.',
    },
    {
      name: 'Google My Business Optimization',
      description: 'Dominate local search with optimized GMB profiles and enhanced Google Places visibility.',
    },
  ]);

  // Check if we need a new page
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }

  addSection('INFRASTRUCTURE', [
    {
      name: 'Site Uptime Monitoring',
      description: '24/7 monitoring with instant alerts. Know the moment your site goes down with detailed reports.',
    },
    {
      name: 'Premium Web Hosting',
      description: 'Enterprise-grade hosting with 99.99% uptime SLA, global CDN, and automatic scaling.',
    },
  ]);

  // Pricing highlight
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, yPos, contentWidth, 45, 3, 3, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text('Ready to Get Started?', margin + 10, yPos + 15);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Visit webstack.ceo/pricing to view our plans and start your free trial today.', margin + 10, yPos + 28);
  
  doc.setTextColor(0, 150, 180);
  doc.text('Contact: hello@webstack.ceo', margin + 10, yPos + 38);

  yPos += 55;

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${new Date().toLocaleDateString()} | © ${new Date().getFullYear()} Webstack.ceo by Blackwood Productions`, margin, 285);

  // Save the PDF
  doc.save('webstack-ceo-services.pdf');
};
