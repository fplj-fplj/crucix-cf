import { LLMConfig, LLMProvider } from "../../types";
import { callAnthropic, fetchAnthropicModels } from './anthropic';
import { callOpenAI, fetchOpenAIModels } from './openai';
import { callGemini, fetchGeminiModels } from './gemini';
import { callOpenRouter, fetchOpenRouterModels } from './openrouter';
import { callMiniMax, fetchMiniMaxModels } from './minimax';
import { callMistral, fetchMistralModels } from './mistral';
import { callGrok, fetchGrokModels } from './grok';

export class LLMError extends Error {
  provider: LLMProvider;
  retryable: boolean;

  constructor(provider: LLMProvider, message: string, retryable: boolean) {
    super(message);
    this.name = 'LLMError';
    this.provider = provider;
    this.retryable = retryable;
  }
}

const DEFAULT_MODELS: Record<string, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  gemini: 'gemini-1.5-pro',
  openrouter: 'openrouter/auto',
  minimax: 'MiniMax-Text-01',
  mistral: 'mistral-large-latest',
  grok: 'grok-3-latest',
};

export function getDefaultModel(provider: LLMProvider): string {
  return DEFAULT_MODELS[provider] ?? 'gpt-4o';
}

function getApiKey(config: LLMConfig, provider: string): string {
  // 检查两种格式：apiKey (单一) 或 apiKeys (映射)
  if (config.apiKey) {
    return config.apiKey;
  }
  if (config.apiKeys && config.apiKeys[provider]) {
    return config.apiKeys[provider];
  }
  throw new Error(`API key not found for provider: ${provider}`);
}

export async function callLLM(
  config: LLMConfig,
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  const model = config.model || getDefaultModel(config.provider);

  try {
    switch (config.provider) {
      case LLMProvider.ANTHROPIC:
      case LLMProvider.Anthropic:
        return await callAnthropic(getApiKey(config, 'anthropic'), model, prompt, systemPrompt);

      case LLMProvider.OPENAI:
      case LLMProvider.OpenAI:
        return await callOpenAI(getApiKey(config, 'openai'), model, prompt, systemPrompt);

      case LLMProvider.GEMINI:
      case LLMProvider.Gemini:
        return await callGemini(getApiKey(config, 'gemini'), model, prompt, systemPrompt);

      case LLMProvider.OPENROUTER:
      case LLMProvider.OpenRouter:
        return await callOpenRouter(getApiKey(config, 'openrouter'), model, prompt, systemPrompt);

      case LLMProvider.MINIMAX:
      case LLMProvider.MiniMax:
        return await callMiniMax(getApiKey(config, 'minimax'), model, prompt, systemPrompt);

      case LLMProvider.MISTRAL:
      case LLMProvider.Mistral:
        return await callMistral(getApiKey(config, 'mistral'), model, prompt, systemPrompt);

      case LLMProvider.GROK:
      case LLMProvider.Grok:
        return await callGrok(getApiKey(config, 'grok'), model, prompt, systemPrompt);

      default:
        throw new LLMError(
          config.provider,
          `Unsupported LLM provider: ${config.provider}`,
          false,
        );
    }
  } catch (err) {
    if (err instanceof LLMError) {
      throw err;
    }

    const message = err instanceof Error ? err.message : String(err);
    const retryable = message.includes('timeout') ||
      message.includes('429') ||
      message.includes('503') ||
      message.includes('500');

    throw new LLMError(config.provider, message, retryable);
  }
}

export async function fetchAvailableModels(config: LLMConfig): Promise<string[]> {
  switch (config.provider) {
    case LLMProvider.ANTHROPIC:
    case LLMProvider.Anthropic:
      return fetchAnthropicModels(getApiKey(config, 'anthropic'));

    case LLMProvider.OPENAI:
    case LLMProvider.OpenAI:
      return fetchOpenAIModels(getApiKey(config, 'openai'));

    case LLMProvider.GEMINI:
    case LLMProvider.Gemini:
      return fetchGeminiModels(getApiKey(config, 'gemini'));

    case LLMProvider.OPENROUTER:
    case LLMProvider.OpenRouter:
      return fetchOpenRouterModels(getApiKey(config, 'openrouter'));

    case LLMProvider.MINIMAX:
    case LLMProvider.MiniMax:
      return fetchMiniMaxModels(getApiKey(config, 'minimax'));

    case LLMProvider.MISTRAL:
    case LLMProvider.Mistral:
      return fetchMistralModels(getApiKey(config, 'mistral'));

    case LLMProvider.GROK:
    case LLMProvider.Grok:
      return fetchGrokModels(getApiKey(config, 'grok'));

    default:
      return [];
  }
}
