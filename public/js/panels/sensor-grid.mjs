import { t } from '../i18n.mjs';

const SENSOR_KEYS = [
  { key: 'airActivity', icon: '✈️', unitKey: 'theaters' },
  { key: 'thermalSpikes', icon: '🔥', unitKey: 'nightDet' },
  { key: 'sdrCoverage', icon: '📡', unitKey: 'online' },
  { key: 'maritimeWatch', icon: '⚓', unitKey: 'chokepoints' },
  { key: 'nuclearSites', icon: '☢️', unitKey: 'monitors' },
  { key: 'conflictEvents', icon: '⚔️', unitKey: 'fatalities' },
  { key: 'healthWatch', icon: '🏥', unitKey: 'whoAlerts' },
  { key: 'worldNews', icon: '📰', unitKey: 'rssGeolocated' },
  { key: 'osintFeed', icon: '👁', unitKey: 'urgent' },
  { key: 'satellites', icon: '🛰️', unitKey: 'new30d' }
];

const container = document.getElementById('sensor-grid');

function createCard(sensorKey, icon, unitKey) {
  const card = document.createElement('div');
  card.className = 'sensor-card';
  card.dataset.sensor = sensorKey;
  card.innerHTML = `
    <div class="sensor-icon">${icon}</div>
    <div class="sensor-value">--</div>
    <div class="sensor-unit">${t(`panels.sensorGrid.${unitKey}`)}</div>
    <div class="sensor-label">${t(`panels.sensorGrid.${sensorKey}`)}</div>
  `;
  return card;
}

function init() {
  if (!container) return;
  container.innerHTML = '';
  SENSOR_KEYS.forEach(({ key, icon, unitKey }) => {
    container.appendChild(createCard(key, icon, unitKey));
  });
}

init();

export function updateSensorGrid(data) {
  if (!container || !Array.isArray(data)) return;

  data.forEach((item, idx) => {
    const card = container.querySelector(`[data-sensor="${SENSOR_KEYS[idx]?.key}"]`);
    if (!card) return;

    const valueEl = card.querySelector('.sensor-value');
    const unitEl = card.querySelector('.sensor-unit');
    const labelEl = card.querySelector('.sensor-label');

    const oldVal = valueEl.textContent;
    const newVal = String(item.value);

    if (oldVal !== newVal) {
      valueEl.textContent = newVal;
      card.classList.add('flash');
      setTimeout(() => card.classList.remove('flash'), 600);
    }

    unitEl.textContent = item.unit || t(`panels.sensorGrid.${SENSOR_KEYS[idx]?.unitKey}`);
    labelEl.textContent = t(`panels.sensorGrid.${SENSOR_KEYS[idx]?.key}`);

    card.classList.remove('status-normal', 'status-elevated', 'status-critical');
    card.classList.add(`status-${item.status || 'normal'}`);
  });
}
