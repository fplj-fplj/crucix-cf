import { t } from '../i18n.mjs';

const container = document.getElementById('signal-guide-panel');

function createGuideEntry(entry) {
  const el = document.createElement('div');
  el.className = 'signal-guide-entry';

  el.innerHTML = `
    <div class="guide-entry-header">
      <span class="guide-entry-name">${entry.name}</span>
      <span class="guide-expand-icon">▸</span>
    </div>
    <div class="guide-entry-body collapsed">
      <div class="guide-field">
        <div class="guide-field-label">${t('panels.signalGuide.meaning')}</div>
        <div class="guide-field-value">${entry.meaning}</div>
      </div>
      <div class="guide-field">
        <div class="guide-field-label">${t('panels.signalGuide.whyItMatters')}</div>
        <div class="guide-field-value">${entry.whyItMatters}</div>
      </div>
      <div class="guide-field">
        <div class="guide-field-label">${t('panels.signalGuide.notProofOf')}</div>
        <div class="guide-field-value">${entry.notProofOf}</div>
      </div>
      <div class="guide-field">
        <div class="guide-field-label">${t('panels.signalGuide.example')}</div>
        <div class="guide-field-value">${entry.example}</div>
      </div>
    </div>
  `;

  const header = el.querySelector('.guide-entry-header');
  const body = el.querySelector('.guide-entry-body');
  const icon = el.querySelector('.guide-expand-icon');

  header.addEventListener('click', () => {
    const isCollapsed = body.classList.contains('collapsed');
    if (isCollapsed) {
      body.classList.remove('collapsed');
      body.classList.add('expanded');
      icon.textContent = '▾';
    } else {
      body.classList.remove('expanded');
      body.classList.add('collapsed');
      icon.textContent = '▸';
    }
  });

  return el;
}

export function updateSignalGuide(data) {
  if (!container || !Array.isArray(data)) return;

  const titleEl = container.querySelector('.panel-title');
  if (titleEl) titleEl.textContent = t('panels.signalGuide.title');

  const subtitleEl = container.querySelector('.panel-subtitle');
  if (subtitleEl) subtitleEl.textContent = t('panels.signalGuide.whatSignalsMean');

  const listEl = container.querySelector('.signal-guide-list');
  if (!listEl) return;

  listEl.innerHTML = '';

  data.forEach(entry => {
    listEl.appendChild(createGuideEntry(entry));
  });
}
