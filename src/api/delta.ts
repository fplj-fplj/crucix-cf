import type { Env } from '../types';
import { getDelta } from '../utils/kv';

export default async function handleDelta(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  try {
    const delta = await getDelta(env.BRIEFING_KV);
    return new Response(JSON.stringify({ status: 'ok', data: delta }), {
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
