import { t } from '../i18n.mjs';

const container = document.getElementById('trade-ideas-panel');

function directionClass(direction) {
  return `direction-${direction}`;
}

function directionLabel(direction) {
  const map = { long: 'LONG', short: 'SHORT', hedge: 'WATCH' };
  return map[direction] || direction.toUpperCase();
}

function confidenceBar(confidence) {
  const pct = Math.round(confidence * 100);
  return `<div class="confidence-bar"><div class="confidence-fill" style="width:${pct}%"></div></div><span class="confidence-pct">${pct}%</span>`;
}

function createIdeaCard(idea) {
  const el = document.createElement('div');
  el.className = 'trade-idea-card';

  el.innerHTML = `
    <div class="trade-idea-header">
      <span class="trade-direction ${directionClass(idea.direction)}">${directionLabel(idea.direction)}</span>
      <span class="trade-asset">${idea.asset}</span>
      <span class="trade-timeframe">${idea.timeframe}</span>
    </div>
    <div class="trade-confidence">
      <span class="trade-confidence-label">${t('panels.tradeIdeas.confidence')}</span>
      ${confidenceBar(idea.confidence)}
    </div>
    <div class="trade-rationale">${idea.rationale}</div>
    <div class="trade-risk"><strong>${t('panels.tradeIdeas.risk')}:</strong> ${idea.risk}</div>
  `;

  return el;
}

export function updateTradeIdeas(data) {
  if (!container || !Array.isArray(data)) return;

  const titleEl = container.querySelector('.panel-title');
  if (titleEl) titleEl.textContent = t('panels.tradeIdeas.title');

  const listEl = container.querySelector('.trade-ideas-list');
  if (!listEl) return;

  listEl.innerHTML = '';

  data.forEach(idea => {
    listEl.appendChild(createIdeaCard(idea));
  });

  const disclaimerEl = container.querySelector('.trade-disclaimer');
  if (disclaimerEl) {
    disclaimerEl.textContent = t('panels.tradeIdeas.disclaimer');
  }
}
