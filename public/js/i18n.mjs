let currentLocale = 'zh';
const translations = {};

function resolve(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

export function t(key) {
  const val = resolve(translations[currentLocale], key);
  if (val !== undefined) return val;
  const fallback = resolve(translations['en'], key);
  if (fallback !== undefined) return fallback;
  return key;
}

export function getLocale() {
  return currentLocale;
}

export async function setLocale(locale) {
  if (locale === currentLocale && translations[locale]) return;
  if (!translations[locale]) {
    try {
      const res = await fetch(`/locales/${locale}.json`);
      if (!res.ok) throw new Error(`Failed to load locale: ${locale}`);
      translations[locale] = await res.json();
    } catch (e) {
      console.error(e);
      return;
    }
  }
  currentLocale = locale;
  localStorage.setItem('crucix-locale', locale);
  document.documentElement.setAttribute('lang', locale);
  window.dispatchEvent(new CustomEvent('localechange', { detail: { locale } }));
  applyTranslations();
}

export async function initI18n() {
  let locale = localStorage.getItem('crucix-locale');
  if (!locale) {
    const nav = navigator.language || '';
    if (nav.startsWith('zh')) {
      locale = 'zh';
    } else {
      locale = 'en';
    }
  }
  if (locale !== 'zh' && locale !== 'en') locale = 'zh';
  await setLocale(locale);
}

export function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val !== key) el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const val = t(key);
    if (val !== key) el.placeholder = val;
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    const val = t(key);
    if (val !== key) el.title = val;
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    const val = t(key);
    if (val !== key) el.setAttribute('aria-label', val);
  });
}
