import type { Env, Settings, BriefingData, DeltaData, Alert, SourceResult } from '../types';
import { getSweepStatus, setSweepStatus, getSettings, getBriefing, setBriefing, setDelta, addAlertsToHistory } from '../utils/kv';
import { runSweep, computeDelta } from '../utils/sweep/orchestrator';
import { classifyAlerts } from '../utils/alerts/classifier';
import { deduplicateAlerts } from '../utils/alerts/dedup';

export default async function handleSweep(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const status = await getSweepStatus(env.BRIEFING_KV);

    if (status?.isSweeping) {
      return new Response(JSON.stringify({ status: 'sweep_in_progress' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await setSweepStatus(env.BRIEFING_KV, {
      lastSweep: status?.lastSweep ?? new Date().toISOString(),
      nextSweep: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      sourceCount: status?.sourceCount ?? 0,
      healthySources: status?.healthySources ?? 0,
      isSweeping: true,
    });

    try {
      const settings = await getSettings(env.CONFIG_KV, env);
      if (!settings) {
        return new Response(JSON.stringify({ status: 'error', message: 'No settings configured' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const previousBriefing = await getBriefing(env.BRIEFING_KV);

      const sweepResult = await runSweep(settings);
      const briefing = sweepResult.briefing;
      const results = sweepResult.sourceResults;
      
      const delta: DeltaData = computeDelta(briefing, previousBriefing);
      briefing.sweepDelta = delta;
      
      await setBriefing(env.BRIEFING_KV, briefing);
      await setDelta(env.BRIEFING_KV, delta);

      let alerts = await classifyAlerts(delta, briefing, settings?.llm);
      alerts = deduplicateAlerts(alerts);

      if (alerts.length > 0) {
        await addAlertsToHistory(env.BRIEFING_KV, alerts);
      }

      const healthySources = results.filter((r: SourceResult) => r.success).length;
      await setSweepStatus(env.BRIEFING_KV, {
        lastSweep: new Date().toISOString(),
        nextSweep: new Date(Date.now() + (settings?.sweep?.intervalMinutes ?? 15) * 60 * 1000).toISOString(),
        sourceCount: results.length,
        healthySources,
        isSweeping: false,
      });

      return new Response(JSON.stringify({ status: 'ok', briefing }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      await setSweepStatus(env.BRIEFING_KV, {
        lastSweep: status?.lastSweep ?? new Date().toISOString(),
        nextSweep: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        sourceCount: status?.sourceCount ?? 0,
        healthySources: status?.healthySources ?? 0,
        isSweeping: false,
      });

      throw err;
    }
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
