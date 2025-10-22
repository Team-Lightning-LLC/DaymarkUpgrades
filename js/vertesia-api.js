// Vertesia API Wrapper Functions
class VertesiaAPI {
  constructor() {
    this.baseURL = CONFIG.VERTESIA_API_BASE;
    this.apiKey = CONFIG.VERTESIA_API_KEY;
  }

  // Generic API call wrapper
  async call(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Vertesia API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Load all objects with optional filtering
  async loadAllObjects(limit = 1000) {
    const response = await this.call(`/objects?limit=${limit}&offset=0`);
    return response;
  }

  // Get single object by ID
  async getObject(objectId) {
    return await this.call(`/objects/${objectId}`);
  }

  // Create new object record
  async createObject(objectData) {
    return await this.call('/objects', {
      method: 'POST',
      body: JSON.stringify(objectData)
    });
  }

  // Delete object
  async deleteObject(objectId) {
    await this.call(`/objects/${objectId}`, {
      method: 'DELETE'
    });
  }

  // Execute async interaction (research generation)
  async executeAsync(interactionData) {
    return await this.call('/execute/async', {
      method: 'POST',
      body: JSON.stringify({
        type: 'conversation',
        interaction: CONFIG.INTERACTION_NAME,
        data: interactionData,
        config: {
          environment: CONFIG.ENVIRONMENT_ID,
          model: CONFIG.MODEL
        }
      })
    });
  }

  // Get job status (for polling)
  async getJobStatus(jobId) {
    return await this.call(`/jobs/${jobId}`);
  }

  // Get download URL for file
  async getDownloadUrl(fileSource) {
    return await this.call('/objects/download-url', {
      method: 'POST',
      body: JSON.stringify({ 
        file: fileSource,
        format: 'original'
      })
    });
  }

  // Get file content as text
  async getFileContent(fileSource) {
    try {
      const downloadData = await this.getDownloadUrl(fileSource);
      const response = await fetch(downloadData.url);
      
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error('Failed to get file content:', error);
      throw error;
    }
  }

  // Store markdown content as object
  async storeMarkdownDocument(title, content, metadata = {}) {
    const objectData = {
      name: title,
      description: `Research document: ${title}`,
      content: {
        source: content,
        type: 'text/markdown',
        name: title
      },
      properties: {
        document_type: 'research',
        generated_at: new Date().toISOString(),
        ...metadata
      }
    };

    return await this.createObject(objectData);
  }

 // Chat with document - Same pattern as research generation
async chatWithDocument(data) {
  // Build the prompt with document_id and conversation history
  let prompt = `Document ID: ${data.document_id}\n\n`;
  
  if (data.conversation_history && data.conversation_history.length > 0) {
    prompt += 'Previous conversation:\n';
    data.conversation_history.forEach(msg => {
      prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    });
    prompt += '\n';
  }
  
  prompt += `Current question: ${data.question}`;
  
  return await this.call('/execute/async', {
    method: 'POST',
    body: JSON.stringify({
      type: 'conversation',
      interaction: 'Documentchat',
      data: {
        Task: prompt
      },
      config: {
        environment: CONFIG.ENVIRONMENT_ID,
        model: CONFIG.MODEL
      }
    })
  });
}

  // Get chat job status
  async getChatJobStatus(runId) {
    return await this.call(`/runs/${runId}`);
  }

  // Get chat job result
  async getChatJobResult(runId) {
    return await this.call(`/runs/${runId}/result`);
  }
}

// Create global instance
const vertesiaAPI = new VertesiaAPI();
