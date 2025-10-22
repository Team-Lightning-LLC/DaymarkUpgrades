// Research Generation and Progress Management
class ResearchEngine {
  constructor() {
    this.currentJob = null;
    this.countdownTimer = null;
    this.refreshTimer = null;
    this.isMinimized = false;
    this.STORAGE_KEY = 'deepresearch_active_job';
    this.setupEventListeners();
    
    // Check for existing job on page load
    this.restoreJobFromStorage();
  }

  setupEventListeners() {
    document.getElementById('toastClose')?.addEventListener('click', () => {
      this.cancelResearch();
    });

    document.getElementById('toastMinimize')?.addEventListener('click', () => {
      this.toggleMinimize();
    });
  }

  toggleMinimize() {
    const toast = document.getElementById('generationToast');
    const minimizeBtn = document.getElementById('toastMinimize');
    
    this.isMinimized = !this.isMinimized;
    
    if (this.isMinimized) {
      toast.classList.add('minimized');
      minimizeBtn.textContent = '+';
      minimizeBtn.title = 'Expand';
    } else {
      toast.classList.remove('minimized');
      minimizeBtn.textContent = '-';
      minimizeBtn.title = 'Minimize';
    }
  }

  // Save job state to localStorage
  saveJobState(researchData) {
    const jobState = {
      capability: researchData.capability,
      framework: researchData.framework,
      scope: researchData.modifiers.scope,
      depth: researchData.modifiers.depth,
      rigor: researchData.modifiers.rigor,
      perspective: researchData.modifiers.perspective,
      startTime: Date.now()
    };
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(jobState));
      console.log('Job state saved to localStorage');
    } catch (error) {
      console.error('Failed to save job state:', error);
    }
  }

  // Load job state from localStorage
  loadJobState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return null;
      
      const jobState = JSON.parse(saved);
      const elapsed = (Date.now() - jobState.startTime) / 1000; // seconds
      
      // If older than 30 minutes, clear it
      if (elapsed > 1800) {
        console.log('Job state expired, clearing...');
        this.clearJobState();
        return null;
      }
      
      return { ...jobState, elapsed };
    } catch (error) {
      console.error('Failed to load job state:', error);
      this.clearJobState();
      return null;
    }
  }

  // Clear job state from localStorage
  clearJobState() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('Job state cleared from localStorage');
    } catch (error) {
      console.error('Failed to clear job state:', error);
    }
  }

  // Restore job from storage on page load
  restoreJobFromStorage() {
    const savedJob = this.loadJobState();
    if (!savedJob) return;
    
    console.log('Restoring research job from storage...', savedJob);
    
    // Reconstruct job data
    this.currentJob = {
      data: {
        capability: savedJob.capability,
        framework: savedJob.framework,
        modifiers: {
          scope: savedJob.scope,
          depth: savedJob.depth,
          rigor: savedJob.rigor,
          perspective: savedJob.perspective
        }
      },
      startTime: savedJob.startTime
    };
    
    const elapsed = savedJob.elapsed;
    
    if (elapsed < 300) {
      // Still in countdown phase (0-5 minutes)
      const remaining = 300 - elapsed;
      console.log(`Restoring countdown with ${Math.floor(remaining)} seconds remaining`);
      this.showGenerationProgress();
      this.startCountdownTimer(remaining);
      
      // Schedule aggressive polling after remaining countdown time
      setTimeout(() => {
        this.startAggressivePolling();
      }, remaining * 1000);
      
    } else if (elapsed < 420) {
      // In aggressive polling phase (5-7 minutes)
      const pollsElapsed = Math.floor((elapsed - 300) / 10);
      const pollsRemaining = 12 - pollsElapsed;
      console.log(`Restoring aggressive polling with ${pollsRemaining} polls remaining`);
      this.showGenerationProgress();
      this.startAggressivePolling(pollsRemaining);
      
    } else {
      // Past 7 minutes, use slow polling
      console.log('Past aggressive polling window, entering slow polling mode');
      this.showGenerationProgress();
      this.startSlowPolling();
    }
  }

  // Start research generation
  async startResearch(researchData) {
    try {
      const prompt = this.buildResearchPrompt(researchData);
      
      const jobResponse = await vertesiaAPI.executeAsync({
        Task: prompt
      });

      this.currentJob = {
        id: jobResponse.job_id || jobResponse.id,
        data: researchData,
        startTime: Date.now()
      };

      // Save to localStorage
      this.saveJobState(researchData);

      this.showGenerationProgress();
      this.startCountdownTimer();
      
      // Start aggressive polling after 5 minutes
      setTimeout(() => {
        this.startAggressivePolling();
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error('Failed to start research:', error);
      this.clearJobState();
      this.showError('Failed to start research generation. Please try again.');
    }
  }

  // Build research prompt from parameters WITH LABELS
  buildResearchPrompt(data) {
    return `
    Utilize Web Search to develop a comprehensive report utilizing the following structure as a guide to provide users a complete and well informed research document: 
Analysis Type: ${data.capability}
Framework: ${data.framework}

Utilize this context to gain additional insight into your research topic:
${data.context}

The Research Parameters you must follow for this document are:
- Scope: ${data.modifiers.scope}
- Depth: ${data.modifiers.depth}
- Rigor: ${data.modifiers.rigor}
- Perspective: ${data.modifiers.perspective}

All web searches acknolwedge must acknowledge that the current date is 10.21.2025 when searching for the most recent data. Search for the most recent data unless otherwise specified. Always capture the most recent reliable 
data. The final output must be a document uploaded to the content object library.
    `.trim();
  }

  // Show generation progress toast
  showGenerationProgress() {
    const toast = document.getElementById('generationToast');
    const title = toast.querySelector('.toast-title');
    const subtitle = toast.querySelector('.toast-subtitle');
    const details = toast.querySelector('.toast-details');
    
    const researchTitle = `Generating ${this.currentJob.data.framework}`;
    const researchDetails = `${this.currentJob.data.modifiers.scope} - ${this.currentJob.data.modifiers.depth} - ${this.currentJob.data.modifiers.rigor}`;
    
    if (title) title.textContent = researchTitle;
    if (subtitle) subtitle.innerHTML = `Estimated time: <span id="timeRemaining">5:00</span>`;
    if (details) details.textContent = researchDetails;
    
    this.isMinimized = false;
    toast.classList.remove('minimized');
    const minimizeBtn = document.getElementById('toastMinimize');
    if (minimizeBtn) minimizeBtn.textContent = '-';
    
    toast.style.display = 'block';
  }

  // Start countdown timer with optional starting time
  startCountdownTimer(startSeconds = 300) {
    let timeLeft = Math.floor(startSeconds);
    
    this.countdownTimer = setInterval(() => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      const timeElement = document.getElementById('timeRemaining');
      if (timeElement) {
        timeElement.textContent = display;
      }
      
      if (timeLeft <= 0) {
        clearInterval(this.countdownTimer);
        const subtitle = document.querySelector('.toast-subtitle');
        if (subtitle) {
          subtitle.textContent = 'Checking for completion...';
        }
      }
      
      timeLeft--;
    }, 1000);
  }

  // Start aggressive polling (every 10 seconds for 2 minutes)
  startAggressivePolling(maxPolls = 12) {
    console.log('Starting aggressive polling (every 10 seconds for 2 minutes)...');
    
    // Clear countdown timer if still running
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    
    // Check immediately
    this.refreshDocumentLibrary();
    
    let pollCount = 0;
    
    this.refreshTimer = setInterval(() => {
      this.refreshDocumentLibrary();
      pollCount++;
      
      if (pollCount >= maxPolls) {
        // Switch to slow polling after reaching max polls
        clearInterval(this.refreshTimer);
        this.startSlowPolling();
      }
    }, 10000); // 10 seconds
    
    // Update UI
    const subtitle = document.querySelector('.toast-subtitle');
    if (subtitle) {
      subtitle.textContent = 'Checking for completion...';
    }
  }

  // Start slow polling (every 7 minutes)
  startSlowPolling() {
    console.log('Switching to slow polling (every 7 minutes)...');
    
    this.refreshTimer = setInterval(() => {
      this.refreshDocumentLibrary();
    }, 7 * 60 * 1000);
    
    // Update UI
    const title = document.querySelector('.toast-title');
    const subtitle = document.querySelector('.toast-subtitle');
    const details = document.querySelector('.toast-details');
    
    if (title) title.textContent = `${this.currentJob.data.framework} In Progress`;
    if (subtitle) subtitle.textContent = 'Checking every 7 minutes...';
    if (details) details.textContent = 'You can continue using the interface normally.';
    
    // Auto-minimize to get out of the way
    setTimeout(() => {
      if (!this.isMinimized) {
        this.toggleMinimize();
      }
    }, 10000);
  }

  // Refresh the document library
  async refreshDocumentLibrary() {
    console.log('Refreshing document library...');
    try {
      if (window.app) {
        const previousCount = window.app.documents.length;
        await window.app.refreshDocuments();
        const newCount = window.app.documents.length;
        
        if (newCount > previousCount) {
          console.log(`Found ${newCount - previousCount} new documents!`);
          this.handleNewDocuments();
        }
      }
    } catch (error) {
      console.error('Error refreshing document library:', error);
    }
  }

  // Handle when new documents are found
  handleNewDocuments() {
    const toast = document.getElementById('generationToast');
    const title = toast.querySelector('.toast-title');
    const subtitle = toast.querySelector('.toast-subtitle');
    const details = toast.querySelector('.toast-details');
    const spinner = document.querySelector('.toast-spinner');
    
    const completionTitle = `${this.currentJob.data.framework} Complete!`;
    
    if (title) title.textContent = completionTitle;
    if (subtitle) subtitle.textContent = 'Ready to view';
    if (details) details.textContent = 'Your document library has been updated.';
    if (spinner) spinner.style.display = 'none';
    
    if (this.isMinimized) {
      this.toggleMinimize();
    }
    
    toast.style.display = 'block';
    
    setTimeout(() => {
      this.finishResearch();
    }, 4000);
  }

  // Finish research and cleanup
  finishResearch() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    
    this.clearJobState();
    this.hideToast();
    this.resetForm();
    this.currentJob = null;
    this.isMinimized = false;
  }

  // Cancel current research
  cancelResearch() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    
    this.clearJobState();
    this.hideToast();
    this.resetForm();
    this.currentJob = null;
    this.isMinimized = false;
  }

  // Hide generation toast
  hideToast() {
    const toast = document.getElementById('generationToast');
    toast.style.display = 'none';
    toast.classList.remove('minimized');
    
    const title = toast.querySelector('.toast-title');
    const subtitle = toast.querySelector('.toast-subtitle');
    const details = toast.querySelector('.toast-details');
    const spinner = document.querySelector('.toast-spinner');
    
    if (title) title.textContent = 'Generating Research...';
    if (subtitle) subtitle.innerHTML = `Estimated time: <span id="timeRemaining">5:00</span>`;
    if (details) details.textContent = '';
    if (spinner) spinner.style.display = 'block';
  }

  // Reset form to initial state
  resetForm() {
    const capabilitySelect = document.getElementById('capability');
    const frameworkSelect = document.getElementById('framework');
    const contextInput = document.getElementById('contextInput');
    const createBtn = document.getElementById('createBtn');
    const charCount = document.getElementById('charCount');
    
    if (capabilitySelect) capabilitySelect.value = '';
    if (frameworkSelect) {
      frameworkSelect.innerHTML = '<option value="">Choose capability first...</option>';
      frameworkSelect.disabled = true;
    }
    if (contextInput) {
      contextInput.value = '';
      contextInput.rows = 3;
      contextInput.placeholder = "Select a framework above to begin...";
    }
    if (createBtn) createBtn.disabled = true;
    if (charCount) charCount.textContent = '0';
  }

  // Show error message
  showError(message) {
    console.error(message);
    alert(message);
  }
}

// Create global instance
const researchEngine = new ResearchEngine();
