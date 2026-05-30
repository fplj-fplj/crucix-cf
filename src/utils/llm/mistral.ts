import { safeFetch } from '../utils/fetch';

interface MistralChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface MistralChatResponse {
  choices: { message: { content: string }; finish_reason: string }[];
}

interface MistralModelsResponse {
  data: { id: string }[];
}

export async function callMistral(
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  const messages: MistralChatMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  const response = await safeFetch('https://api.mistral.ai/v1/chat/completions', {
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
    throw new Error(`Mistral API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as MistralChatResponse;
  return data.choices[0]?.message?.content ?? '';
}

export async function fetchMistralModels(apiKey: string): Promise<string[]> {
  const response = await safeFetch('https://api.mistral.ai/v1/models', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  }, 15000);

  if (!response.ok) {
    throw new Error(`Mistral models API error ${response.status}`);
  }

  const data = (await response.json()) as MistralModelsResponse;
  return data.data.map((m) => m.id);
}
