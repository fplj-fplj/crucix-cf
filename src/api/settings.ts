import type { Env, Settings } from '../types';
import { getSettings, setSettings } from '../utils/kv';

function maskApiKey(key: string): string {
  if (!key || key.length <= 4) return '****';
  return '*'.repeat(key.length - 4) + key.slice(-4);
}

function maskSettings(settings: Settings): Record<string, unknown> {
  const masked: Record<string, unknown> = JSON.parse(JSON.stringify(settings));

  if (settings.llm?.apiKeys) {
    const maskedKeys: Record<string, string> = {};
    for (const [k, v] of Object.entries(settings.llm.apiKeys)) {
      maskedKeys[k] = maskApiKey(v);
    }
    (masked.llm as any).apiKeys = maskedKeys;
  }

  if (settings.bots?.telegram?.botToken) {
    (masked.bots as any).telegram.botToken = maskApiKey(settings.bots.telegram.botToken);
  }

  if (settings.bots?.discord?.botToken) {
    (masked.bots as any).discord.botToken = maskApiKey(settings.bots.discord.botToken);
  }

  return masked;
}

export default async function handleSettings(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method === 'GET') {
    try {
      const settings = await getSettings(env.CONFIG_KV, env);

      if (!settings) {
        return new Response(
          JSON.stringify({ status: 'no_data', message: 'No settings found' }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      return new Response(JSON.stringify({ status: 'ok', data: maskSettings(settings) }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: err instanceof Error ? err.message : 'Internal error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  } else if (request.method === 'PUT') {
    try {
      const body = (await request.json()) as Partial<Settings>;

      if (!body.sweep || !body.llm) {
        return new Response(
          JSON.stringify({ status: 'error', message: 'Missing required fields' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      if (!body.llm.provider || !body.llm.model) {
        return new Response(
          JSON.stringify({ status: 'error', message: 'Missing required LLM fields: provider, model' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      const settings: Settings = {
        llm: body.llm,
        translation: body.translation || {
          provider: 'free',
          targetLanguage: 'zh',
          enabled: false,
        },
        sweep: body.sweep,
        alerts: body.alerts || {
          enabled: true,
          thresholds: {
            severity: 'medium',
            cooldownMinutes: 30,
          },
        },
        bots: body.bots || {
          telegram: { enabled: false, botToken: '', chatId: '' },
          discord: { enabled: false, webhookUrl: '', botToken: '', applicationId: '' },
        },
      };

      await setSettings(env.CONFIG_KV, settings, env);

      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: err instanceof Error ? err.message : 'Internal error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  } else {
    return new Response('Method Not Allowed', { status: 405 });
  }
}
