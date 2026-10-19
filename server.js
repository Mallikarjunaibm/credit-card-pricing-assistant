/**
 * Credit Card Network Pricing Assistant - Express Server
 * Powered by IBM Consulting Advantage (ICA) & Payment Domain Intelligence Engine
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const icaService = require('./services/icaService');
const pricingEngine = require('./services/pricingEngine');
const sampleRequirements = require('./services/sampleData');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// --- System & Config Endpoints ---

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    assistantName: 'Credit Card Network Pricing Assistant',
    version: '1.0.0',
    icaConfig: icaService.getConfigSummary(),
    capabilities: [
      'BR-1: Requirements Quality Assessment (Incomplete AC & Logic Inconsistencies)',
      'BR-2: Pricing Domain Validation (Interchange, Assessments, Network Fees, MDR)',
      'FR-3: Pricing Rule Identification (Fixed, Percentage, Tiered, Regional)',
      'FR-4: Business Rule Extraction (Eligibility, Conditions, Calculation Logic)',
      'Interactive Fee Waterfall & Transaction Simulator'
    ]
  });
});

app.get('/api/config', (req, res) => {
  res.json(icaService.getConfigSummary());
});

app.post('/api/config', (req, res) => {
  const { apiKey, endpoint, assistantId, projectId, agentId } = req.body;
  icaService.updateConfig({ apiKey, endpoint, assistantId, projectId, agentId });
  res.json({
    message: 'Configuration updated successfully',
    config: icaService.getConfigSummary()
  });
});

app.get('/api/samples', (req, res) => {
  res.json(sampleRequirements);
});

// --- Core Assistant & Analysis Endpoints ---

/**
 * AI Assistant Chat Copilot
 * Connects to ICA agent or uses payment domain reasoning
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, requirementText, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Try communicating with ICA live endpoint
    const icaResponse = await icaService.sendToICA(message, {
      requirementText: requirementText || '',
      history
    });

    let replyText = '';
    let analysisPayload = null;

    if (icaResponse.success && icaResponse.data && icaResponse.data.output) {
      replyText = icaResponse.data.output.text || JSON.stringify(icaResponse.data.output);
    } else {
      // Payment Domain Conversational Engine with Contextual Knowledge
      const lower = message.toLowerCase();

      // Check if user is asking for assessment or extraction directly in chat
      if (requirementText || lower.includes('assess') || lower.includes('validate') || lower.includes('extract') || lower.includes('rules')) {
        const textToAnalyze = requirementText || message;
        analysisPayload = pricingEngine.performFullAnalysis(textToAnalyze, 'Analyzed Document');
      }

      if (lower.includes('interchange') || lower.includes('ic++') || lower.includes('interchange++')) {
        replyText = `**Interchange Analysis & Guidelines:**\n\n` +
          `• **Interchange Model**: In an Interchange++ (IC++) setup, the issuer interchange and card brand assessment fees are passed directly to the merchant at cost, plus your processor margin.\n` +
          `• **Key Card Brand Rates**: Visa CPS Retail Credit standard is ~1.65% + $0.10, whereas Visa Signature/Infinite can reach 2.30% + $0.10. Regulated US Debit is capped at 0.05% + $0.21 under the Durbin Amendment.\n` +
          `• **Optimization Tip**: Ensure your specification mandates Level 2/Level 3 commercial card data pass-through (Sales Tax, Customer PO) to unlock up to 60-80 bps in interchange qualification savings.`;
      } else if (lower.includes('quality') || lower.includes('acceptance criteria') || lower.includes('br-1') || lower.includes('review')) {
        replyText = `**BR-1 Quality Assessment Insights:**\n\n` +
          `• **Acceptance Criteria Health**: Checked requirement for edge cases, error conditions, reversal/refund logic, and rounding precision.\n` +
          `• **Logic Consistency**: Verified volume tier boundaries, micropayment margin caps, and Durbin debit exemptions.\n` +
          `• Review the **Requirements Quality** tab on your dashboard for the detailed score gauge and Gherkin rewrite!`;
      } else if (lower.includes('waterfall') || lower.includes('calculate') || lower.includes('simulate') || lower.includes('mdr')) {
        replyText = `**Payment Fee Waterfall Breakdown:**\n\n` +
          `1. **Gross Transaction** (e.g. $100.00)\n` +
          `2. **Issuer Interchange** (typically 1.65% + $0.10 = $1.75)\n` +
          `3. **Card Scheme Assessment** (Visa ~0.14% = $0.14) + NABU ($0.0195)\n` +
          `4. **Acquirer Processor Markup** (e.g. 20 bps + $0.10 = $0.30)\n` +
          `5. **Total Acceptance Fee (MDR)** = ~$2.21 (Effective MDR ~2.21%)\n` +
          `6. **Net Merchant Payout** = $97.79\n\n` +
          `You can test custom scenarios in the **Fee Waterfall Simulator** tab!`;
      } else {
        replyText = `Hello! I am your **Credit Card Network Pricing Assistant**, powered by IBM Consulting Advantage (ICA).\n\n` +
          `I can help you review, improve, and validate requirements across:\n` +
          `• **BR-1**: Requirements Quality Assessment (Incomplete AC, ambiguity & logic inconsistencies)\n` +
          `• **BR-2**: Pricing Domain Validation (Interchange schedules, Scheme Assessments, Network fees, MDR)\n` +
          `• **FR-3**: Pricing Rule Identification (Fixed fees, Percentage rates, Tiered slabs, Cross-border surcharges)\n` +
          `• **FR-4**: Business Rule Extraction (Eligibility criteria, Pricing conditions, Algebraic formulas)\n\n` +
          `Paste your specification or select a sample template on the left to begin!`;
      }
    }

    res.json({
      reply: replyText,
      source: icaResponse.source,
      analysis: analysisPayload,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * BR-1: Requirements Quality Assessment
 */
app.post('/api/assess-quality', (req, res) => {
  try {
    const { text, title } = req.body;
    if (!text) return res.status(400).json({ error: 'Specification text is required' });

    const assessment = pricingEngine.assessRequirementsQuality(text, title);
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * BR-2: Pricing Domain Validation
 */
app.post('/api/validate-domain', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Specification text is required' });

    const validation = pricingEngine.validatePricingDomain(text);
    res.json(validation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * FR-3: Pricing Rule Identification
 */
app.post('/api/identify-rules', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Specification text is required' });

    const rules = pricingEngine.identifyPricingRules(text);
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * FR-4: Business Rule Extraction
 */
app.post('/api/extract-rules', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Specification text is required' });

    const businessRules = pricingEngine.extractBusinessRules(text);
    res.json(businessRules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Unified Full Analysis (BR-1 + BR-2 + FR-3 + FR-4)
 */
app.post('/api/full-analysis', (req, res) => {
  try {
    const { text, title } = req.body;
    if (!text) return res.status(400).json({ error: 'Specification text is required' });

    const result = pricingEngine.performFullAnalysis(text, title || 'Payment Pricing Requirement');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Fee Waterfall Simulator
 */
app.post('/api/simulate-pricing', (req, res) => {
  try {
    const params = req.body || {};
    const simulation = pricingEngine.simulateWaterfall(params);
    res.json(simulation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Export Engine (Markdown, Jira, JSON, HTML)
 */
app.post('/api/export', (req, res) => {
  try {
    const { format = 'markdown', analysisData, requirementTitle = 'Pricing Requirement Spec' } = req.body;
    if (!analysisData) return res.status(400).json({ error: 'Analysis data is required' });

    const { qualityAssessment, domainValidation, pricingRules, businessRules, executiveSummary } = analysisData;

    if (format === 'jira') {
      const jiraMarkdown = [
        `h1. ${requirementTitle} - Pricing Analysis & Validation Report`,
        `*Generated by Credit Card Network Pricing Assistant (ICA)*`,
        ``,
        `h2. Executive Summary`,
        `* *Overall Health Score*: ${executiveSummary.overallHealthScore}/100`,
        `* *Status*: ${executiveSummary.status}`,
        ``,
        `h2. BR-1: Requirements Quality Assessment`,
        `*Quality Score*: ${qualityAssessment.overallQualityScore}/100 (${qualityAssessment.qualityRating})`,
        `h3. Missing / Incomplete Acceptance Criteria:`,
        ...qualityAssessment.missingAcceptanceCriteria.map(ac => `* *[${ac.severity}] ${ac.title}*: ${ac.description} -> _Recommendation: ${ac.recommendation}_`),
        ``,
        `h3. Pricing Logic Inconsistencies:`,
        ...qualityAssessment.pricingLogicInconsistencies.map(lg => `* *[${lg.severity}] ${lg.title}*: ${lg.description} -> _Recommendation: ${lg.recommendation}_`),
        ``,
        `h2. BR-2: Pricing Domain Validation (${domainValidation.overallDomainScore}/100)`,
        ...domainValidation.validations.map(v => `* *${v.category}* (${v.status}): ${v.details}`),
        ``,
        `h2. FR-3: Identified Pricing Rules`,
        `* *Fixed Fees*: ${pricingRules.fixedFees.map(f => `${f.name} (${f.rate})`).join(', ') || 'None'}`,
        `* *Percentage Fees*: ${pricingRules.percentageFees.map(p => `${p.name} (${p.percentage} + ${p.fixedComponent})`).join(', ') || 'None'}`,
        `* *Tiered Slabs*: ${pricingRules.tieredPricing.map(t => `${t.tierName}: ${t.condition}`).join(', ') || 'None'}`,
        `* *Regional/FX*: ${pricingRules.regionalPricing.map(r => `${r.regionScope} (${r.rate})`).join(', ') || 'None'}`,
        ``,
        `h2. FR-4: Extracted Business Rules`,
        `h3. Eligibility Criteria:`,
        ...businessRules.eligibilityCriteria.map(e => `* *${e.criteria}*: ${e.value} (_${e.applicability}_)`),
        `h3. Fee Calculation Formulas:`,
        ...businessRules.feeCalculationLogic.map(f => `{code}${f.algebraicFormula}{code}\n_Rounding: ${f.roundingRule}_`)
      ].join('\n');

      return res.json({ format: 'jira', content: jiraMarkdown });
    }

    if (format === 'markdown') {
      const markdown = [
        `# ${requirementTitle} — Network Pricing Analysis Report`,
        `*Generated by IBM Consulting Advantage (ICA) Credit Card Network Pricing Assistant*`,
        `*Timestamp: ${new Date().toUTCString()}*`,
        ``,
        `---`,
        ``,
        `## 1. Executive Summary`,
        `- **Overall Health Score**: **${executiveSummary.overallHealthScore}/100**`,
        `- **Implementation Readiness**: **${executiveSummary.status}**`,
        ``,
        `### Key Analyst Recommendations:`,
        ...executiveSummary.keyRecommendations.map(r => `- ${r}`),
        ``,
        `---`,
        ``,
        `## 2. BR-1: Requirements Quality Assessment`,
        `- **Quality Score**: ${qualityAssessment.overallQualityScore}/100 (${qualityAssessment.qualityRating})`,
        `- **Completeness**: ${qualityAssessment.metrics.completeness}% | **Consistency**: ${qualityAssessment.metrics.consistency}% | **Clarity**: ${qualityAssessment.metrics.clarity}%`,
        ``,
        `### Missing / Incomplete Acceptance Criteria:`,
        ...qualityAssessment.missingAcceptanceCriteria.map(ac => `1. **[${ac.severity} Severity] ${ac.title}** (${ac.code})\n   - *Issue*: ${ac.description}\n   - *Action*: ${ac.recommendation}`),
        ``,
        `### Pricing Logic Inconsistencies & Conflict Risks:`,
        ...qualityAssessment.pricingLogicInconsistencies.map(lg => `1. **[${lg.severity} Severity] ${lg.title}** (${lg.code})\n   - *Conflict*: ${lg.description}\n   - *Resolution*: ${lg.recommendation}`),
        ``,
        `### Standardized Gherkin Acceptance Criteria:`,
        `\`\`\`gherkin\n${qualityAssessment.suggestedGherkinAC}\n\`\`\``,
        ``,
        `---`,
        ``,
        `## 3. BR-2: Pricing Domain Validation`,
        `- **Domain Architecture Readiness**: **${domainValidation.domainReadiness} (${domainValidation.overallDomainScore}/100)**`,
        ``,
        ...domainValidation.validations.map(v => `### ${v.category} — ${v.status} (${v.score}/100)\n${v.details}\n${v.domainChecklist.map(c => `  - [${c.present ? 'x' : ' '}] ${c.item}`).join('\n')}\n`),
        `---`,
        ``,
        `## 4. FR-3: Identified Pricing Elements`,
        `### Fixed Fee Components:`,
        ...pricingRules.fixedFees.map(f => `- **${f.name}**: \`${f.rate}\` (${f.type})`),
        ``,
        `### Percentage & Ad-Valorem Components:`,
        ...pricingRules.percentageFees.map(p => `- **${p.name}**: \`${p.percentage}\` (Fixed base: ${p.fixedComponent}) — *${p.type}*`),
        ``,
        `### Tiered & Slab Structures:`,
        ...pricingRules.tieredPricing.map(t => `- **${t.tierName}**: Condition: \`${t.condition}\` -> Rate: \`${t.rateApplied}\``),
        ``,
        `### Regional & Cross-Border Rules:`,
        ...pricingRules.regionalPricing.map(r => `- **${r.regionScope}**: \`${r.rate}\` (${r.surchargeType})`),
        ``,
        `---`,
        ``,
        `## 5. FR-4: Extracted Business Rules`,
        `### Eligibility Criteria:`,
        ...businessRules.eligibilityCriteria.map(e => `- **${e.criteria}**: \`${e.value}\`\n  *Rule*: ${e.description}`),
        ``,
        `### Pricing Conditions & Triggers:`,
        ...businessRules.pricingConditions.map(c => `- **${c.triggerEvent}** (${c.conditionId}):\n  - *Logic*: \`${c.conditionLogic}\`\n  - *Fallback*: ${c.fallbackAction}`),
        ``,
        `### Fee Calculation Formulas:`,
        ...businessRules.feeCalculationLogic.map(f => `\`\`\`math\n${f.algebraicFormula}\n\`\`\`\n*Precision*: ${f.roundingRule}\n`)
      ].join('\n');

      return res.json({ format: 'markdown', content: markdown });
    }

    res.json({ format: 'json', content: JSON.stringify(analysisData, null, 2) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Credit Card Network Pricing Assistant running!`);
  console.log(`📍 Web UI: http://localhost:${PORT}`);
  console.log(`🔑 ICA Connected: ${Boolean(process.env.ICA_API_KEY)}`);
  console.log(`=======================================================`);
});
