import { t } from '../i18n.mjs';

const container = document.getElementById('space-watch-panel');

const SPACE_FIELDS = [
  { key: 'newObjects', labelKey: 'newObjects30d', type: 'new' },
  { key: 'militarySats', labelKey: 'militarySats', type: 'military' },
  { key: 'starlink', labelKey: 'starlink', type: 'starlink' },
  { key: 'oneweb', labelKey: 'oneweb', type: 'oneweb' },
  { key: 'iss', labelKey: 'iss', type: 'iss' }
];

function createSpaceRow(item, field) {
  const row = document.createElement('div');
  row.className = 'space-watch-row';
  row.dataset.type = field.type;

  row.innerHTML = `
    <div class="space-row-label">${t(`panels.spaceWatch.${field.labelKey}`)}</div>
    <div class="space-row-value">${item.count}</div>
    <div class="space-row-details">${item.details || ''}</div>
  `;

  return row;
}

export function updateSpaceWatch(data) {
  if (!container || !Array.isArray(data)) return;

  const titleEl = container.querySelector('.panel-title');
  if (titleEl) titleEl.textContent = t('panels.spaceWatch.title');

  const listEl = container.querySelector('.space-watch-list');
  if (!listEl) return;

  listEl.innerHTML = '';

  data.forEach((item, idx) => {
    const field = SPACE_FIELDS[idx];
    if (!field) return;
    listEl.appendChild(createSpaceRow(item, field));
  });

  const newObjectsItem = data.find(d => d.type === 'new' || d.name?.toLowerCase().includes('new'));
  if (newObjectsItem && newObjectsItem.count > 200) {
    const warning = document.createElement('div');
    warning.className = 'space-warning';
    warning.textContent = t('panels.spaceWatch.highLaunchTempo');
    listEl.appendChild(warning);
  }

  const starlinkItem = data.find(d => d.type === 'starlink' || d.name?.toLowerCase().includes('starlink'));
  if (starlinkItem) {
    const info = document.createElement('div');
    info.className = 'space-info';
    info.textContent = `${t('panels.spaceWatch.starlinkMega')} — ${starlinkItem.count} ${t('panels.spaceWatch.activeSatellites')}`;
    listEl.appendChild(info);
  }
}
