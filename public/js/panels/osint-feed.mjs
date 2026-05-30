import { t } from '../i18n.mjs';

const container = document.getElementById('osint-feed-panel');

function urgencyClass(urgency) {
  return `urgency-${urgency}`;
}

function createPost(post) {
  const el = document.createElement('div');
  el.className = `osint-post ${urgencyClass(post.urgency)}`;

  if (post.urgency === 'critical' || post.urgency === 'high') {
    el.classList.add('urgent-border');
  }

  el.innerHTML = `
    <div class="osint-post-header">
      <span class="osint-channel">${post.channel}</span>
      <span class="osint-time">${post.time}</span>
      ${post.urgency === 'critical' || post.urgency === 'high' ? `<span class="osint-urgent-badge">${t('panels.osintFeed.urgent')}</span>` : ''}
    </div>
    <div class="osint-content">${post.content}</div>
    <div class="osint-tags">${post.tags.map(tag => `<span class="osint-tag">#${tag}</span>`).join('')}</div>
  `;

  return el;
}

export function updateOsintFeed(data) {
  if (!container || !Array.isArray(data)) return;

  const titleEl = container.querySelector('.panel-title');
  if (titleEl) titleEl.textContent = t('panels.osintFeed.title');

  const urgentCount = data.filter(p => p.urgency === 'critical' || p.urgency === 'high').length;
  const badgeEl = container.querySelector('.osint-urgent-count');
  if (badgeEl) {
    if (urgentCount > 0) {
      badgeEl.textContent = urgentCount;
      badgeEl.classList.remove('hidden');
    } else {
      badgeEl.classList.add('hidden');
    }
  }

  const listEl = container.querySelector('.osint-feed-list');
  if (!listEl) return;

  listEl.innerHTML = '';
  data.forEach(post => {
    listEl.appendChild(createPost(post));
  });
}
