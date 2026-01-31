import jsPDF from 'jspdf';

interface VaultItem {
  id: string;
  title: string;
  report_type: string;
  summary: string | null;
  content: unknown;
  tags: string[] | null;
  is_favorite: boolean | null;
  created_at: string;
  domain: string | null;
}

// Generate a PDF from a vault item
export const generateVaultPDF = async (item: VaultItem) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;

  // Helper function to add text with word wrap
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number = 6): number => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + lines.length * lineHeight;
  };

  // Header with gradient effect simulation
  doc.setFillColor(20, 20, 30);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SEO Vault Report', margin, yPos + 5);
  
  // Report type badge
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const reportType = item.report_type.replace(/_/g, ' ').toUpperCase();
  doc.text(reportType, margin, yPos + 15);
  
  // Domain
  if (item.domain) {
    doc.setFontSize(11);
    doc.text(`Domain: ${item.domain}`, margin, yPos + 25);
  }
  
  // Date
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated: ${new Date(item.created_at).toLocaleString()}`, pageWidth - margin - 50, yPos + 5);
  
  yPos = 55;
  
  // Report Title
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  yPos = addWrappedText(item.title, margin, yPos, contentWidth, 7);
  yPos += 10;
  
  // Summary section
  if (item.summary) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    yPos = addWrappedText(item.summary, margin, yPos, contentWidth, 5);
    yPos += 10;
  }
  
  // Content section
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Report Details', margin, yPos);
  yPos += 8;
  
  // Parse and render content
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  
  const content = item.content;
  if (content && typeof content === 'object') {
    const renderObject = (obj: Record<string, unknown>, indent: number = 0): void => {
      for (const [key, value] of Object.entries(obj)) {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        if (Array.isArray(value)) {
          doc.setFont('helvetica', 'bold');
          doc.text(`${formattedKey}:`, margin + indent, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          
          value.forEach((item, index) => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            
            if (typeof item === 'object' && item !== null) {
              const itemStr = JSON.stringify(item, null, 2)
                .replace(/[{}"]/g, '')
                .split('\n')
                .filter(l => l.trim())
                .join(', ');
              yPos = addWrappedText(`• ${itemStr}`, margin + indent + 5, yPos, contentWidth - indent - 10, 5);
              yPos += 2;
            } else {
              yPos = addWrappedText(`• ${String(item)}`, margin + indent + 5, yPos, contentWidth - indent - 10, 5);
              yPos += 2;
            }
          });
          yPos += 3;
        } else if (typeof value === 'object' && value !== null) {
          doc.setFont('helvetica', 'bold');
          doc.text(`${formattedKey}:`, margin + indent, yPos);
          yPos += 6;
          renderObject(value as Record<string, unknown>, indent + 10);
        } else if (value !== null && value !== undefined) {
          const text = `${formattedKey}: ${String(value)}`;
          yPos = addWrappedText(text, margin + indent, yPos, contentWidth - indent, 5);
          yPos += 3;
        }
      }
    };
    
    renderObject(content as Record<string, unknown>);
  } else if (typeof content === 'string') {
    // If content is a string (like markdown), render it as text
    const lines = content.split('\n');
    for (const line of lines) {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      // Handle markdown headers
      if (line.startsWith('## ')) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        yPos = addWrappedText(line.replace('## ', ''), margin, yPos, contentWidth, 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        yPos += 4;
      } else if (line.startsWith('# ')) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        yPos = addWrappedText(line.replace('# ', ''), margin, yPos, contentWidth, 7);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        yPos += 5;
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        yPos = addWrappedText(`• ${line.slice(2)}`, margin + 5, yPos, contentWidth - 5, 5);
        yPos += 2;
      } else if (line.trim()) {
        yPos = addWrappedText(line, margin, yPos, contentWidth, 5);
        yPos += 2;
      } else {
        yPos += 3;
      }
    }
  }
  
  // Tags footer
  if (item.tags && item.tags.length > 0) {
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
    
    yPos += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Tags: ${item.tags.join(', ')}`, margin, yPos);
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Webstack.ceo SEO Vault • Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Generate filename
  const filename = `${item.domain || 'report'}-${item.report_type}-${new Date(item.created_at).toISOString().split('T')[0]}.pdf`;
  
  // Save the PDF
  doc.save(filename);
  
  return filename;
};
