import { t } from '../i18n.mjs';

const container = document.getElementById('nuclear-watch-panel');

const CPM_THRESHOLD = 100;

function createSiteRow(site) {
  const row = document.createElement('div');
  row.className = 'nuclear-site-row';
  row.dataset.name = site.name;

  const isAnomaly = site.cpm > CPM_THRESHOLD;

  row.innerHTML = `
    <div class="nuclear-site-name">${site.name}</div>
    <div class="nuclear-site-location">${site.location}</div>
    <div class="nuclear-site-cpm ${isAnomaly ? 'anomaly' : ''}">
      <span class="cpm-value">${site.cpm}</span>
      <span class="cpm-unit">${t('panels.nuclearWatch.cpm')}</span>
      ${isAnomaly ? `<span class="anomaly-badge">${t('panels.nuclearWatch.anomalyDetected')}</span>` : ''}
    </div>
  `;

  return row;
}

export function updateNuclearWatch(data) {
  if (!container || !Array.isArray(data)) return;

  const titleEl = container.querySelector('.panel-title');
  if (titleEl) titleEl.textContent = t('panels.nuclearWatch.title');

  const listEl = container.querySelector('.nuclear-site-list');
  if (!listEl) return;

  listEl.innerHTML = '';

  if (data.length === 0) {
    listEl.innerHTML = `<div class="nuclear-no-data">${t('panels.nuclearWatch.noData')}</div>`;
    return;
  }

  data.forEach(site => {
    listEl.appendChild(createSiteRow(site));
  });
}
