import { t } from '../i18n.mjs';

const container = document.getElementById('news-ticker-panel');
let scrollAnimationId = null;

function isLiteMode() {
  return document.body.classList.contains('lite');
}

function createNewsItem(item) {
  const el = document.createElement('div');
  el.className = 'news-item';
  el.innerHTML = `
    <span class="news-title">${item.title}</span>
    <span class="news-source">${item.source}</span>
    <span class="news-time">${item.time}</span>
  `;

  el.addEventListener('click', () => {
    const detail = document.createElement('div');
    detail.className = 'news-detail-overlay';
    detail.innerHTML = `
      <div class="news-detail-content">
        <div class="news-detail-title">${item.title}</div>
        <div class="news-detail-meta">${item.source} · ${item.time} · ${item.category}</div>
        <button class="news-detail-close">✕</button>
      </div>
    `;
    detail.querySelector('.news-detail-close').addEventListener('click', () => {
      detail.remove();
    });
    document.body.appendChild(detail);
  });

  return el;
}

function startScroll(tickerTrack) {
  if (scrollAnimationId) cancelAnimationFrame(scrollAnimationId);

  let pos = 0;
  const speed = 0.5;

  function step() {
    pos -= speed;
    if (tickerTrack.scrollWidth > 0 && Math.abs(pos) >= tickerTrack.scrollWidth / 2) {
      pos = 0;
    }
    tickerTrack.style.transform = `translateX(${pos}px)`;
    scrollAnimationId = requestAnimationFrame(step);
  }

  scrollAnimationId = requestAnimationFrame(step);
}

function stopScroll() {
  if (scrollAnimationId) {
    cancelAnimationFrame(scrollAnimationId);
    scrollAnimationId = null;
  }
}

export function updateNewsTicker(data) {
  if (!container || !Array.isArray(data)) return;

  const titleEl = container.querySelector('.panel-title');
  if (titleEl) titleEl.textContent = t('panels.newsTicker.title');

  const countEl = container.querySelector('.news-count');
  if (countEl) countEl.textContent = `${data.length} ${t('panels.newsTicker.items')}`;

  const trackEl = container.querySelector('.news-ticker-track');
  if (!trackEl) return;

  stopScroll();
  trackEl.innerHTML = '';
  trackEl.style.transform = '';

  if (isLiteMode()) {
    data.forEach(item => {
      trackEl.appendChild(createNewsItem(item));
    });
    trackEl.classList.add('static-list');
    trackEl.classList.remove('scroll-track');
  } else {
    const fragment = document.createDocumentFragment();
    data.forEach(item => {
      fragment.appendChild(createNewsItem(item));
    });
    const clone = fragment.cloneNode(true);
    trackEl.appendChild(fragment);
    trackEl.appendChild(clone);
    trackEl.classList.remove('static-list');
    trackEl.classList.add('scroll-track');
    startScroll(trackEl);
  }
}
