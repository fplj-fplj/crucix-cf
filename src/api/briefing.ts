import type { Env } from '../types';
import { getBriefing } from '../utils/kv';

export default async function handleBriefing(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  try {
    const briefing = await getBriefing(env.BRIEFING_KV);
    if (!briefing) {
      return new Response(JSON.stringify({ status: 'no_data', message: 'No briefing available yet' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ status: 'ok', data: briefing }), {
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
}
