import { t } from '../i18n.mjs';

const container = document.getElementById('risk-gauges-panel');

const GAUGE_KEYS = [
  { key: 'vix', i18nKey: 'vix' },
  { key: 'hySpread', i18nKey: 'hySpread' },
  { key: 'usdIndex', i18nKey: 'usdIndex' },
  { key: 'joblessClaims', i18nKey: 'joblessClaims' },
  { key: 'mortgage30y', i18nKey: 'mortgage30y' },
  { key: 'm2Supply', i18nKey: 'm2Supply' },
  { key: 'natDebt', i18nKey: 'natDebt' },
  { key: 'gscpi', i18nKey: 'gscpi' }
];

function trendArrow(trend) {
  if (trend === 'rising') return '↑';
  if (trend === 'falling') return '↓';
  return '→';
}

function trendClass(trend) {
  if (trend === 'rising') return 'trend-rising';
  if (trend === 'falling') return 'trend-falling';
  return 'trend-stable';
}

function createGaugeRow(gauge, gaugeConfig) {
  const row = document.createElement('div');
  row.className = 'risk-gauge-row';
  row.dataset.gauge = gaugeConfig.key;

  const isElevated = gauge.value > gauge.threshold;

  row.innerHTML = `
    <div class="gauge-name">${t(`panels.riskGauges.${gaugeConfig.i18nKey}`)}</div>
    <div class="gauge-value ${isElevated ? 'elevated' : ''}">${gauge.value}</div>
    <div class="gauge-unit">${gauge.unit}</div>
    <div class="gauge-trend ${trendClass(gauge.trend)}">${trendArrow(gauge.trend)}</div>
    ${isElevated ? `<div class="gauge-threshold-badge">${t('panels.riskGauges.elevated')}</div>` : ''}
  `;

  return row;
}

export function updateRiskGauges(data) {
  if (!container || !Array.isArray(data)) return;

  const titleEl = container.querySelector('.panel-title');
  if (titleEl) titleEl.textContent = t('panels.riskGauges.title');

  const listEl = container.querySelector('.risk-gauge-list');
  if (!listEl) return;

  listEl.innerHTML = '';

  data.forEach((gauge, idx) => {
    const config = GAUGE_KEYS[idx];
    if (!config) return;
    listEl.appendChild(createGaugeRow(gauge, config));
  });
}
