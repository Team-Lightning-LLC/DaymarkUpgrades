// Markdown Document Viewer and PDF Generator
class MarkdownViewer {
  constructor() {
    this.currentContent = '';
    this.currentTitle = '';
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Close viewer
    document.getElementById('closeViewer')?.addEventListener('click', () => {
      this.closeViewer();
    });

    // Download PDF
    document.getElementById('downloadPDF')?.addEventListener('click', () => {
      this.generatePDF();
    });

    // Click outside to close
    const dialog = document.getElementById('viewer');
    dialog?.addEventListener('click', (e) => {
      const rect = dialog.getBoundingClientRect();
      const outside = e.clientX < rect.left || e.clientX > rect.right || 
                     e.clientY < rect.top || e.clientY > rect.bottom;
      if (outside) this.closeViewer();
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dialog?.open) {
        this.closeViewer();
      }
    });
  }

  // Open formatted markdown viewer
  openViewer(markdownContent, title) {
    if (!marked || typeof marked.parse !== 'function') {
      console.error('Marked.js library not loaded');
      return;
    }

    this.currentContent = markdownContent;
    this.currentTitle = title;

    const dialog = document.getElementById('viewer');
    const titleElement = document.getElementById('viewerTitle');
    const viewerFrame = document.getElementById('viewerFrame');

    // Set title
    if (titleElement) {
      titleElement.textContent = title || 'Research Document';
    }

    try {
      // Convert markdown to HTML
      const htmlContent = marked.parse(markdownContent);
      
      // Insert formatted content
      viewerFrame.innerHTML = htmlContent;
      viewerFrame.className = 'viewer-content';

      // Show dialog
      dialog?.showModal();
    } catch (error) {
      console.error('Error rendering markdown:', error);
      viewerFrame.innerHTML = `<div class="error">Failed to render document: ${error.message}</div>`;
      dialog?.showModal();
    }
  }

  // Close viewer and reset
  closeViewer() {
    const dialog = document.getElementById('viewer');
    const viewerFrame = document.getElementById('viewerFrame');
    
    // Reset content
    if (viewerFrame) {
      viewerFrame.innerHTML = '';
      viewerFrame.className = 'viewer-content';
    }

    // Close dialog
    if (dialog?.open) {
      dialog.close();
    }

    // Clear current content
    this.currentContent = '';
    this.currentTitle = '';
  }

  // Generate PDF from current content
  async generatePDF() {
    if (!this.currentContent) {
      console.error('No content to generate PDF');
      return;
    }

    if (!window.html2pdf) {
      console.error('html2pdf library not loaded');
      return;
    }

    try {
      // Convert markdown to HTML
      const htmlContent = marked.parse(this.currentContent);
      
      // Create temporary container
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      // Apply inline styles for PDF
      this.applyInlineStyles(tempDiv);
      
      // Add to DOM temporarily
      document.body.appendChild(tempDiv);
      
      // Generate filename
      const filename = `${this.currentTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      
      // Configure PDF options
      const pdfOptions = {
        margin: 0.5,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      
      // Generate and download PDF
      await html2pdf().set(pdfOptions).from(tempDiv).save();
      
      // Clean up
      document.body.removeChild(tempDiv);
      
    } catch (error) {
      console.error('PDF generation failed:', error);
    }
  }

  // Apply inline styles for PDF generation
  applyInlineStyles(container) {
    // Base container styling
    container.style.cssText = `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2d3d;
      max-width: 900px;
      margin: 0 auto;
      padding: 30px 40px;
    `;
    
    // Headers
    container.querySelectorAll('h1').forEach(h1 => {
      h1.style.cssText = `
        font-size: 28px;
        color: #336F51;
        border-bottom: 3px solid #336F51;
        padding-bottom: 12px;
        margin: 30px 0 20px 0;
        font-weight: 700;
      `;
    });
    
    container.querySelectorAll('h2').forEach(h2 => {
      h2.style.cssText = `
        font-size: 22px;
        color: #1f2d3d;
        margin: 25px 0 15px 0;
        font-weight: 600;
        border-left: 4px solid #336F51;
        padding-left: 12px;
      `;
    });

    container.querySelectorAll('h3').forEach(h3 => {
      h3.style.cssText = `
        font-size: 18px;
        color: #1f2d3d;
        margin: 20px 0 12px 0;
        font-weight: 600;
      `;
    });
    
    // Text elements
    container.querySelectorAll('p').forEach(p => {
      p.style.cssText = 'margin-bottom: 16px; text-align: justify;';
    });
    
    container.querySelectorAll('strong').forEach(strong => {
      strong.style.cssText = 'color: #336F51; font-weight: 600;';
    });

    container.querySelectorAll('ul, ol').forEach(list => {
      list.style.cssText = 'margin: 16px 0; padding-left: 24px;';
    });

    container.querySelectorAll('li').forEach(li => {
      li.style.cssText = 'margin-bottom: 8px;';
    });
    
    // Tables
    container.querySelectorAll('table').forEach(table => {
      table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        font-size: 14px;
      `;
      
      table.querySelectorAll('th').forEach(th => {
        th.style.cssText = `
          background-color: #f8f9fb;
          border: 1px solid #e0e5ea;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
        `;
      });
      
      table.querySelectorAll('td').forEach(td => {
        td.style.cssText = `
          border: 1px solid #e0e5ea;
          padding: 10px 8px;
          text-align: left;
        `;
      });

      // Alternating row colors
      table.querySelectorAll('tr:nth-child(even)').forEach(tr => {
        tr.style.backgroundColor = '#fafbfc';
      });
    });
  }
}

// Create global instance
const markdownViewer = new MarkdownViewer();
