import { safeFetchJSON } from '../utils/fetch';
import type { SourceResult } from "../../types";

export async function fetchCfRadarData(apiToken: string): Promise<SourceResult> {
  if (!apiToken) {
    return { name: 'cf-radar', source: 'cf-radar', success: false, error: 'API key not configured', timestamp: new Date().toISOString() };
  }

  try {
    const headers = {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    };

    const [outagesRaw, anomaliesRaw] = await Promise.all([
      safeFetchJSON<any>('https://api.cloudflare.com/client/v4/radar/entities/outages', { headers }, 15_000),
      safeFetchJSON<any>('https://api.cloudflare.com/client/v4/radar/anomalies/time-series', { headers }, 15_000),
    ]);

    const outages: any[] = [];
    const rawOutages = outagesRaw.result ?? outagesRaw.data ?? outagesRaw;
    if (Array.isArray(rawOutages)) {
      for (const o of rawOutages.slice(0, 200)) {
        outages.push({
          country: o.location ?? o.country ?? o.countryCode ?? '',
          asn: o.asn ?? o.network ?? o.asnName ?? '',
          startDate: o.startDate ?? o.start ?? o.startTime ?? '',
          endDate: o.endDate ?? o.end ?? o.endTime ?? '',
          type: o.type ?? o.outageType ?? 'internet',
        });
      }
    }

    const anomalies: any[] = [];
    const rawAnomalies = anomaliesRaw.result ?? anomaliesRaw.data ?? anomaliesRaw;
    if (Array.isArray(rawAnomalies)) {
      for (const a of rawAnomalies.slice(0, 200)) {
        anomalies.push({
          country: a.location ?? a.country ?? a.countryCode ?? '',
          metric: a.metric ?? a.metricName ?? a.dimension ?? '',
          value: a.value ?? a.anomalyValue ?? 0,
          baseline: a.baseline ?? a.expectedValue ?? a.normalValue ?? 0,
        });
      }
    }

    return {
      name: 'cf-radar', source: 'cf-radar',
      success: true,
      data: { outages, anomalies },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'cf-radar', source: 'cf-radar',
      success: false,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };
  }
}
