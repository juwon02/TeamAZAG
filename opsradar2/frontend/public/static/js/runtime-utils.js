window.OpsRadarFrontend?.registerModule('runtime-utils', { file: 'js/runtime-utils.js', screen: 'global' });

// Migrated from legacy app.js by scripts/import-legacy.mjs.
// Shared text/date helpers used by legacy bridge modules.
function normalizeText(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}
function escapeHtml(text) {
  return normalizeText(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function normalizeRenderedText(root) {
  const base = root || document.body;
  if (!base) return;
  const walker = document.createTreeWalker(base, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const normalized = normalizeText(node.nodeValue);
    if (normalized !== node.nodeValue) node.nodeValue = normalized;
  });
}

// ════════════════════════════════════════════════
// 네비게이션
// ════════════════════════════════════════════════

function formatOpsDate(style='long'){
  const today = new Date();
  if(style === 'short'){
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
  }
  return today.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
}
function renderCurrentDateLabels(){
  document.querySelectorAll('[data-current-date]').forEach(el => {
    el.textContent = formatOpsDate(el.dataset.currentDate || 'long');
  });
}
setTimeout(renderCurrentDateLabels, 0);
setTimeout(() => normalizeRenderedText(document.body), 0);
