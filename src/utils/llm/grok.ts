import { safeFetch } from '../utils/fetch';

interface GrokChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokChatResponse {
  choices: { message: { content: string }; finish_reason: string }[];
}

interface GrokModelsResponse {
  data: { id: string }[];
}

export async function callGrok(
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  const messages: GrokChatMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  const response = await safeFetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
    throw new Error(`Grok API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as GrokChatResponse;
  return data.choices[0]?.message?.content ?? '';
}

export async function fetchGrokModels(apiKey: string): Promise<string[]> {
  const response = await safeFetch('https://api.x.ai/v1/models', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  }, 15000);

  if (!response.ok) {
    throw new Error(`Grok models API error ${response.status}`);
  }

  const data = (await response.json()) as GrokModelsResponse;
  return data.data.map((m) => m.id);
}
