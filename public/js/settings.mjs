import { initI18n, setLocale, getLocale, applyTranslations, t } from './i18n.mjs';

const DEFAULT_MODELS = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  gemini: 'gemini-1.5-pro',
  openrouter: 'openrouter/auto',
  minimax: 'MiniMax-Text-01',
  mistral: 'mistral-large-latest',
  grok: 'grok-3-latest',
};

let originalSettings = null;
let hasUnsavedChanges = false;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function markDirty() {
  if (!originalSettings) return;
  hasUnsavedChanges = true;
  $('#unsaved-indicator').classList.remove('hidden');
}

function markClean() {
  hasUnsavedChanges = false;
  $('#unsaved-indicator').classList.add('hidden');
}

async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to load settings');
    const json = await res.json();

    if (json.status === 'no_data') {
      originalSettings = {};
      return;
    }

    const data = json.data;
    originalSettings = data;

    if (data.apiKeys) {
      const keyMap = {
        fredApiKey: 'FRED_API_KEY',
        firmsMapKey: 'FIRMS_MAP_KEY',
        eiaApiKey: 'EIA_API_KEY',
        acledEmail: 'ACLED_EMAIL',
        acledPassword: 'ACLED_PASSWORD',
        aisStreamApiKey: 'AISSTREAM_API_KEY',
        adsbApiKey: 'ADSB_API_KEY',
        cloudflareApiToken: 'CLOUDFLARE_API_TOKEN',
      };
      for (const [field, key] of Object.entries(keyMap)) {
        const el = $(`#${field}`);
        if (el && data.apiKeys[key]) el.value = data.apiKeys[key];
      }
    }

    if (data.llm) {
      if (data.llm.provider) $('#llmProvider').value = data.llm.provider;
      if (data.llm.apiKey) $('#llmApiKey').value = data.llm.apiKey;
      if (data.llm.model) {
        const modelSelect = $('#llmModel');
        let found = false;
        for (const opt of modelSelect.options) {
          if (opt.value === data.llm.model) {
            found = true;
            break;
          }
        }
        if (!found) {
          const opt = document.createElement('option');
          opt.value = data.llm.model;
          opt.textContent = data.llm.model;
          modelSelect.appendChild(opt);
        }
        modelSelect.value = data.llm.model;
      }
      updateDefaultModelDisplay();
    }

    if (data.translation) {
      if (data.translation.enabled !== undefined) {
        $('#translateEnabled').checked = data.translation.enabled;
      }
      if (data.translation.provider) {
        $('#translationProvider').value = data.translation.provider;
      }
      if (data.translation.apiKey) {
        $('#translationApiKey').value = data.translation.apiKey;
      }
      if (data.translation.baseUrl) {
        $('#translationBaseUrl').value = data.translation.baseUrl;
      }
      if (data.translation.targetLang) {
        $('#translationTargetLang').value = data.translation.targetLang;
      }
      updateTranslationFields();
    }

    if (data.telegram) {
      if (data.telegram.botToken) $('#telegramBotToken').value = data.telegram.botToken;
      if (data.telegram.chatId) $('#telegramChatId').value = data.telegram.chatId;
      if (data.telegram.botToken && data.telegram.chatId) {
        setBotStatus('telegramStatus', 'connected');
      }
    }

    if (data.discord) {
      if (data.discord.botToken) $('#discordBotToken').value = data.discord.botToken;
      if (data.discord.channelId) $('#discordChannelId').value = data.discord.channelId;
      if (data.discord.guildId) $('#discordGuildId').value = data.discord.guildId;
      if (data.discord.webhookUrl) $('#discordWebhookUrl').value = data.discord.webhookUrl;
      if (data.discord.botToken) {
        setBotStatus('discordStatus', 'connected');
      }
    }

    if (data.refreshInterval) {
      $('#refreshInterval').value = data.refreshInterval;
    }

    markClean();
  } catch (err) {
    console.error(err);
  }
}

function updateDefaultModelDisplay() {
  const provider = $('#llmProvider').value;
  const modelSelect = $('#llmModel');
  const defaultModel = DEFAULT_MODELS[provider] || '';

  const existingDefault = modelSelect.querySelector('option[value=""]');
  if (existingDefault) {
    existingDefault.textContent = defaultModel
      ? `${t('settings.defaultModel')} (${defaultModel})`
      : t('settings.defaultModel');
  }

  if (!modelSelect.value && defaultModel) {
    modelSelect.value = '';
  }
}

function updateTranslationFields() {
  const provider = $('#translationProvider').value;
  const apiKeyGroup = $('#translationApiKeyGroup');
  const baseUrlGroup = $('#translationBaseUrlGroup');

  // Show API key field only for DeepL Pro mode
  if (provider === 'deepl-pro') {
    apiKeyGroup.style.display = 'block';
  } else {
    apiKeyGroup.style.display = 'none';
  }

  // Show base URL field only for LibreTranslate
  if (provider === 'libretranslate') {
    baseUrlGroup.style.display = 'block';
  } else {
    baseUrlGroup.style.display = 'none';
  }
}

function setBotStatus(elementId, status) {
  const el = $(`#${elementId}`);
  el.classList.remove('connected', 'disconnected', 'registering');

  if (status === 'connected') {
    el.classList.add('connected');
    el.textContent = t('settings.connected');
    el.setAttribute('data-i18n', 'settings.connected');
  } else if (status === 'registering') {
    el.classList.add('registering');
    el.textContent = t('settings.registering');
    el.setAttribute('data-i18n', 'settings.registering');
  } else {
    el.classList.add('disconnected');
    el.textContent = t('settings.disconnected');
    el.setAttribute('data-i18n', 'settings.disconnected');
  }
}

async function saveSettings() {
  const provider = $('#llmProvider').value;
  const model = $('#llmCustomModel').value || $('#llmModel').value || DEFAULT_MODELS[provider] || '';

  if (provider === 'none') {
    if (!model) {
      alert(t('errors.configRequired'));
      return;
    }
  }

  const apiKeys = {
    FRED_API_KEY: $('#fredApiKey').value,
    FIRMS_MAP_KEY: $('#firmsMapKey').value,
    EIA_API_KEY: $('#eiaApiKey').value,
    ACLED_EMAIL: $('#acledEmail').value,
    ACLED_PASSWORD: $('#acledPassword').value,
    AISSTREAM_API_KEY: $('#aisStreamApiKey').value,
    ADSB_API_KEY: $('#adsbApiKey').value,
    CLOUDFLARE_API_TOKEN: $('#cloudflareApiToken').value,
  };

  const settings = {
    apiKeys,
    llm: {
      provider: provider === 'none' ? 'openai' : provider,
      apiKey: $('#llmApiKey').value,
      model,
    },
    translation: {
      enabled: $('#translateEnabled').checked,
      provider: $('#translationProvider').value,
      apiKey: $('#translationApiKey').value,
      baseUrl: $('#translationBaseUrl').value,
      targetLang: $('#translationTargetLang').value || 'zh',
    },
    telegram: {
      botToken: $('#telegramBotToken').value,
      chatId: $('#telegramChatId').value,
    },
    discord: {
      botToken: $('#discordBotToken').value,
      channelId: $('#discordChannelId').value,
      guildId: $('#discordGuildId').value,
      webhookUrl: $('#discordWebhookUrl').value,
    },
    refreshInterval: parseInt($('#refreshInterval').value, 10) || 15,
  };

  try {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || t('errors.saveFailed'));
    }

    showSaveToast();
    markClean();
    await loadSettings();
  } catch (err) {
    alert(t('errors.saveFailed') + ': ' + err.message);
  }
}

function showSaveToast() {
  const toast = $('#save-toast');
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

async function fetchModels() {
  const provider = $('#llmProvider').value;
  const apiKey = $('#llmApiKey').value;

  if (!provider || provider === 'none') {
    alert(t('settings.selectProvider'));
    return;
  }

  if (!apiKey) {
    alert(t('settings.enterApiKey'));
    return;
  }

  const loading = $('#modelsLoading');
  const btn = $('#fetchModelsBtn');
  const modelSelect = $('#llmModel');

  loading.classList.remove('hidden');
  btn.disabled = true;

  try {
    const res = await fetch(`/api/models?provider=${encodeURIComponent(provider)}&apiKey=${encodeURIComponent(apiKey)}`);
    if (!res.ok) throw new Error('Failed to fetch models');
    const json = await res.json();

    const currentVal = modelSelect.value;
    while (modelSelect.options.length > 1) {
      modelSelect.remove(1);
    }

    if (json.models && json.models.length > 0) {
      json.models.forEach((m) => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        modelSelect.appendChild(opt);
      });

      if (currentVal && json.models.includes(currentVal)) {
        modelSelect.value = currentVal;
      } else if (json.models.length > 0) {
        modelSelect.value = json.models[0];
      }
    } else {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = t('settings.noModelsFound');
      opt.disabled = true;
      modelSelect.appendChild(opt);
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.classList.add('hidden');
    btn.disabled = false;
  }
}

async function registerTelegramWebhook() {
  const botToken = $('#telegramBotToken').value;
  if (!botToken) {
    alert(t('settings.enterApiKey'));
    return;
  }

  setBotStatus('telegramStatus', 'registering');
  const btn = $('#registerTelegramBtn');
  btn.disabled = true;

  try {
    const publicUrl = window.location.origin;
    const res = await fetch('/api/telegram/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botToken, publicUrl }),
    });

    const json = await res.json();
    if (json.status === 'ok') {
      setBotStatus('telegramStatus', 'connected');
    } else {
      setBotStatus('telegramStatus', 'disconnected');
      alert(json.description || t('errors.fetchFailed'));
    }
  } catch (err) {
    setBotStatus('telegramStatus', 'disconnected');
    alert(t('errors.fetchFailed') + ': ' + err.message);
  } finally {
    btn.disabled = false;
  }
}

async function registerDiscordCommands() {
  const botToken = $('#discordBotToken').value;
  const channelId = $('#discordChannelId').value;

  if (!botToken || !channelId) {
    alert(t('settings.enterApiKey'));
    return;
  }

  setBotStatus('discordStatus', 'registering');
  const btn = $('#registerDiscordBtn');
  btn.disabled = true;

  try {
    const guildId = $('#discordGuildId').value;
    const res = await fetch('/api/discord/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botToken, applicationId: channelId, guildId: guildId || undefined }),
    });

    const json = await res.json();
    if (json.status === 'ok') {
      setBotStatus('discordStatus', 'connected');
    } else {
      setBotStatus('discordStatus', 'disconnected');
      alert(json.error || t('errors.fetchFailed'));
    }
  } catch (err) {
    setBotStatus('discordStatus', 'disconnected');
    alert(t('errors.fetchFailed') + ': ' + err.message);
  } finally {
    btn.disabled = false;
  }
}

function setupToggleVisibility() {
  $$('.toggle-visibility').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = $(`#${targetId}`);
      const label = btn.querySelector('span');

      if (input.type === 'password') {
        input.type = 'text';
        label.textContent = t('settings.hide');
        label.setAttribute('data-i18n', 'settings.hide');
      } else {
        input.type = 'password';
        label.textContent = t('settings.show');
        label.setAttribute('data-i18n', 'settings.show');
      }
    });
  });
}

function setupLanguageToggle() {
  const btn = $('#lang-toggle');
  btn.addEventListener('click', async () => {
    const newLocale = getLocale() === 'zh' ? 'en' : 'zh';
    await setLocale(newLocale);
    btn.textContent = newLocale === 'zh' ? 'EN' : '中文';
    updateDefaultModelDisplay();
    const telegramEl = $('#telegramStatus');
    const discordEl = $('#discordStatus');
    if (telegramEl.classList.contains('connected')) {
      telegramEl.textContent = t('settings.connected');
    } else if (telegramEl.classList.contains('disconnected')) {
      telegramEl.textContent = t('settings.disconnected');
    }
    if (discordEl.classList.contains('connected')) {
      discordEl.textContent = t('settings.connected');
    } else if (discordEl.classList.contains('disconnected')) {
      discordEl.textContent = t('settings.disconnected');
    }
  });
}

function setupDirtyTracking() {
  const inputs = $$('.settings-main input, .settings-main select');
  inputs.forEach((input) => {
    const events = input.type === 'checkbox' ? ['change'] : ['input', 'change'];
    events.forEach((evt) => {
      input.addEventListener(evt, markDirty);
    });
  });
}

function init() {
  $('#saveBtn').addEventListener('click', saveSettings);
  $('#fetchModelsBtn').addEventListener('click', fetchModels);
  $('#registerTelegramBtn').addEventListener('click', registerTelegramWebhook);
  $('#registerDiscordBtn').addEventListener('click', registerDiscordCommands);
  $('#llmProvider').addEventListener('change', () => {
    updateDefaultModelDisplay();
    markDirty();
  });
  $('#translationProvider').addEventListener('change', () => {
    updateTranslationFields();
    markDirty();
  });

  setupToggleVisibility();
  setupLanguageToggle();
  setupDirtyTracking();

  // Initialize translation fields visibility
  updateTranslationFields();

  window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

async function boot() {
  await initI18n();
  const locale = getLocale();
  const langBtn = $('#lang-toggle');
  langBtn.textContent = locale === 'zh' ? 'EN' : '中文';
  applyTranslations();
  init();
  await loadSettings();
}

boot();
