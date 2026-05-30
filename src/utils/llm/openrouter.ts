import { safeFetch } from '../utils/fetch';

interface OpenRouterChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterChatResponse {
  choices: { message: { content: string }; finish_reason: string }[];
}

interface OpenRouterModelsResponse {
  data: { id: string; name: string }[];
}

export async function callOpenRouter(
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  const messages: OpenRouterChatMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  const response = await safeFetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://crucix.live',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages,
    }),
  }, 30000);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as OpenRouterChatResponse;
  return data.choices[0]?.message?.content ?? '';
}

export async function fetchOpenRouterModels(apiKey: string): Promise<string[]> {
  const response = await safeFetch('https://openrouter.ai/api/v1/models', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  }, 15000);

  if (!response.ok) {
    throw new Error(`OpenRouter models API error ${response.status}`);
  }

  const data = (await response.json()) as OpenRouterModelsResponse;
  return data.data.map((m) => m.id);
}
