import { t } from './i18n.mjs';

const BOOT_STEPS = [
  'boot.initializing',
  'boot.loadingSources',
  'boot.connecting',
  'boot.sweepStarting',
  'boot.ready'
];

export function runBootSequence() {
  return new Promise((resolve) => {
    const overlay = document.getElementById('boot-overlay');
    const textEl = overlay?.querySelector('#boot-text');
    const progressBar = overlay?.querySelector('#boot-progress-bar');
    const dashboard = document.getElementById('dashboard');

    if (!overlay || !textEl || !progressBar) {
      if (overlay) overlay.style.display = 'none';
      if (dashboard) dashboard.classList.remove('hidden');
      resolve();
      return;
    }

    let stepIndex = 0;

    function showStep() {
      if (stepIndex >= BOOT_STEPS.length) {
        overlay.classList.add('fade-out');
        setTimeout(() => {
          overlay.style.display = 'none';
          if (dashboard) dashboard.classList.remove('hidden');
          resolve();
        }, 600);
        return;
      }

      textEl.textContent = t(BOOT_STEPS[stepIndex]);
      const progress = ((stepIndex + 1) / BOOT_STEPS.length) * 100;
      progressBar.style.width = `${progress}%`;

      stepIndex++;
      setTimeout(showStep, 800);
    }

    showStep();
  });
}
