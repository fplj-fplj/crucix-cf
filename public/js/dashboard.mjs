import { initI18n, setLocale, getLocale, applyTranslations } from './i18n.mjs';
import { runBootSequence } from './boot-sequence.mjs';
import { startPolling } from './poll-client.mjs';
import { updateSensorGrid } from './panels/sensor-grid.mjs';
import { updateNuclearWatch } from './panels/nuclear-watch.mjs';
import { updateRiskGauges } from './panels/risk-gauges.mjs';
import { updateSpaceWatch } from './panels/space-watch.mjs';
import { updateNewsTicker } from './panels/news-ticker.mjs';
import { updateOsintFeed } from './panels/osint-feed.mjs';
import { updateMarkets } from './panels/markets.mjs';
import { updateTradeIdeas } from './panels/trade-ideas.mjs';
import { updateCrossSignals } from './panels/cross-signals.mjs';
import { updateSweepDelta } from './panels/sweep-delta.mjs';
import { updateSignalGuide } from './panels/signal-guide.mjs';
import { initRegionFilter } from './region-filter.mjs';
import { initVisualsMode } from './visuals-mode.mjs';

const state = {
  currentRegion: 'WORLD',
  currentView: 'globe',
  visualsMode: localStorage.getItem('crucix-visuals') || 'full',
  currentBriefing: null
};

function handleBriefingUpdate(e) {
  const data = e.detail;
  if (!data) return;
  state.currentBriefing = data;
  updateSensorGrid(data.sensorGrid);
  updateNuclearWatch(data.nuclearWatch);
  updateRiskGauges(data.riskGauges);
  updateSpaceWatch(data.spaceWatch);
  updateNewsTicker(data.newsTicker);
  updateOsintFeed(data.osintFeed);
  updateMarkets(data.markets);
  updateTradeIdeas(data.tradeIdeas);
  updateCrossSignals(data.crossSignals);
  updateSweepDelta(data.sweepDelta);
  updateSignalGuide(data.signalGuide);
}

function bindLanguageToggle() {
  const btn = document.getElementById('lang-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const next = getLocale() === 'zh' ? 'en' : 'zh';
    setLocale(next);
  });
}

function bindSettingsButton() {
  const btn = document.getElementById('settings-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    window.location.href = '/settings';
  });
}

function bindViewToggle() {
  const globeBtn = document.getElementById('btn-globe');
  const mapBtn = document.getElementById('btn-flat');
  if (!globeBtn || !mapBtn) return;

  globeBtn.addEventListener('click', () => {
    state.currentView = 'globe';
    globeBtn.classList.add('active');
    mapBtn.classList.remove('active');
    document.getElementById('globe-view')?.classList.remove('hidden');
    document.getElementById('leaflet-view')?.classList.add('hidden');
  });

  mapBtn.addEventListener('click', () => {
    state.currentView = 'map';
    mapBtn.classList.add('active');
    globeBtn.classList.remove('active');
    document.getElementById('leaflet-view')?.classList.remove('hidden');
    document.getElementById('globe-view')?.classList.add('hidden');
  });
}

async function initGlobe() {
  try {
    const mod = await import('./globe.mjs');
    if (mod.initGlobe) await mod.initGlobe();
  } catch {}
}

async function initMap() {
  try {
    const mod = await import('./map.mjs');
    if (mod.initMap) await mod.initMap();
  } catch {}
}

export async function initDashboard() {
  await initI18n();

  window.addEventListener('briefingupdate', handleBriefingUpdate);
  window.addEventListener('localechange', () => {
    applyTranslations();
    if (state.currentBriefing) handleBriefingUpdate({ detail: state.currentBriefing });
  });

  await runBootSequence();

  initRegionFilter();
  initVisualsMode();
  bindLanguageToggle();
  bindSettingsButton();
  bindViewToggle();

  await initGlobe();
  await initMap();

  startPolling();
}

export function getState() {
  return { ...state };
}

export function setState(key, value) {
  state[key] = value;
}

initDashboard();
