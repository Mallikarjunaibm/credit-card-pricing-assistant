/**
 * IBM Consulting Advantage (ICA) Agent Integration Service
 * Manages connectivity with ICA Agent API and provides intelligent fallback.
 */

const axios = require('axios');

class ICAService {
  constructor() {
    this.apiKey = process.env.ICA_API_KEY || '';
    this.endpoint = process.env.ICA_ENDPOINT || 'https://api.ibm.com/ica/v1/agent';
    this.assistantId = process.env.ICA_ASSISTANT_ID || '';
    this.projectId = process.env.ICA_PROJECT_ID || '';
    this.agentId = process.env.ICA_AGENT_ID || '';

    this.parseCompoundKey(this.apiKey);
  }

  parseCompoundKey(key) {
    if (!key) return;
    const parts = key.split(':');
    if (parts.length >= 4) {
      this.tenantPrefix = parts[0];
      this.keySecret = parts[1];
      this.assistantId = parts[2] || this.assistantId;
      this.projectId = parts[3] || this.projectId;
      this.agentId = parts[4] || this.agentId;
    }
  }

  updateConfig(config) {
    if (config.apiKey) {
      this.apiKey = config.apiKey;
      this.parseCompoundKey(this.apiKey);
    }
    if (config.endpoint) this.endpoint = config.endpoint;
    if (config.assistantId) this.assistantId = config.assistantId;
    if (config.projectId) this.projectId = config.projectId;
    if (config.agentId) this.agentId = config.agentId;
  }

  getConfigSummary() {
    return {
      connected: true,
      endpoint: this.endpoint,
      assistantId: this.assistantId,
      projectId: this.projectId,
      agentId: this.agentId,
      apiKeyMasked: this.apiKey ? `${this.apiKey.substring(0, 8)}...${this.apiKey.substring(this.apiKey.length - 8)}` : 'Not Set',
      agentName: 'Credit Card Network Pricing Assistant',
      provider: 'IBM Consulting Advantage (ICA) / watsonx'
    };
  }

  async sendToICA(message, context = {}) {
    const payload = {
      agent_id: this.agentId,
      assistant_id: this.assistantId,
      project_id: this.projectId,
      input: {
        text: message
      },
      context: {
        skills: ['pricing_domain_validation', 'requirements_quality_assessment', 'pricing_rule_identification', 'business_rule_extraction'],
        ...context
      }
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-IBM-Client-Id': this.projectId,
      'X-ICA-Agent-Id': this.agentId,
      'X-ICA-API-Key': this.apiKey
    };

    try {
      const response = await axios.post(`${this.endpoint}/chat`, payload, {
        headers,
        timeout: 10000
      });
      return {
        success: true,
        source: 'ICA_LIVE',
        data: response.data
      };
    } catch (error) {
      // In development or if endpoint is unreachable, gracefully fall back to domain intelligence engine
      return {
        success: false,
        source: 'ICA_FALLBACK',
        error: error.message,
        details: 'Using Local Payment Domain Intelligence Engine.'
      };
    }
  }
}

module.exports = new ICAService();
