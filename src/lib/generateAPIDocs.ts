import jsPDF from 'jspdf';

export const generateAPIDocs = async () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;

  // Brand colors
  const colors = {
    primary: [0, 188, 212] as [number, number, number],
    accent: [139, 92, 246] as [number, number, number],
    dark: [15, 23, 42] as [number, number, number],
    text: [51, 51, 51] as [number, number, number],
    textLight: [100, 100, 100] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    lightBg: [248, 250, 252] as [number, number, number],
    code: [30, 41, 59] as [number, number, number],
    success: [34, 197, 94] as [number, number, number],
    warning: [234, 179, 8] as [number, number, number],
  };

  // Helper: Draw decorative circle
  const drawCircle = (x: number, y: number, r: number, color: [number, number, number], alpha: number = 1) => {
    doc.setFillColor(...color);
    doc.setGState(doc.GState({ opacity: alpha }));
    doc.circle(x, y, r, 'F');
    doc.setGState(doc.GState({ opacity: 1 }));
  };

  // Helper: Draw code block
  const drawCodeBlock = (x: number, y: number, width: number, height: number, code: string[]) => {
    doc.setFillColor(...colors.code);
    doc.roundedRect(x, y, width, height, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setFont('courier', 'normal');
    doc.setTextColor(...colors.white);
    let codeY = y + 6;
    code.forEach(line => {
      doc.text(line, x + 5, codeY);
      codeY += 5;
    });
    doc.setFont('helvetica', 'normal');
    return y + height;
  };

  // Helper: Draw table row
  const drawTableRow = (y: number, cols: string[], isHeader: boolean = false, colWidths: number[] = []) => {
    const defaultWidths = [50, 120];
    const widths = colWidths.length ? colWidths : defaultWidths;
    
    if (isHeader) {
      doc.setFillColor(...colors.dark);
      doc.rect(margin, y - 5, contentWidth, 8, 'F');
      doc.setTextColor(...colors.white);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFillColor(...colors.lightBg);
      doc.rect(margin, y - 5, contentWidth, 8, 'F');
      doc.setTextColor(...colors.text);
      doc.setFont('helvetica', 'normal');
    }
    
    doc.setFontSize(8);
    let xPos = margin + 3;
    cols.forEach((col, i) => {
      doc.text(col, xPos, y);
      xPos += widths[i] || 50;
    });
    
    return y + 8;
  };

  // Helper: Check page break
  const checkPageBreak = (neededHeight: number) => {
    if (yPos + neededHeight > pageHeight - 30) {
      doc.addPage();
      yPos = 25;
      return true;
    }
    return false;
  };

  // ===== PAGE 1: Cover =====
  
  // Background decorative elements
  drawCircle(180, 30, 40, colors.primary, 0.1);
  drawCircle(30, 250, 60, colors.accent, 0.08);
  drawCircle(190, 280, 30, colors.primary, 0.05);

  // Header bar
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 60, 'F');
  
  // Title
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('Visitor Intelligence API', margin, 35);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.primary);
  doc.text('Complete Developer Documentation', margin, 48);
  
  // Version badge
  doc.setFillColor(...colors.primary);
  doc.roundedRect(pageWidth - 45, 30, 30, 12, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setTextColor(...colors.white);
  doc.text('v1.0', pageWidth - 38, 38);
  
  yPos = 80;
  
  // Introduction
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('Overview', margin, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.text);
  const introText = doc.splitTextToSize(
    'The Visitor Intelligence API provides comprehensive access to website analytics, visitor tracking, lead management, and SEO domain audit functionality. This RESTful API enables seamless integration with external dashboards and applications.',
    contentWidth
  );
  doc.text(introText, margin, yPos);
  yPos += introText.length * 5 + 10;
  
  // Base URL
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('Base URL', margin, yPos);
  yPos += 8;
  
  yPos = drawCodeBlock(margin, yPos, contentWidth, 15, [
    'https://qwnzenimkwtuaqnrcygb.supabase.co/functions/v1/visitor-intelligence-api'
  ]);
  yPos += 15;
  
  // Authentication
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('Authentication', margin, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.text);
  doc.text('All requests require API key authentication via headers:', margin, yPos);
  yPos += 8;
  
  yPos = drawCodeBlock(margin, yPos, contentWidth, 25, [
    'x-api-key: YOUR_API_KEY',
    '// OR',
    'Authorization: Bearer YOUR_API_KEY'
  ]);
  yPos += 15;
  
  // Common Parameters
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('Common Query Parameters', margin, yPos);
  yPos += 10;
  
  yPos = drawTableRow(yPos, ['Parameter', 'Description'], true);
  yPos = drawTableRow(yPos, ['action', 'API action to perform (required)']);
  yPos = drawTableRow(yPos, ['days', 'Number of days to query (default: 7, max: 365)']);
  yPos = drawTableRow(yPos, ['limit', 'Results per page (default: 100, max: 1000)']);
  yPos = drawTableRow(yPos, ['page', 'Page number for pagination (default: 1)']);
  
  // ===== PAGE 2: Visitor Intelligence Endpoints =====
  doc.addPage();
  yPos = 25;
  
  // Header
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('Visitor Intelligence Endpoints', margin, 14);
  
  yPos = 35;
  
  // Endpoint definitions
  const visitorEndpoints = [
    {
      action: 'summary',
      method: 'GET',
      desc: 'Get comprehensive dashboard summary with metrics, funnel stats, and referrer breakdown.',
      params: ['days'],
      response: 'metrics, funnel, referrers objects'
    },
    {
      action: 'sessions',
      method: 'GET',
      desc: 'List all visitor sessions with pagination.',
      params: ['days', 'limit', 'page'],
      response: 'Array of session objects with pagination'
    },
    {
      action: 'active-sessions',
      method: 'GET',
      desc: 'Get currently active visitors (last 5 minutes).',
      params: ['limit', 'page'],
      response: 'Array of active session objects'
    },
    {
      action: 'page-views',
      method: 'GET',
      desc: 'List all page views with timestamps and engagement data.',
      params: ['days', 'limit', 'page'],
      response: 'Array of page view objects'
    },
    {
      action: 'page-stats',
      method: 'GET',
      desc: 'Aggregated statistics per page (views, avg time, scroll depth).',
      params: ['days', 'limit'],
      response: 'Array of page stat objects'
    },
    {
      action: 'tool-interactions',
      method: 'GET',
      desc: 'List all tool/widget interactions.',
      params: ['days', 'limit', 'page'],
      response: 'Array of interaction objects'
    },
    {
      action: 'tool-stats',
      method: 'GET',
      desc: 'Aggregated tool usage statistics.',
      params: ['days', 'limit'],
      response: 'Array of tool stat objects'
    },
  ];

  visitorEndpoints.forEach((endpoint) => {
    checkPageBreak(35);
    
    // Endpoint header
    doc.setFillColor(...colors.lightBg);
    doc.roundedRect(margin, yPos - 4, contentWidth, 30, 2, 2, 'F');
    
    // Method badge
    doc.setFillColor(...colors.success);
    doc.roundedRect(margin + 3, yPos, 18, 6, 1, 1, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.white);
    doc.text(endpoint.method, margin + 6, yPos + 4.5);
    
    // Action name
    doc.setFontSize(10);
    doc.setFont('courier', 'bold');
    doc.setTextColor(...colors.dark);
    doc.text(`?action=${endpoint.action}`, margin + 25, yPos + 4);
    
    // Description
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textLight);
    const descLines = doc.splitTextToSize(endpoint.desc, contentWidth - 10);
    doc.text(descLines, margin + 5, yPos + 12);
    
    // Params
    doc.setFontSize(7);
    doc.setTextColor(...colors.accent);
    doc.text(`Params: ${endpoint.params.join(', ')}`, margin + 5, yPos + 22);
    
    yPos += 35;
  });

  // ===== PAGE 3: Leads & Sessions =====
  doc.addPage();
  yPos = 25;
  
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('Leads & Session Endpoints', margin, 14);
  
  yPos = 35;

  const leadEndpoints = [
    {
      action: 'leads',
      method: 'GET',
      desc: 'List all leads with optional status filtering.',
      params: ['days', 'limit', 'page', 'status (open|closed|all)'],
      response: 'Array of lead objects with contact info, company data'
    },
    {
      action: 'lead-funnel',
      method: 'GET',
      desc: 'Get lead funnel breakdown by stage and qualification step.',
      params: ['days'],
      response: 'Funnel object with stage counts, qualification breakdown'
    },
    {
      action: 'daily-stats',
      method: 'GET',
      desc: 'Daily breakdown of sessions, page views, and leads.',
      params: ['days'],
      response: 'Array of daily stat objects'
    },
    {
      action: 'session-detail',
      method: 'GET',
      desc: 'Get full session journey with all page views and interactions.',
      params: ['session_id (required)'],
      response: 'Session object with pageViews and toolInteractions arrays'
    },
  ];

  leadEndpoints.forEach((endpoint) => {
    checkPageBreak(35);
    
    doc.setFillColor(...colors.lightBg);
    doc.roundedRect(margin, yPos - 4, contentWidth, 30, 2, 2, 'F');
    
    doc.setFillColor(...colors.success);
    doc.roundedRect(margin + 3, yPos, 18, 6, 1, 1, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.white);
    doc.text(endpoint.method, margin + 6, yPos + 4.5);
    
    doc.setFontSize(10);
    doc.setFont('courier', 'bold');
    doc.setTextColor(...colors.dark);
    doc.text(`?action=${endpoint.action}`, margin + 25, yPos + 4);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textLight);
    const descLines = doc.splitTextToSize(endpoint.desc, contentWidth - 10);
    doc.text(descLines, margin + 5, yPos + 12);
    
    doc.setFontSize(7);
    doc.setTextColor(...colors.accent);
    doc.text(`Params: ${endpoint.params.join(', ')}`, margin + 5, yPos + 22);
    
    yPos += 35;
  });

  // ===== PAGE 4: Domain Audit Endpoints =====
  doc.addPage();
  yPos = 25;
  
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('Domain Audit Endpoints', margin, 14);
  
  yPos = 35;

  const auditEndpoints = [
    {
      action: 'audit-domain',
      method: 'GET',
      desc: 'Perform live SEO audit using Ahrefs API. Returns domain rating, traffic, backlinks, and 2-year history.',
      params: ['domain (required)'],
      response: 'ahrefs metrics object, history array'
    },
    {
      action: 'audit-full',
      method: 'GET',
      desc: 'Perform full audit: fetch live Ahrefs data and save to database.',
      params: ['domain (required)', 'email (optional)'],
      response: 'Saved audit object with live metrics'
    },
    {
      action: 'audit-list',
      method: 'GET',
      desc: 'List all saved audits with pagination and filtering.',
      params: ['category', 'search', 'limit', 'page'],
      response: 'Array of saved audit objects'
    },
    {
      action: 'audit-get',
      method: 'GET',
      desc: 'Get a specific saved audit by domain or slug.',
      params: ['domain OR slug (one required)'],
      response: 'Single audit object'
    },
    {
      action: 'audit-save',
      method: 'POST',
      desc: 'Save or update an audit record. Requires JSON body.',
      params: ['JSON body with domain + audit fields'],
      response: 'Saved audit object'
    },
    {
      action: 'audit-stats',
      method: 'GET',
      desc: 'Get aggregate statistics across all saved audits.',
      params: [],
      response: 'Stats object with averages, totals, category breakdown'
    },
    {
      action: 'audit-categories',
      method: 'GET',
      desc: 'List all audit categories with counts.',
      params: [],
      response: 'Array of category objects'
    },
  ];

  auditEndpoints.forEach((endpoint) => {
    checkPageBreak(35);
    
    doc.setFillColor(...colors.lightBg);
    doc.roundedRect(margin, yPos - 4, contentWidth, 30, 2, 2, 'F');
    
    const methodColor = endpoint.method === 'POST' ? colors.warning : colors.success;
    doc.setFillColor(...methodColor);
    doc.roundedRect(margin + 3, yPos, 18, 6, 1, 1, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.white);
    doc.text(endpoint.method, margin + (endpoint.method === 'POST' ? 5 : 6), yPos + 4.5);
    
    doc.setFontSize(10);
    doc.setFont('courier', 'bold');
    doc.setTextColor(...colors.dark);
    doc.text(`?action=${endpoint.action}`, margin + 25, yPos + 4);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textLight);
    const descLines = doc.splitTextToSize(endpoint.desc, contentWidth - 10);
    doc.text(descLines, margin + 5, yPos + 12);
    
    doc.setFontSize(7);
    doc.setTextColor(...colors.accent);
    const paramText = endpoint.params.length ? endpoint.params.join(', ') : 'None';
    doc.text(`Params: ${paramText}`, margin + 5, yPos + 22);
    
    yPos += 35;
  });

  // ===== PAGE 5: Code Examples =====
  doc.addPage();
  yPos = 25;
  
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('Code Examples', margin, 14);
  
  yPos = 35;
  
  // PHP Example
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('PHP Example', margin, yPos);
  yPos += 8;
  
  yPos = drawCodeBlock(margin, yPos, contentWidth, 55, [
    '<?php',
    '$apiKey = "YOUR_API_KEY";',
    '$baseUrl = "https://qwnzenimkwtuaqnrcygb.supabase.co',
    '           /functions/v1/visitor-intelligence-api";',
    '',
    '$ch = curl_init($baseUrl . "?action=summary&days=7");',
    'curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);',
    'curl_setopt($ch, CURLOPT_HTTPHEADER, [',
    '    "x-api-key: " . $apiKey',
    ']);',
    '$response = json_decode(curl_exec($ch), true);'
  ]);
  yPos += 15;
  
  // JavaScript Example
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('JavaScript Example', margin, yPos);
  yPos += 8;
  
  yPos = drawCodeBlock(margin, yPos, contentWidth, 45, [
    'const response = await fetch(',
    '  "https://qwnzenimkwtuaqnrcygb.supabase.co' +
    '/functions/v1/visitor-intelligence-api?action=audit-domain&domain=example.com",',
    '  {',
    '    headers: { "x-api-key": "YOUR_API_KEY" }',
    '  }',
    ');',
    'const data = await response.json();'
  ]);
  yPos += 15;
  
  // Response Format
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('Response Format', margin, yPos);
  yPos += 8;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.text);
  doc.text('All responses return JSON with this structure:', margin, yPos);
  yPos += 8;
  
  yPos = drawCodeBlock(margin, yPos, contentWidth, 40, [
    '{',
    '  "success": true,',
    '  "data": [...],        // or object depending on action',
    '  "pagination": {       // for paginated endpoints',
    '    "page": 1, "limit": 100, "total": 500, "totalPages": 5',
    '  }',
    '}'
  ]);

  // ===== PAGE 6: Data Models =====
  doc.addPage();
  yPos = 25;
  
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('Data Models', margin, 14);
  
  yPos = 35;
  
  // Session Model
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('VisitorSession', margin, yPos);
  yPos += 8;
  
  yPos = drawTableRow(yPos, ['Field', 'Type', 'Description'], true, [40, 35, 95]);
  yPos = drawTableRow(yPos, ['id', 'string', 'Unique session UUID'], false, [40, 35, 95]);
  yPos = drawTableRow(yPos, ['session_id', 'string', 'Client-generated session identifier'], false, [40, 35, 95]);
  yPos = drawTableRow(yPos, ['first_page', 'string', 'Entry page path'], false, [40, 35, 95]);
  yPos = drawTableRow(yPos, ['referrer', 'string', 'Traffic source URL'], false, [40, 35, 95]);
  yPos = drawTableRow(yPos, ['started_at', 'timestamp', 'Session start time'], false, [40, 35, 95]);
  yPos = drawTableRow(yPos, ['last_activity_at', 'timestamp', 'Last activity time'], false, [40, 35, 95]);
  yPos = drawTableRow(yPos, ['user_agent', 'string', 'Browser user agent'], false, [40, 35, 95]);
  yPos += 10;
  
  // Lead Model
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('Lead', margin, yPos);
  yPos += 8;
  
  yPos = drawTableRow(yPos, ['Field', 'Type', 'Description'], true, [45, 30, 95]);
  yPos = drawTableRow(yPos, ['id', 'string', 'Unique lead UUID'], false, [45, 30, 95]);
  yPos = drawTableRow(yPos, ['email', 'string', 'Lead email address'], false, [45, 30, 95]);
  yPos = drawTableRow(yPos, ['phone', 'string', 'Phone number (optional)'], false, [45, 30, 95]);
  yPos = drawTableRow(yPos, ['full_name', 'string', 'Contact name (optional)'], false, [45, 30, 95]);
  yPos = drawTableRow(yPos, ['domain', 'string', 'Website domain'], false, [45, 30, 95]);
  yPos = drawTableRow(yPos, ['funnel_stage', 'string', 'Current pipeline stage'], false, [45, 30, 95]);
  yPos = drawTableRow(yPos, ['status', 'string', 'open or closed'], false, [45, 30, 95]);
  yPos = drawTableRow(yPos, ['closed_amount', 'number', 'Revenue if closed'], false, [45, 30, 95]);
  yPos += 10;
  
  // Ahrefs Model
  checkPageBreak(80);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('AhrefsMetrics (from audit-domain)', margin, yPos);
  yPos += 8;
  
  yPos = drawTableRow(yPos, ['Field', 'Type', 'Description'], true, [50, 30, 90]);
  yPos = drawTableRow(yPos, ['domainRating', 'number', 'Domain Rating (0-100)'], false, [50, 30, 90]);
  yPos = drawTableRow(yPos, ['ahrefsRank', 'number', 'Global Ahrefs rank'], false, [50, 30, 90]);
  yPos = drawTableRow(yPos, ['backlinks', 'number', 'Live backlink count'], false, [50, 30, 90]);
  yPos = drawTableRow(yPos, ['referringDomains', 'number', 'Unique referring domains'], false, [50, 30, 90]);
  yPos = drawTableRow(yPos, ['organicTraffic', 'number', 'Monthly organic traffic'], false, [50, 30, 90]);
  yPos = drawTableRow(yPos, ['organicKeywords', 'number', 'Ranking keywords count'], false, [50, 30, 90]);
  yPos = drawTableRow(yPos, ['trafficValue', 'number', 'Traffic value in USD'], false, [50, 30, 90]);

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textLight);
    doc.text(`Webstack.ceo API Documentation | Page ${i} of ${totalPages}`, margin, pageHeight - 10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 55, pageHeight - 10);
  }

  // Save
  doc.save('visitor-intelligence-api-documentation.pdf');
};

export default generateAPIDocs;
