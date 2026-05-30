import { safeFetch } from '../utils/fetch';

interface MiniMaxChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface MiniMaxChatResponse {
  choices: { message: { content: string }; finish_reason: string }[];
}

interface MiniMaxModelsResponse {
  data: { id: string }[];
}

export async function callMiniMax(
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  const messages: MiniMaxChatMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  const response = await safeFetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
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
    throw new Error(`MiniMax API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as MiniMaxChatResponse;
  return data.choices[0]?.message?.content ?? '';
}

export async function fetchMiniMaxModels(apiKey: string): Promise<string[]> {
  const response = await safeFetch('https://api.minimax.chat/v1/models', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  }, 15000);

  if (!response.ok) {
    throw new Error(`MiniMax models API error ${response.status}`);
  }

  const data = (await response.json()) as MiniMaxModelsResponse;
  return data.data.map((m) => m.id);
}
