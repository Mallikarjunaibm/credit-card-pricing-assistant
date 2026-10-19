/**
 * Card Pricing Assistant – front-end controller
 */

const state = {
  analysis: null,
  analysisTitle: '',
  samples: [],
  exportFormat: 'markdown',
  chatHistory: [],
  analyzing: false
};

const $ = (id) => document.getElementById(id);
const DRAFT_KEY = 'cardPricingAssistant.draft';
const CHAT_WELCOME = 'Hello! Ask me anything about card pricing, for example how interchange works or how a fee is calculated. Pick a suggestion below to get started.';

document.addEventListener('DOMContentLoaded', async () => {
  bindEvents();
  restoreDraft();
  resetChat();
  await Promise.all([loadStatus(), loadSamples()]);
  runSimulation();
});

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

function bindEvents() {
  // Main navigation
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Review: input
  const spec = $('specInput');
  spec.addEventListener('input', () => { updateCharCount(); saveDraft(); });
  spec.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runFullAnalysis();
  });
  $('docTitle').addEventListener('input', saveDraft);
  $('btnAnalyzeAll').addEventListener('click', runFullAnalysis);
  $('btnClear').addEventListener('click', () => {
    spec.value = '';
    $('docTitle').value = '';
    document.querySelectorAll('.example').forEach((e) => e.classList.remove('selected'));
    updateCharCount();
    saveDraft();
    spec.focus();
  });
  $('btnEdit').addEventListener('click', showInput);

  // Calculator
  let timer;
  ['simAmount', 'simNetwork', 'simCardType', 'simChannel', 'simModel', 'simMarkupBps', 'simFixedFee', 'simCrossBorder']
    .forEach((id) => {
      const el = $(id);
      const evt = el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input';
      el.addEventListener(evt, () => {
        clearTimeout(timer);
        timer = setTimeout(runSimulation, 250);
      });
    });
  document.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => applyPreset(JSON.parse(btn.dataset.preset)));
  });

  // Chat
  $('chatForm').addEventListener('submit', handleChatSubmit);
  $('btnResetChat').addEventListener('click', resetChat);
  document.querySelectorAll('[data-prompt]').forEach((chip) => {
    chip.addEventListener('click', () => sendPrompt(chip.dataset.prompt));
  });

  // Copy buttons
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => copyText($(btn.dataset.copy).textContent));
  });

  // Dialogs
  $('btnExport').addEventListener('click', openExport);
  $('btnSettings').addEventListener('click', openSettings);
  $('btnGlossary').addEventListener('click', () => $('glossaryModal').showModal());
  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => $(btn.dataset.close).close());
  });
  document.querySelectorAll('.seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.exportFormat = btn.dataset.format;
      document.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
      fetchExportPreview();
    });
  });
  $('btnCopyExport').addEventListener('click', () => copyText($('exportPreview').textContent));
  $('btnDownloadExport').addEventListener('click', downloadExport);
  $('settingsForm').addEventListener('submit', saveSettings);
}

function switchView(view) {
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${view}`));
  window.scrollTo({ top: 0 });
  if (view === 'chat') $('chatInput').focus();
}

function showInput() {
  $('reviewResults').hidden = true;
  $('reviewInput').hidden = false;
  window.scrollTo({ top: 0 });
}

function showResults() {
  $('reviewInput').hidden = true;
  $('reviewResults').hidden = false;
  window.scrollTo({ top: 0 });
}

function updateCharCount() {
  const n = $('specInput').value.length;
  $('charCount').textContent = `${n.toLocaleString()} character${n === 1 ? '' : 's'}`;
}

/* Keep what the user typed if they refresh or close the tab */
function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ title: $('docTitle').value, text: $('specInput').value }));
  } catch (_) { /* storage unavailable */ }
}

function restoreDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (d) {
      $('docTitle').value = d.title || '';
      $('specInput').value = d.text || '';
    }
  } catch (_) { /* ignore */ }
  updateCharCount();
}

/* ------------------------------------------------------------------ */
/* Data loading                                                        */
/* ------------------------------------------------------------------ */

async function api(url, body) {
  const options = body === undefined
    ? {}
    : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
  const res = await fetch(url, options);
  let data = null;
  try { data = await res.json(); } catch (_) { /* non-JSON body */ }
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data;
}

async function loadStatus() {
  const badge = $('serviceStatus');
  try {
    const data = await api('/api/status');
    badge.className = 'status ok';
    $('serviceStatusText').textContent = 'Online';
    const c = data.icaConfig || {};
    $('cfgEndpoint').value = c.endpoint || '';
    $('cfgAssistantId').value = c.assistantId || '';
    $('cfgProjectId').value = c.projectId || '';
    $('cfgAgentId').value = c.agentId || '';
    $('cfgKeyHint').textContent = c.apiKeyMasked ? `Current key: ${c.apiKeyMasked}` : '';
  } catch (err) {
    badge.className = 'status err';
    $('serviceStatusText').textContent = 'Unavailable';
  }
}

async function loadSamples() {
  const box = $('exampleCards');
  try {
    state.samples = await api('/api/samples');
    box.innerHTML = '';
    state.samples.forEach((s) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'example';
      b.dataset.id = s.id;
      b.innerHTML = `<span class="tag">${esc(s.category)}</span><strong>${esc(s.title)}</strong><span>${esc(s.description)}</span>`;
      b.addEventListener('click', () => loadSample(s.id));
      box.appendChild(b);
    });
  } catch (err) {
    box.innerHTML = '<p class="none-note">Examples could not be loaded. You can still paste your own text below.</p>';
  }
}

function loadSample(id) {
  const sample = state.samples.find((s) => s.id === id);
  if (!sample) return;
  $('docTitle').value = sample.title;
  $('specInput').value = sample.content;
  document.querySelectorAll('.example').forEach((e) => e.classList.toggle('selected', e.dataset.id === id));
  updateCharCount();
  saveDraft();
  toast('Example loaded. Now click “Check my requirement”.', 'success');
  $('btnAnalyzeAll').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ------------------------------------------------------------------ */
/* Analysis                                                            */
/* ------------------------------------------------------------------ */

async function runFullAnalysis() {
  if (state.analyzing) return;
  const text = $('specInput').value.trim();
  const title = $('docTitle').value.trim() || 'Untitled requirement';

  if (!text) {
    toast('Pick an example or paste some requirement text first.', 'error');
    $('specInput').focus();
    return;
  }

  const btn = $('btnAnalyzeAll');
  state.analyzing = true;
  btn.disabled = true;
  btn.textContent = 'Checking…';

  try {
    const data = await api('/api/full-analysis', { text, title });
    state.analysis = data;
    state.analysisTitle = title;
    renderAnalysis(data, title);
    showResults();
  } catch (err) {
    toast(`Could not check the requirement: ${err.message}`, 'error');
  } finally {
    state.analyzing = false;
    btn.disabled = false;
    btn.innerHTML = '3 &nbsp;Check my requirement';
  }
}

function scoreClass(score) {
  return score >= 80 ? 'good' : score >= 60 ? 'warn' : 'bad';
}

function setCount(id, text, cls) {
  const el = $(id);
  el.textContent = text;
  el.className = `count ${cls || ''}`;
}

function renderAnalysis(data, title) {
  const { qualityAssessment: qa, domainValidation: dv, pricingRules: pr, businessRules: br, executiveSummary: es } = data;

  const allIssues = [...qa.missingAcceptanceCriteria, ...qa.pricingLogicInconsistencies];
  const issueCount = allIssues.length;
  const highCount = allIssues.filter((i) => String(i.severity).toLowerCase() === 'high').length;

  // Section counts
  setCount('badgeQuality', issueCount ? `${issueCount} to fix` : 'All good', issueCount ? (highCount ? 'bad' : 'warn') : 'good');
  setCount('badgeDomain', `${dv.overallDomainScore}%`, scoreClass(dv.overallDomainScore));
  setCount('badgeFees', `${pr.totalRulesIdentified} found`);
  setCount('badgeRules', `${br.extractedRuleCount} found`);
  setCount('cntNext', `${es.keyRecommendations.length} step${es.keyRecommendations.length === 1 ? '' : 's'}`);

  // Verdict
  // Never show green while there are still things to fix
  const verdictClass = scoreClass(es.overallHealthScore);
  $('verdictCard').className = `verdict ${issueCount && verdictClass === 'good' ? 'warn' : verdictClass}`;
  $('ovHealthScore').textContent = es.overallHealthScore;
  $('verdictTitle').textContent = title;
  $('ovHealthStatus').textContent = es.status;
  $('verdictText').textContent = issueCount
    ? `We found ${issueCount} thing${issueCount === 1 ? '' : 's'} to fix${highCount ? `, ${highCount} of them high priority` : ''}. Start with “What to do next” below.`
    : 'No problems found. This requirement covers the expected scenarios.';

  // Key numbers
  $('ovQualityScore').textContent = `${qa.overallQualityScore}/100`;
  $('ovQualityRating').textContent = qa.qualityRating;
  $('ovDomainScore').textContent = `${dv.overallDomainScore}/100`;
  $('ovDomainStatus').textContent = dv.domainReadiness;
  $('ovRuleCount').textContent = pr.totalRulesIdentified;
  $('ovRuleSummary').textContent = `${pr.fixedFees.length} fixed, ${pr.percentageFees.length} percentage, ${pr.tieredPricing.length} tiered`;
  $('ovIssueCount').textContent = issueCount;
  $('ovIssueSummary').textContent = issueCount ? `${highCount} high priority` : 'Nothing to fix';

  setBar('barCompleteness', 'barCompletenessVal', qa.metrics.completeness);
  setBar('barConsistency', 'barConsistencyVal', qa.metrics.consistency);
  setBar('barDomain', 'barDomainVal', dv.overallDomainScore);
  setBar('barRegulatory', 'barRegulatoryVal', qa.metrics.regulatoryAlignment);

  $('overviewRecommendations').innerHTML = es.keyRecommendations.length
    ? es.keyRecommendations.map((r) => `<li><span>${esc(r)}</span></li>`).join('')
    : '<li><span>No actions needed.</span></li>';

  renderQuality(qa);
  renderDomain(dv);
  renderFees(pr);
  renderRules(br);

  // Open the sections that need attention; keep the rest closed
  $('accNext').open = true;
  $('accQuality').open = issueCount > 0;
  $('accFees').open = false;
  $('accRules').open = false;
  $('accDomain').open = false;
}

function setBar(barId, valId, value) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const bar = $(barId);
  bar.style.width = `${v}%`;
  bar.className = scoreClass(v);
  $(valId).textContent = `${v}%`;
}

function sevClass(sev) {
  const s = String(sev || '').toLowerCase();
  return s === 'high' ? 'high' : s === 'medium' ? 'medium' : 'low';
}

function renderQuality(qa) {
  $('br1MissingACList').innerHTML = qa.missingAcceptanceCriteria.length
    ? qa.missingAcceptanceCriteria.map((ac) => `
        <div class="item ${sevClass(ac.severity)}">
          <div class="item-top"><span class="tag ${sevClass(ac.severity)}">${esc(ac.severity)} priority</span><span class="item-title">${esc(ac.title)}</span></div>
          <p>${esc(ac.description)}</p>
          <div class="fix"><strong>How to fix:</strong> ${esc(ac.recommendation)}</div>
        </div>`).join('')
    : '<div class="ok-note">All expected scenarios are covered.</div>';

  $('br1InconsistenciesList').innerHTML = qa.pricingLogicInconsistencies.length
    ? qa.pricingLogicInconsistencies.map((inc) => `
        <div class="item ${sevClass(inc.severity || 'High')}">
          <div class="item-top"><span class="tag">${esc(inc.type)}</span><span class="item-title">${esc(inc.title)}</span></div>
          <p>${esc(inc.description)}</p>
          <div class="fix"><strong>How to resolve:</strong> ${esc(inc.recommendation)}</div>
        </div>`).join('')
    : '<div class="ok-note">No conflicting pricing rules found.</div>';

  $('gherkinBox').textContent = qa.suggestedGherkinAC || '';
}

function renderDomain(dv) {
  $('br2ValidationCards').innerHTML = dv.validations.map((v) => `
    <div class="card-sub">
      <div class="card-top">
        <div><h5>${esc(v.category)}</h5><div class="muted small">${esc(v.status)}</div></div>
        <span class="tag ${v.score >= 80 ? 'good' : v.score >= 60 ? 'medium' : 'high'}">${esc(v.score)}/100</span>
      </div>
      <p class="muted small">${esc(v.details)}</p>
      <ul class="checklist">
        ${v.domainChecklist.map((c) => `<li class="${c.present ? 'yes' : 'no'}"><span class="box">${c.present ? '✓' : ''}</span><span>${esc(c.item)}</span></li>`).join('')}
      </ul>
      ${v.recommendations && v.recommendations.length ? `<div class="fix"><strong>Tip:</strong> ${esc(v.recommendations[0])}</div>` : ''}
    </div>`).join('');
}

function emptyRow(cols, text) {
  return `<tr><td colspan="${cols}" class="none-note">${esc(text)}</td></tr>`;
}

function renderFees(pr) {
  $('bodyFixedFees').innerHTML = pr.fixedFees.length
    ? pr.fixedFees.map((f) => `<tr><td><strong>${esc(f.name)}</strong></td><td>${esc(f.rate)}</td><td>${esc(f.type)}</td><td class="sub">${esc(f.sourceSnippet)}</td></tr>`).join('')
    : emptyRow(4, 'No fixed fees found.');

  $('bodyPercentageFees').innerHTML = pr.percentageFees.length
    ? pr.percentageFees.map((p) => `<tr><td><strong>${esc(p.name)}</strong></td><td>${esc(p.percentage)}</td><td>${esc(p.fixedComponent)}</td><td>${esc(p.type)}</td></tr>`).join('')
    : emptyRow(4, 'No percentage rates found.');

  $('fr3TieredList').innerHTML = pr.tieredPricing.length
    ? pr.tieredPricing.map((t) => `
        <div class="item low">
          <div class="item-top"><span class="item-title">${esc(t.tierName)}</span><span class="tag">${esc(t.rateApplied)}</span></div>
          <p>${esc(t.condition)}</p>
          <p class="small">${esc(t.tierStructure)}</p>
        </div>`).join('')
    : '<p class="none-note">No volume or tiered pricing found.</p>';

  $('fr3RegionalList').innerHTML = pr.regionalPricing.length
    ? pr.regionalPricing.map((r) => `
        <div class="item low">
          <div class="item-top"><span class="item-title">${esc(r.regionScope)}</span><span class="tag">${esc(r.rate)}</span></div>
          <p>${esc(r.surchargeType)}</p>
        </div>`).join('')
    : '<p class="none-note">No cross-border or currency surcharges found.</p>';
}

function renderRules(br) {
  $('fr4EligibilityList').innerHTML = br.eligibilityCriteria.length
    ? br.eligibilityCriteria.map((e) => `
        <div class="item low">
          <div class="item-top"><span class="item-title">${esc(e.criteria)}</span><span class="tag">${esc(e.applicability)}</span></div>
          <p><strong>${esc(e.value)}</strong></p>
          <p>${esc(e.description)}</p>
        </div>`).join('')
    : '<p class="none-note">No eligibility criteria found.</p>';

  $('fr4ConditionsList').innerHTML = br.pricingConditions.length
    ? br.pricingConditions.map((c) => `
        <div class="item low">
          <div class="item-top"><span class="item-title">${esc(c.triggerEvent)}</span><span class="tag">${esc(c.evaluationWindow)}</span></div>
          <div class="formula">${esc(c.conditionLogic)}</div>
          <p><strong>Otherwise:</strong> ${esc(c.fallbackAction)}</p>
        </div>`).join('')
    : '<p class="none-note">No pricing conditions found.</p>';

  $('fr4FormulasList').innerHTML = br.feeCalculationLogic.length
    ? br.feeCalculationLogic.map((f) => `
        <div class="item low">
          <div class="item-top"><span class="item-title">${esc(f.formulaName)}</span></div>
          <div class="formula">${esc(f.algebraicFormula)}</div>
          <p><strong>Rounding:</strong> ${esc(f.roundingRule)}</p>
          <div class="vars">${f.variables.map((v) => `<div><code>${esc(v.variable)}</code> – ${esc(v.definition)}</div>`).join('')}</div>
        </div>`).join('')
    : '<p class="none-note">No fee calculations found.</p>';
}

/* ------------------------------------------------------------------ */
/* Fee calculator                                                      */
/* ------------------------------------------------------------------ */

function applyPreset(p) {
  $('simAmount').value = p.amount;
  $('simNetwork').value = p.net;
  $('simCardType').value = p.card;
  $('simChannel').value = p.channel;
  $('simCrossBorder').checked = !!p.cross;
  runSimulation();
}

async function runSimulation() {
  const num = (id, fallback) => {
    const v = parseFloat($(id).value);
    return Number.isFinite(v) && v >= 0 ? v : fallback;
  };
  try {
    const result = await api('/api/simulate-pricing', {
      amount: num('simAmount', 100) || 100,
      cardNetwork: $('simNetwork').value,
      cardType: $('simCardType').value,
      channel: $('simChannel').value,
      pricingModel: $('simModel').value,
      customMarkupBps: num('simMarkupBps', 20),
      customFixedFee: num('simFixedFee', 0.10),
      isCrossBorder: $('simCrossBorder').checked
    });
    renderSimulation(result);
  } catch (err) {
    toast(`Calculator error: ${err.message}`, 'error');
  }
}

function renderSimulation(data) {
  const s = data.summary;
  const totalLeg = data.waterfall.find((l) => l.type === 'Total Fee');
  const totalFee = totalLeg ? totalLeg.amount : '–';

  $('simTotalFee').textContent = `$${totalFee}`;
  $('simEffectiveMDR').textContent = s.effectiveMDR;
  $('shareNetPayout').textContent = `$${s.netPayout}`;
  $('shareIssuer').textContent = s.issuerShare;
  $('shareScheme').textContent = s.schemeShare;
  $('shareAcquirer').textContent = s.acquirerShare;

  const pct = (v) => Math.max(0, parseFloat(v) || 0);
  $('splitIssuer').style.width = `${pct(s.issuerShare)}%`;
  $('splitScheme').style.width = `${pct(s.schemeShare)}%`;
  $('splitAcquirer').style.width = `${pct(s.acquirerShare)}%`;

  // Plain-English answer
  const parts = [
    { name: "the cardholder's bank", v: pct(s.issuerShare) },
    { name: 'the card network', v: pct(s.schemeShare) },
    { name: 'the payment processor', v: pct(s.acquirerShare) }
  ].sort((a, b) => b.v - a.v);
  const amount = parseFloat($('simAmount').value) || 100;
  $('simAnswer').innerHTML =
    `On a <strong>$${amount.toFixed(2)}</strong> payment, the merchant pays <strong>$${esc(totalFee)}</strong> in fees ` +
    `(<strong>${esc(s.effectiveMDR)}</strong>) and receives <strong>$${esc(s.netPayout)}</strong>. ` +
    `Most of the fees (${parts[0].v.toFixed(0)}%) go to ${parts[0].name}.`;

  $('simWaterfallBody').innerHTML = data.waterfall.map((leg) => {
    const cls = leg.type === 'Net Settlement' ? 'final' : leg.type === 'Total Fee' ? 'total' : '';
    const label = String(leg.leg).replace(/^\d+\.\s*/, '');
    return `<tr class="${cls}"><td>${esc(label)}</td><td class="sub">${esc(leg.details || '')}</td><td class="num">$${esc(leg.amount)}</td></tr>`;
  }).join('');
}

/* ------------------------------------------------------------------ */
/* Chat                                                                */
/* ------------------------------------------------------------------ */

function resetChat() {
  $('chatMessages').innerHTML = '';
  state.chatHistory = [];
  addMessage('assistant', CHAT_WELCOME, false);
}

function sendPrompt(text) {
  $('chatInput').value = text;
  $('chatForm').requestSubmit();
}

async function handleChatSubmit(e) {
  e.preventDefault();
  const input = $('chatInput');
  const message = input.value.trim();
  if (!message) return;

  input.value = '';
  addMessage('user', message);
  const history = state.chatHistory.slice(0, -1);
  const typing = addMessage('assistant', 'Thinking…', false, true);
  $('chatSend').disabled = true;

  try {
    const data = await api('/api/chat', {
      message,
      requirementText: $('specInput').value.trim(),
      history
    });
    typing.remove();
    addMessage('assistant', data.reply);
  } catch (err) {
    typing.remove();
    addMessage('assistant', `Sorry, something went wrong: ${err.message}`, false);
  } finally {
    $('chatSend').disabled = false;
    input.focus();
  }
}

function addMessage(role, content, record = true, isTyping = false) {
  const box = $('chatMessages');
  const el = document.createElement('div');
  el.className = `msg ${role === 'user' ? 'user' : 'bot'}${isTyping ? ' typing' : ''}`;
  el.innerHTML = (role === 'user' ? '' : '<div class="who">Assistant</div>') + `<div>${formatText(content)}</div>`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
  if (record) state.chatHistory.push({ role, content });
  return el;
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

function openExport() {
  if (!state.analysis) {
    toast('Check a requirement first, then export the report.', 'error');
    return;
  }
  $('exportModal').showModal();
  fetchExportPreview();
}

async function fetchExportPreview() {
  const preview = $('exportPreview');
  preview.textContent = 'Loading…';
  try {
    const data = await api('/api/export', {
      format: state.exportFormat,
      analysisData: state.analysis,
      requirementTitle: state.analysisTitle || 'Pricing requirement'
    });
    preview.textContent = data.content;
  } catch (err) {
    preview.textContent = `Could not create the export: ${err.message}`;
  }
}

function downloadExport() {
  const content = $('exportPreview').textContent;
  const ext = { markdown: 'md', jira: 'txt', json: 'json' }[state.exportFormat] || 'txt';
  const name = (state.analysisTitle || 'pricing-report').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'pricing-report';
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

function openSettings() {
  $('cfgApiKey').value = '';
  $('settingsModal').showModal();
}

async function saveSettings(e) {
  e.preventDefault();
  try {
    await api('/api/config', {
      apiKey: $('cfgApiKey').value.trim(),
      endpoint: $('cfgEndpoint').value.trim(),
      assistantId: $('cfgAssistantId').value.trim(),
      projectId: $('cfgProjectId').value.trim(),
      agentId: $('cfgAgentId').value.trim()
    });
    $('settingsModal').close();
    toast('Settings saved.', 'success');
    loadStatus();
  } catch (err) {
    toast(`Could not save settings: ${err.message}`, 'error');
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function toast(message, type = '') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  $('toasts').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copied to clipboard.', 'success');
  } catch (_) {
    toast('Copy failed. Select the text and copy it manually.', 'error');
  }
}

function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Escapes first, then applies a small safe subset of markdown.
function formatText(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
