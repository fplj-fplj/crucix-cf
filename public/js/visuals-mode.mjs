const STORAGE_KEY = 'crucix-visuals';

function isMobile() {
  return window.innerWidth <= 768;
}

function applyMode(mode) {
  document.body.classList.remove('lite', 'full');
  document.body.classList.add(mode);

  if (mode === 'lite' && isMobile()) {
    document.getElementById('globe-container')?.classList.add('hidden');
    document.getElementById('map-container')?.classList.remove('hidden');
  }

  window.dispatchEvent(new CustomEvent('visualschange', {
    detail: { mode }
  }));
}

export function initVisualsMode() {
  const saved = localStorage.getItem(STORAGE_KEY) || 'full';
  applyMode(saved);

  const toggleBtn = document.getElementById('visuals-toggle');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    const current = document.body.classList.contains('lite') ? 'lite' : 'full';
    const next = current === 'full' ? 'lite' : 'full';
    localStorage.setItem(STORAGE_KEY, next);
    applyMode(next);
  });

  window.addEventListener('resize', () => {
    if (document.body.classList.contains('lite') && isMobile()) {
      document.getElementById('globe-container')?.classList.add('hidden');
      document.getElementById('map-container')?.classList.remove('hidden');
    }
  });
}
