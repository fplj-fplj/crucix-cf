import { t } from '../i18n.mjs';

const container = document.getElementById('markets-panel');

function changeClass(change) {
  return change >= 0 ? 'change-up' : 'change-down';
}

function changeSign(change) {
  return change >= 0 ? '+' : '';
}

function createMarketItem(item) {
  const el = document.createElement('div');
  el.className = 'market-item';

  const displayValue = item.value !== null && item.value !== undefined ? item.value.toLocaleString() : 'N/A';
  const displayChange = item.change !== null && item.change !== undefined ? item.change.toFixed(2) : '0.00';
  const displayChangePct = item.changePercent !== null && item.changePercent !== undefined ? item.changePercent.toFixed(2) : '0.00';

  el.innerHTML = `
    <div class="market-name">${item.name}</div>
    <div class="market-price">${displayValue}</div>
    <div class="market-change ${changeClass(item.change ?? 0)}">
      ${changeSign(item.change ?? 0)}${displayChange} (${changeSign(item.changePercent ?? 0)}${displayChangePct}%)
    </div>
  `;

  return el;
}

function createCategory(category, items) {
  const section = document.createElement('div');
  section.className = 'market-category';

  const labelMap = {
    indexes: t('panels.markets.indexes'),
    crypto: t('panels.markets.crypto'),
    'energy+metals+macro': t('panels.markets.energyMetalsMacro')
  };

  section.innerHTML = `<div class="market-category-label">${labelMap[category] || category}</div>`;

  const list = document.createElement('div');
  list.className = 'market-category-list';
  items.forEach(item => {
    list.appendChild(createMarketItem(item));
  });

  section.appendChild(list);
  return section;
}

export function updateMarkets(data) {
  if (!container || !Array.isArray(data)) return;

  const titleEl = container.querySelector('.panel-title');
  if (titleEl) titleEl.textContent = t('panels.markets.title');

  const listEl = container.querySelector('.markets-list');
  if (!listEl) return;

  listEl.innerHTML = '';

  data.forEach(cat => {
    listEl.appendChild(createCategory(cat.category, cat.items));
  });
}
