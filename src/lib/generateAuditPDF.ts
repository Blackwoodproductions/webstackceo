import jsPDF from 'jspdf';

interface AuditCheck {
  name: string;
  status: "pass" | "warning" | "fail";
  value?: string;
  description: string;
}

interface AuditCategory {
  title: string;
  score: number;
  checks: AuditCheck[];
  isRealData?: boolean;
}

interface DashboardMetrics {
  domainRating: number;
  ahrefsRank: number;
  backlinks: number;
  backlinksAllTime: number;
  referringDomains: number;
  referringDomainsAllTime: number;
  organicTraffic: number;
  organicKeywords: number;
  trafficValue: number;
  isReal: boolean;
}

interface HistoryDataPoint {
  date: string;
  organicTraffic: number;
  organicKeywords: number;
  domainRating: number;
  trafficValue: number;
}

interface AuditReportData {
  domain: string;
  overallScore: number;
  dashboardMetrics: DashboardMetrics | null;
  auditResults: AuditCategory[];
  historyData?: HistoryDataPoint[];
}

export const generateAuditPDF = async (data: AuditReportData) => {
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
    green: [34, 197, 94] as [number, number, number],
    amber: [245, 158, 11] as [number, number, number],
    red: [239, 68, 68] as [number, number, number],
  };

  const getScoreColor = (score: number): [number, number, number] => {
    if (score >= 80) return colors.green;
    if (score >= 60) return colors.amber;
    return colors.red;
  };

  // Helper: Draw horizontal line
  const drawDivider = (y: number) => {
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + contentWidth, y);
  };

  // ===== PAGE 1: Cover & Overview =====
  
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
  doc.text('SEO Audit Report', margin, 48);

  // Date on right
  doc.setFontSize(10);
  doc.setTextColor(...colors.primary);
  doc.text(new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }), pageWidth - margin, 35, { align: 'right' });

  yPos = 75;

  // Domain title
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('SEO Audit Report', margin, yPos);
  yPos += 12;
  
  doc.setFontSize(16);
  doc.setTextColor(...colors.primary);
  doc.text(data.domain, margin, yPos);
  yPos += 20;

  drawDivider(yPos);
  yPos += 15;

  // Overall Score Circle
  const scoreColor = getScoreColor(data.overallScore);
  const circleX = pageWidth / 2;
  const circleY = yPos + 25;
  const circleRadius = 25;
  
  // Outer ring
  doc.setDrawColor(...scoreColor);
  doc.setLineWidth(4);
  doc.circle(circleX, circleY, circleRadius, 'S');
  
  // Score text
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...scoreColor);
  doc.text(String(data.overallScore), circleX, circleY + 5, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(...colors.textLight);
  doc.text('Overall Score', circleX, circleY + 15, { align: 'center' });
  doc.text('/100', circleX, circleY - 15, { align: 'center' });

  yPos += 60;

  // Key Metrics Row
  if (data.dashboardMetrics) {
    doc.setFillColor(...colors.lightBg);
    doc.roundedRect(margin, yPos, contentWidth, 50, 4, 4, 'F');
    
    const metrics = [
      { label: 'Domain Rating', value: `${data.dashboardMetrics.domainRating}/100` },
      { label: 'Organic Traffic', value: `${data.dashboardMetrics.organicTraffic.toLocaleString()}/mo` },
      { label: 'Traffic Value', value: `$${data.dashboardMetrics.trafficValue.toLocaleString()}` },
      { label: 'Backlinks', value: data.dashboardMetrics.backlinks.toLocaleString() },
    ];
    
    const metricWidth = contentWidth / 4;
    metrics.forEach((metric, i) => {
      const x = margin + (i * metricWidth) + (metricWidth / 2);
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.primary);
      doc.text(metric.value, x, yPos + 22, { align: 'center' });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.textLight);
      doc.text(metric.label, x, yPos + 32, { align: 'center' });
    });
    
    yPos += 60;
  }

  // Additional Metrics
  if (data.dashboardMetrics) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.dark);
    doc.text('Key Performance Indicators', margin, yPos);
    yPos += 12;
    
    const kpis = [
      ['Organic Keywords', data.dashboardMetrics.organicKeywords.toLocaleString()],
      ['Referring Domains', data.dashboardMetrics.referringDomains.toLocaleString()],
      ['All-Time Backlinks', data.dashboardMetrics.backlinksAllTime.toLocaleString()],
      ['All-Time Ref. Domains', data.dashboardMetrics.referringDomainsAllTime.toLocaleString()],
      ['Ahrefs Global Rank', data.dashboardMetrics.ahrefsRank > 0 ? `#${data.dashboardMetrics.ahrefsRank.toLocaleString()}` : 'N/A'],
    ];
    
    kpis.forEach((kpi, i) => {
      const bgColor = i % 2 === 0 ? colors.lightBg : colors.white;
      doc.setFillColor(...bgColor);
      doc.rect(margin, yPos, contentWidth, 10, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.text);
      doc.text(kpi[0], margin + 5, yPos + 7);
      
      doc.setFont('helvetica', 'bold');
      doc.text(kpi[1], margin + contentWidth - 5, yPos + 7, { align: 'right' });
      
      yPos += 10;
    });
    
    yPos += 10;
  }

  // Data source badge
  if (data.dashboardMetrics?.isReal) {
    doc.setFillColor(230, 245, 248);
    doc.roundedRect(margin, yPos, 80, 8, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...colors.primaryDark);
    doc.text('✓ Live Data from Ahrefs API', margin + 5, yPos + 5.5);
  }

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(...colors.textLight);
  doc.text('Page 1 of 2', pageWidth / 2, pageHeight - 10, { align: 'center' });
  doc.text('webstack.ceo', margin, pageHeight - 10);

  // ===== PAGE 2: SEO Health Scores =====
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
  doc.text(` | SEO Audit for ${data.domain}`, margin + 35, 16);

  yPos = 40;

  // SEO Health Scores Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('SEO Health Scores', margin, yPos);
  yPos += 15;

  // Category scores grid
  data.auditResults.forEach((category) => {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 30;
      
      // Mini header
      doc.setFillColor(...colors.dark);
      doc.rect(0, 0, pageWidth, 20, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.white);
      doc.text('webstack.ceo | SEO Audit (continued)', margin, 13);
    }

    // Category header
    const catScoreColor = getScoreColor(category.score);
    doc.setFillColor(...catScoreColor);
    doc.setGState(doc.GState({ opacity: 0.15 }));
    doc.roundedRect(margin, yPos, contentWidth, 14, 2, 2, 'F');
    doc.setGState(doc.GState({ opacity: 1 }));
    
    doc.setFillColor(...catScoreColor);
    doc.rect(margin, yPos, 4, 14, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.dark);
    doc.text(category.title, margin + 10, yPos + 9);
    
    // Score badge
    doc.setFontSize(11);
    doc.setTextColor(...catScoreColor);
    doc.text(`${category.score}/100`, margin + contentWidth - 5, yPos + 9, { align: 'right' });
    
    if (category.isRealData) {
      doc.setFontSize(7);
      doc.setTextColor(...colors.primary);
      doc.text('LIVE DATA', margin + contentWidth - 35, yPos + 9, { align: 'right' });
    }
    
    yPos += 18;

    // Individual checks
    category.checks.forEach((check) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 30;
      }
      
      // Status indicator
      let statusColor: [number, number, number];
      let statusSymbol: string;
      switch (check.status) {
        case 'pass':
          statusColor = colors.green;
          statusSymbol = '✓';
          break;
        case 'warning':
          statusColor = colors.amber;
          statusSymbol = '!';
          break;
        case 'fail':
          statusColor = colors.red;
          statusSymbol = '✗';
          break;
      }
      
      doc.setFillColor(...statusColor);
      doc.circle(margin + 5, yPos + 3, 3, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.white);
      doc.text(statusSymbol, margin + 3.5, yPos + 5);
      
      // Check name
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.text);
      doc.text(check.name, margin + 14, yPos + 5);
      
      // Value badge if present
      if (check.value) {
        doc.setFontSize(8);
        doc.setTextColor(...colors.textLight);
        doc.text(check.value, margin + contentWidth - 5, yPos + 5, { align: 'right' });
      }
      
      yPos += 9;
      
      // Description
      doc.setFontSize(8);
      doc.setTextColor(...colors.textLight);
      const descLines = doc.splitTextToSize(check.description, contentWidth - 20);
      doc.text(descLines, margin + 14, yPos);
      yPos += descLines.length * 4 + 4;
    });
    
    yPos += 8;
  });

  // Footer on last page
  doc.setFontSize(9);
  doc.setTextColor(...colors.textLight);
  doc.text('Page 2 of 2', pageWidth / 2, pageHeight - 10, { align: 'center' });
  doc.text('webstack.ceo', margin, pageHeight - 10);

  // CTA footer
  yPos = pageHeight - 25;
  doc.setFillColor(...colors.primary);
  doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('Ready to improve your SEO? Book a free consultation at webstack.ceo', pageWidth / 2, yPos + 8, { align: 'center' });

  // Save the PDF
  const filename = `seo-audit-${data.domain.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
