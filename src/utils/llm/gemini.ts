import { safeFetch } from '../utils/fetch';

interface GeminiContent {
  parts: { text: string }[];
}

interface GeminiResponse {
  candidates: { content: GeminiContent }[];
}

interface GeminiModelsResponse {
  models: { name: string; supportedGenerationMethods: string[] }[];
}

export async function callGemini(
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await safeFetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  }, 30000);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as GeminiResponse;
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .join('') ?? ''
  );
}

export async function fetchGeminiModels(apiKey: string): Promise<string[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  const response = await safeFetch(url, {}, 15000);

  if (!response.ok) {
    throw new Error(`Gemini models API error ${response.status}`);
  }

  const data = (await response.json()) as GeminiModelsResponse;
  return data.models
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => m.name.replace('models/', ''));
}
