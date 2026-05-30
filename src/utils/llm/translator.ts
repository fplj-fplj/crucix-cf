import { safeFetch } from '../utils/fetch';

export interface TranslationConfig {
  provider: string;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface TranslationResult {
  translated: string;
  sourceLang: string | null;
}

const CJK_RANGES = /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/;

export function detectLanguage(text: string): string | null {
  if (CJK_RANGES.test(text)) {
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
      return 'ja';
    }
    if (/[\uac00-\ud7af]/.test(text)) {
      return 'ko';
    }
    return 'zh';
  }
  return null;
}

const CJK_LANGS = new Set(['zh', 'ja', 'ko']);

function isSameLanguageFamily(detected: string | null, target: string): boolean {
  if (!detected) return false;
  if (detected === target) return true;
  if (CJK_LANGS.has(detected) && CJK_LANGS.has(target)) {
    return detected === target;
  }
  return false;
}

async function translateGoogle(
  text: string,
  targetLang: string,
): Promise<TranslationResult> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  const response = await safeFetch(url, { method: 'GET' }, 15000);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Google Translation API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as [
    Array<[string, string, string, string, number]>,
    string | null,
  ];

  let translated = '';
  for (const part of data[0] || []) {
    translated += part[0] || '';
  }

  return {
    translated: translated || text,
    sourceLang: data[1] ?? null,
  };
}

async function translateMicrosoft(
  text: string,
  targetLang: string,
): Promise<TranslationResult> {
  const url = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${targetLang}`;
  const response = await safeFetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify([{ text }]),
  }, 15000);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Microsoft Translation API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    translations: { text: string; to: string }[];
    detectedLanguage?: { language: string };
  }[];

  return {
    translated: data[0]?.translations[0]?.text ?? text,
    sourceLang: data[0]?.detectedLanguage?.language ?? null,
  };
}

async function translateDeepL(
  text: string,
  targetLang: string,
  apiKey?: string,
): Promise<TranslationResult> {
  const url = apiKey
    ? `https://api.deepl.com/v2/translate`
    : `https://api-free.deepl.com/v2/translate`;
  
  const response = await safeFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(apiKey ? { 'Authorization': `DeepL-Auth-Key ${apiKey}` } : {}),
    },
    body: `text=${encodeURIComponent(text)}&target_lang=${targetLang.toUpperCase()}`,
  }, 15000);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`DeepL API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    translations: { text: string; detected_source_language: string }[];
  };

  return {
    translated: data.translations?.[0]?.text ?? text,
    sourceLang: data.translations?.[0]?.detected_source_language ?? null,
  };
}

async function translateMyMemory(
  text: string,
  targetLang: string,
): Promise<TranslationResult> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`;
  const response = await safeFetch(url, { method: 'GET' }, 15000);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`MyMemory API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    responseData?: { translatedText: string };
    responseStatus: number;
    responseDetails?: string;
  };

  if (data.responseStatus !== 200) {
    throw new Error(data.responseDetails || 'Translation failed');
  }

  return {
    translated: data.responseData?.translatedText ?? text,
    sourceLang: null,
  };
}

async function translateLibreTranslate(
  text: string,
  targetLang: string,
  baseUrl = 'https://libretranslate.de',
): Promise<TranslationResult> {
  const url = `${baseUrl}/translate`;
  const response = await safeFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, source: 'auto', target: targetLang, format: 'text' }),
  }, 15000);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`LibreTranslate API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as { translatedText: string; detectedLanguage?: { language: string } };

  return {
    translated: data.translatedText ?? text,
    sourceLang: data.detectedLanguage?.language ?? null,
  };
}

function normalizeConfig(config?: TranslationConfig): TranslationConfig {
  if (!config) {
    return { provider: 'google' };
  }
  const validProviders = ['google', 'microsoft', 'deepl', 'deepl-pro', 'mymemory', 'libretranslate', 'none'];
  return {
    provider: validProviders.includes(config.provider)
      ? config.provider
      : 'google',
    apiKey: config.apiKey,
    model: config.model,
    baseUrl: config.baseUrl,
  };
}

export async function translateText(
  text: string,
  targetLang: string,
  config?: TranslationConfig,
): Promise<TranslationResult> {
  const normalized = normalizeConfig(config);

  if (normalized.provider === 'none') {
    return { translated: text, sourceLang: detectLanguage(text) };
  }

  const detected = detectLanguage(text);
  if (isSameLanguageFamily(detected, targetLang)) {
    return { translated: text, sourceLang: detected };
  }

  try {
    switch (normalized.provider) {
      case 'google':
        return await translateGoogle(text, targetLang);

      case 'microsoft':
        return await translateMicrosoft(text, targetLang);

      case 'deepl':
        return await translateDeepL(text, targetLang);

      case 'deepl-pro':
        return await translateDeepL(text, targetLang, normalized.apiKey);

      case 'mymemory':
        return await translateMyMemory(text, targetLang);

      case 'libretranslate':
        return await translateLibreTranslate(text, targetLang, normalized.baseUrl);

      default:
        return await translateGoogle(text, targetLang);
    }
  } catch (err) {
    throw err;
  }
}
