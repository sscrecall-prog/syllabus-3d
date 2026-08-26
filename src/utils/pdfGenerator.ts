/**
 * Academic Notes PDF Generator & Viewer
 * Converts topic notes into a structured, printable Academic PDF document
 * and opens it in a new Chrome tab with instant print/save PDF capability.
 */

interface GeneratePdfOptions {
  topicName: string;
  subjectName?: string;
  chapterName?: string;
  examName?: string;
  notes: string;
  autoPrint?: boolean;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseMarkdownToPrintableHtml(markdown: string): string {
  if (!markdown || !markdown.trim()) {
    return '<p class="empty-notice">No notes written for this topic yet.</p>';
  }

  const lines = markdown.split('\n');
  const htmlParts: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Callout block (> [!TYPE] ...)
    if (line.trim().startsWith('> [!')) {
      const match = line.trim().match(/^>\s*\[!([A-Z]+)\]/i);
      const calloutType = match ? match[1].toUpperCase() : 'NOTE';
      const calloutLines: string[] = [];

      while (i < lines.length && lines[i].trim().startsWith('>')) {
        const l = lines[i].trim().replace(/^>\s*/, '');
        if (!l.startsWith('[!')) {
          calloutLines.push(l);
        }
        i++;
      }

      let typeClass = 'callout-note';
      let title = 'NOTE';
      let icon = 'ℹ️';

      if (calloutType === 'FORMULA' || calloutType === 'MATH') {
        typeClass = 'callout-formula';
        title = 'KEY FORMULA & CONCEPT';
        icon = '∑';
      } else if (calloutType === 'TIP' || calloutType === 'SHORTCUT') {
        typeClass = 'callout-tip';
        title = 'EXAM PRO-TIP & SHORTCUT';
        icon = '⚡';
      } else if (calloutType === 'WARNING' || calloutType === 'TRAP') {
        typeClass = 'callout-trap';
        title = 'COMMON EXAM TRAP TO AVOID';
        icon = '⚠️';
      } else if (calloutType === 'RULE' || calloutType === 'KEY') {
        typeClass = 'callout-rule';
        title = 'GOLDEN RULE & DEFINITION';
        icon = '📖';
      }

      htmlParts.push(`
        <div class="callout ${typeClass}">
          <div class="callout-header">
            <span class="callout-icon">${icon}</span>
            <span class="callout-title">${escapeHtml(title)}</span>
          </div>
          <div class="callout-body">
            ${calloutLines.map(cl => `<p>${escapeHtml(cl)}</p>`).join('')}
          </div>
        </div>
      `);
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      htmlParts.push(`<h1 class="note-h1">${escapeHtml(line.replace('# ', ''))}</h1>`);
    } else if (line.startsWith('## ')) {
      htmlParts.push(`<h2 class="note-h2">${escapeHtml(line.replace('## ', ''))}</h2>`);
    } else if (line.startsWith('### ')) {
      htmlParts.push(`<h3 class="note-h3">${escapeHtml(line.replace('### ', ''))}</h3>`);
    }
    // Checklists
    else if (line.trim().startsWith('- [ ] ') || line.trim().startsWith('- [x] ')) {
      const isDone = line.trim().startsWith('- [x] ');
      const text = line.trim().substring(6);
      htmlParts.push(`
        <div class="checklist-item ${isDone ? 'checked' : ''}">
          <span class="checkbox">${isDone ? '☑' : '☐'}</span>
          <span class="task-text">${escapeHtml(text)}</span>
        </div>
      `);
    }
    // Bullet list
    else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      htmlParts.push(`
        <div class="bullet-item">
          <span class="bullet">•</span>
          <span class="bullet-text">${escapeHtml(line.trim().substring(2))}</span>
        </div>
      `);
    }
    // Horizontal Rule
    else if (line.trim() === '---' || line.trim() === '***') {
      htmlParts.push('<hr class="divider" />');
    }
    // Empty line
    else if (line.trim() === '') {
      htmlParts.push('<div class="spacer"></div>');
    }
    // Regular paragraph
    else {
      // Parse inline bold/italic
      let formatted = escapeHtml(line);
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
      htmlParts.push(`<p class="note-p">${formatted}</p>`);
    }

    i++;
  }

  return htmlParts.join('\n');
}

/**
 * Generates an Academic Notes PDF document and opens it in a new tab in Chrome.
 */
export function generateAndOpenNotesPdf(options: GeneratePdfOptions): void {
  const {
    topicName,
    subjectName = 'Subject',
    chapterName = 'Chapter',
    examName = 'SSC CGL 2026',
    notes,
    autoPrint = true
  } = options;

  const contentHtml = parseMarkdownToPrintableHtml(notes);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(topicName)} - Academic Notes PDF</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

    @page {
      size: A4;
      margin: 14mm 16mm 14mm 16mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #F8F9FA;
      color: #1A1A1A;
      line-height: 1.6;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Floating Action Bar (hidden when printing) */
    .action-bar {
      position: sticky;
      top: 0;
      left: 0;
      right: 0;
      background: #11120F;
      color: #FFFFFF;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 1000;
    }

    .action-bar .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: 700;
      color: #D4AF37;
      font-family: 'Cinzel', Georgia, serif;
    }

    .action-bar .actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-print {
      background: linear-gradient(135deg, #D4AF37 0%, #C9A22E 100%);
      color: #11120F;
      border: none;
      padding: 8px 18px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 8px rgba(212, 175, 55, 0.4);
      transition: transform 0.1s ease;
    }

    .btn-print:hover {
      transform: scale(1.02);
    }

    .btn-close {
      background: rgba(255,255,255,0.1);
      color: #E2E8F0;
      border: 1px solid rgba(255,255,255,0.2);
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    /* Page Container */
    .page-container {
      max-width: 820px;
      margin: 24px auto;
      background: #FFFFFF;
      padding: 40px 48px;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
      border: 1px solid #E2E8F0;
    }

    /* Academic Header */
    .doc-header {
      border-bottom: 2.5px solid #11120F;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .exam-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      background: #11120F;
      color: #D4AF37;
      padding: 4px 10px;
      border-radius: 6px;
    }

    .doc-date {
      font-size: 12px;
      color: #64748B;
      font-weight: 500;
    }

    .hierarchy-path {
      font-size: 12px;
      font-weight: 700;
      color: #596B35;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .topic-title {
      font-size: 28px;
      font-weight: 800;
      color: #11120F;
      letter-spacing: -0.5px;
      line-height: 1.25;
    }

    /* Headings */
    .note-h1 {
      font-size: 20px;
      font-weight: 800;
      color: #11120F;
      margin-top: 24px;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1.5px solid #E2E8F0;
      letter-spacing: -0.3px;
    }

    .note-h2 {
      font-size: 16px;
      font-weight: 700;
      color: #334155;
      margin-top: 18px;
      margin-bottom: 8px;
    }

    .note-h3 {
      font-size: 13px;
      font-weight: 700;
      color: #596B35;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 14px;
      margin-bottom: 6px;
    }

    .note-p {
      font-size: 13.5px;
      color: #2D3748;
      margin-bottom: 8px;
      line-height: 1.7;
    }

    /* Callout Cards */
    .callout {
      margin: 16px 0;
      padding: 14px 18px;
      border-radius: 12px;
      border-left: 4px solid #3B82F6;
      background: #F8FAFC;
    }

    .callout-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 800;
      font-size: 11px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }

    .callout-icon {
      font-size: 14px;
    }

    .callout-body p {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.5px;
      line-height: 1.6;
      margin-bottom: 4px;
    }

    .callout-body p:last-child {
      margin-bottom: 0;
    }

    .callout-formula {
      border-left-color: #8B5CF6;
      background: #FAF5FF;
      color: #581C87;
    }
    .callout-formula .callout-header {
      color: #7C3AED;
    }

    .callout-tip {
      border-left-color: #10B981;
      background: #ECFDF5;
      color: #064E3B;
    }
    .callout-tip .callout-header {
      color: #059669;
    }

    .callout-trap {
      border-left-color: #EF4444;
      background: #FEF2F2;
      color: #7F1D1D;
    }
    .callout-trap .callout-header {
      color: #DC2626;
    }

    .callout-rule {
      border-left-color: #6366F1;
      background: #EEF2FF;
      color: #312E81;
    }
    .callout-rule .callout-header {
      color: #4F46E5;
    }

    /* Checklist */
    .checklist-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 6px 0;
      font-size: 13px;
      color: #1F2937;
    }

    .checklist-item .checkbox {
      font-size: 16px;
      line-height: 1;
      color: #64748B;
    }

    .checklist-item.checked .checkbox {
      color: #10B981;
    }

    .checklist-item.checked .task-text {
      text-decoration: line-through;
      color: #94A3B8;
    }

    /* Bullet items */
    .bullet-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 6px;
      font-size: 13.5px;
      color: #334155;
    }

    .bullet-item .bullet {
      color: #596B35;
      font-weight: bold;
    }

    .divider {
      border: none;
      border-top: 1px solid #E2E8F0;
      margin: 20px 0;
    }

    .spacer {
      height: 12px;
    }

    /* Document Footer */
    .doc-footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #E2E8F0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #94A3B8;
      font-family: 'JetBrains Mono', monospace;
    }

    /* Print Specific Media Rules */
    @media print {
      body {
        background: #FFFFFF !important;
      }
      .action-bar {
        display: none !important;
      }
      .page-container {
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body>

  <!-- Floating Action Toolbar for the student -->
  <div class="action-bar">
    <div class="brand">
      <span>✦ SYLLABUS 3D</span>
      <span style="opacity:0.6;font-size:12px">• Academic Master Notes</span>
    </div>
    <div class="actions">
      <button class="btn-print" onclick="window.print()">
        🖨️ Save as PDF / Print
      </button>
      <button class="btn-close" onclick="window.close()">
        ✕ Close
      </button>
    </div>
  </div>

  <!-- Main Document Container -->
  <div class="page-container">
    
    <!-- Academic Header -->
    <div class="doc-header">
      <div class="header-top">
        <span class="exam-tag">${escapeHtml(examName)}</span>
        <span class="doc-date">Generated: ${escapeHtml(dateStr)} • ${escapeHtml(timeStr)}</span>
      </div>
      <div class="hierarchy-path">${escapeHtml(subjectName)} &gt; ${escapeHtml(chapterName)}</div>
      <h1 class="topic-title">${escapeHtml(topicName)}</h1>
    </div>

    <!-- Notes Content -->
    <div class="doc-body">
      ${contentHtml}
    </div>

    <!-- Academic Footer -->
    <div class="doc-footer">
      <span>SYLLABUS 3D • Academic Mastery System</span>
      <span>Confidential Study Material • ${escapeHtml(examName)}</span>
    </div>

  </div>

  <script>
    // Auto-trigger print dialog if requested
    ${autoPrint ? `
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 400);
    });
    ` : ''}
  </script>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);

  const newTab = window.open(blobUrl, '_blank');
  if (newTab) {
    newTab.focus();
  } else {
    // If popup blocked
    const a = document.createElement('a');
    a.href = blobUrl;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
