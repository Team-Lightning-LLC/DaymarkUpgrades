// Markdown Document Viewer and PDF Generator with Chat
class MarkdownViewer {
  constructor() {
    this.currentContent = '';
    this.currentTitle = '';
    this.currentDocId = null;
    this.chatOpen = false;
    this.chatMessages = [];
    this.activeChatJob = null;
    this.chatPollTimer = null;
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

    // Toggle chat
    document.getElementById('chatToggle')?.addEventListener('click', () => {
      this.toggleChat();
    });

    // Send chat message
    document.getElementById('chatSend')?.addEventListener('click', () => {
      this.sendMessage();
    });

    // Enter to send (Shift+Enter for new line)
    document.getElementById('chatInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
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
  openViewer(markdownContent, title, docId) {
    if (!marked || typeof marked.parse !== 'function') {
      console.error('Marked.js library not loaded');
      return;
    }

    this.currentContent = markdownContent;
    this.currentTitle = title;
    this.currentDocId = docId;
    this.chatMessages = [];
    this.chatOpen = false;

    const dialog = document.getElementById('viewer');
    const titleElement = document.getElementById('viewerTitle');
    const viewerFrame = document.getElementById('viewerFrame');
    const container = document.querySelector('.viewer-container');
    const chatToggle = document.getElementById('chatToggle');

    // Set title
    if (titleElement) {
      titleElement.textContent = title || 'Research Document';
    }

    // Reset chat state
    if (container) {
      container.classList.remove('chat-open');
    }
    if (chatToggle) {
      chatToggle.classList.remove('active');
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

  // Toggle chat panel
  toggleChat() {
    this.chatOpen = !this.chatOpen;
    
    const container = document.querySelector('.viewer-container');
    const chatToggle = document.getElementById('chatToggle');
    const chatDocTitle = document.getElementById('chatDocTitle');
    const chatMessages = document.getElementById('chatMessages');
    
    if (this.chatOpen) {
      container?.classList.add('chat-open');
      chatToggle?.classList.add('active');
      
      // Update chat title
      if (chatDocTitle) {
        chatDocTitle.textContent = this.currentTitle;
      }
      
      // Show empty state if no messages
      if (this.chatMessages.length === 0) {
        this.showChatEmptyState();
      } else {
        this.renderChatMessages();
      }
      
    } else {
      container?.classList.remove('chat-open');
      chatToggle?.classList.remove('active');
    }
  }

  // Show empty state in chat
  showChatEmptyState() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    chatMessages.innerHTML = `
      <div class="chat-empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <p>Ask questions about this document to get deeper insights</p>
      </div>
    `;
  }

  // Send chat message
  async sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    if (!chatInput) return;
    
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    this.addMessage('user', message);
    
    // Clear input and disable
    chatInput.value = '';
    chatInput.disabled = true;
    if (chatSend) chatSend.disabled = true;
    
    // Add thinking indicator
    this.addThinkingMessage();
    
    try {
      // Build conversation history (exclude the message we just added)
      const history = this.chatMessages.slice(0, -1).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Send to API with conversation history
      const jobResponse = await vertesiaAPI.chatWithDocument({
        document_id: this.currentDocId,
        question: message,
        conversation_history: history
      });
      
      this.activeChatJob = {
        runId: jobResponse.runId,
        startTime: Date.now()
      };
      
      // Start polling for result
      this.startChatPolling();
      
    } catch (error) {
      console.error('Chat error:', error);
      this.removeThinkingMessage();
      this.addMessage('assistant', 'Sorry, there was an error processing your question.');
      
      // Re-enable input
      chatInput.disabled = false;
      if (chatSend) chatSend.disabled = false;
      chatInput.focus();
    }
  }

  // Add thinking indicator
  addThinkingMessage() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'chat-message assistant thinking';
    thinkingDiv.id = 'thinking-indicator';
    thinkingDiv.innerHTML = `
      <div class="chat-message-bubble">
        <div class="thinking-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    
    chatMessages.appendChild(thinkingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Remove thinking indicator
  removeThinkingMessage() {
    const thinking = document.getElementById('thinking-indicator');
    if (thinking) thinking.remove();
  }

  // Start polling for chat result
  startChatPolling() {
    let pollCount = 0;
    const maxPolls = 30; // 30 polls * 2 seconds = 60 seconds max
    
    this.chatPollTimer = setInterval(async () => {
      pollCount++;
      
      try {
        const status = await vertesiaAPI.getChatJobStatus(this.activeChatJob.runId);
        
        if (status.status === 'completed' || status.status === 'success') {
          // Get result
          const result = await vertesiaAPI.getChatJobResult(this.activeChatJob.runId);
          
          this.removeThinkingMessage();
          this.addMessage('assistant', result.answer || result.output || 'Response received.');
          
          this.stopChatPolling();
          this.reEnableInput();
          
        } else if (status.status === 'failed' || status.status === 'error') {
          this.removeThinkingMessage();
          this.addMessage('assistant', 'Sorry, there was an error generating the response.');
          
          this.stopChatPolling();
          this.reEnableInput();
        }
        
        // Timeout after max polls
        if (pollCount >= maxPolls) {
          this.removeThinkingMessage();
          this.addMessage('assistant', 'Request timed out. Please try again.');
          
          this.stopChatPolling();
          this.reEnableInput();
        }
        
      } catch (error) {
        console.error('Polling error:', error);
        
        // Continue polling unless we hit max
        if (pollCount >= maxPolls) {
          this.removeThinkingMessage();
          this.addMessage('assistant', 'Error checking response status.');
          
          this.stopChatPolling();
          this.reEnableInput();
        }
      }
    }, 2000); // Poll every 2 seconds
  }

  // Stop chat polling
  stopChatPolling() {
    if (this.chatPollTimer) {
      clearInterval(this.chatPollTimer);
      this.chatPollTimer = null;
    }
    this.activeChatJob = null;
  }

  // Re-enable input
  reEnableInput() {
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    
    if (chatInput) {
      chatInput.disabled = false;
      chatInput.focus();
    }
    if (chatSend) {
      chatSend.disabled = false;
    }
  }

  // Add message to chat
  addMessage(role, content) {
    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
    
    this.chatMessages.push({ role, content, timestamp });
    this.renderChatMessages();
  }

  // Render all chat messages
  renderChatMessages() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    chatMessages.innerHTML = this.chatMessages.map(msg => `
      <div class="chat-message ${msg.role}">
        <div class="chat-message-bubble">${msg.content}</div>
        <div class="chat-message-time">${msg.timestamp}</div>
      </div>
    `).join('');
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Close viewer and reset
  closeViewer() {
    const dialog = document.getElementById('viewer');
    const viewerFrame = document.getElementById('viewerFrame');
    const container = document.querySelector('.viewer-container');
    const chatToggle = document.getElementById('chatToggle');
    
    // Stop any active polling
    this.stopChatPolling();
    
    // Reset content
    if (viewerFrame) {
      viewerFrame.innerHTML = '';
      viewerFrame.className = 'viewer-content';
    }

    // Reset chat state
    if (container) {
      container.classList.remove('chat-open');
    }
    if (chatToggle) {
      chatToggle.classList.remove('active');
    }
    
    this.chatOpen = false;
    this.chatMessages = [];

    // Close dialog
    if (dialog?.open) {
      dialog.close();
    }

    // Clear current content
    this.currentContent = '';
    this.currentTitle = '';
    this.currentDocId = null;
  }

  // Generate PDF from current content
  async generatePDF() {
    if (!this.currentContent) {
      console.error('No content to generate PDF');
      return;
    }

    await this.generatePDFFromContent(this.currentContent, this.currentTitle);
  }

  // Generate PDF from content
  async generatePDFFromContent(content, title) {
    if (!window.html2pdf) {
      console.error('html2pdf library not loaded');
      return;
    }

    try {
      const htmlContent = marked.parse(content);
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      this.applyInlineStyles(tempDiv);
      
      document.body.appendChild(tempDiv);
      
      const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      
      const pdfOptions = {
        margin: 0.5,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      
      await html2pdf().set(pdfOptions).from(tempDiv).save();
      
      document.body.removeChild(tempDiv);
      
    } catch (error) {
      console.error('PDF generation failed:', error);
    }
  }

  // Apply inline styles for PDF generation
  applyInlineStyles(container) {
    container.style.cssText = `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2d3d;
      max-width: 900px;
      margin: 0 auto;
      padding: 30px 40px;
    `;
    
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

      table.querySelectorAll('tr:nth-child(even)').forEach(tr => {
        tr.style.backgroundColor = '#fafbfc';
      });
    });
  }
}

// Create global instance
const markdownViewer = new MarkdownViewer();
