import { t } from '../i18n.mjs';

const container = document.getElementById('sweep-delta-panel');

const STATUS_MAP = {
  stable: 'stable',
  shift: 'mixed',
  alert: 'escalated'
};

function typeIcon(type) {
  const icons = {
    new: '🆕',
    escalation: '🔺',
    deescalation: '🔻',
    numeric_change: '📊'
  };
  return icons[type] || '•';
}

function createDeltaEntry(entry) {
  const el = document.createElement('div');
  el.className = `delta-entry severity-${entry.severity}`;

  let valueChange = '';
  if (entry.oldValue !== undefined && entry.newValue !== undefined) {
    valueChange = `<span class="delta-values">${entry.oldValue} → ${entry.newValue}</span>`;
  }

  el.innerHTML = `
    <div class="delta-entry-icon">${typeIcon(entry.type)}</div>
    <div class="delta-entry-source">${entry.source}</div>
    <div class="delta-entry-desc">${entry.description}</div>
    ${valueChange}
    <div class="delta-entry-severity severity-${entry.severity}">${entry.severity.toUpperCase()}</div>
  `;

  return el;
}

export function updateSweepDelta(data) {
  if (!container || !data) return;

  const titleEl = container.querySelector('.panel-title');
  if (titleEl) titleEl.textContent = t('panels.sweepDelta.title');

  const statusEl = container.querySelector('.delta-overall-status');
  if (statusEl) {
    const mappedStatus = STATUS_MAP[data.overallStatus] || 'mixed';
    statusEl.className = `delta-overall-status status-${mappedStatus}`;
    statusEl.textContent = t(`panels.sweepDelta.${mappedStatus}`);
  }

  const listEl = container.querySelector('.delta-entries');
  if (listEl && Array.isArray(data.entries)) {
    listEl.innerHTML = '';
    data.entries.forEach(entry => {
      listEl.appendChild(createDeltaEntry(entry));
    });
  }

  const summaryEl = container.querySelector('.delta-summary');
  if (summaryEl && Array.isArray(data.entries)) {
    const total = data.entries.length;
    const critical = data.entries.filter(e => e.severity === 'critical').length;
    const newCount = data.entries.filter(e => e.type === 'new').length;
    const escalated = data.entries.filter(e => e.type === 'escalation').length;
    const deescalated = data.entries.filter(e => e.type === 'deescalation').length;

    summaryEl.innerHTML = `
      <span class="delta-stat">${t('panels.sweepDelta.changes')}: ${total}</span>
      <span class="delta-stat">${t('panels.sweepDelta.critical')}: ${critical}</span>
      <span class="delta-stat">${t('panels.sweepDelta.new')}: ${newCount}</span>
      <span class="delta-stat">${t('panels.sweepDelta.escalation')}: ${escalated}</span>
      <span class="delta-stat">${t('panels.sweepDelta.deescalation')}: ${deescalated}</span>
    `;
  }
}
