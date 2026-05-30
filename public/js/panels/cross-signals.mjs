import { t } from '../i18n.mjs';

const container = document.getElementById('cross-signals-panel');

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

function severityClass(severity) {
  return `severity-${severity}`;
}

function correlationBar(correlation) {
  const pct = Math.round(correlation * 100);
  return `<div class="correlation-bar"><div class="correlation-fill" style="width:${pct}%"></div></div><span class="correlation-pct">${pct}%</span>`;
}

function createSignalRow(signal) {
  const el = document.createElement('div');
  el.className = `cross-signal-row ${severityClass(signal.severity)}`;

  el.innerHTML = `
    <div class="signal-domain">${signal.domain}</div>
    <div class="signal-description">${signal.signals.join(', ')}</div>
    <div class="signal-correlation">${correlationBar(signal.correlation)}</div>
    <div class="signal-severity-badge ${severityClass(signal.severity)}">${signal.severity.toUpperCase()}</div>
  `;

  return el;
}

export function updateCrossSignals(data) {
  if (!container || !Array.isArray(data)) return;

  const titleEl = container.querySelector('.panel-title');
  if (titleEl) titleEl.textContent = t('panels.crossSignals.title');

  const listEl = container.querySelector('.cross-signals-list');
  if (!listEl) return;

  listEl.innerHTML = '';

  const sorted = [...data].sort((a, b) => {
    return (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99);
  });

  sorted.forEach(signal => {
    listEl.appendChild(createSignalRow(signal));
  });
}
