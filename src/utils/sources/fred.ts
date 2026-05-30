import { safeFetchJSON } from '../utils/fetch';
import type { SourceResult } from "../../types";

interface FredObservation {
  realtime_start: string;
  realtime_end: string;
  date: string;
  value: string;
}

interface FredSeriesResponse {
  observations: FredObservation[];
  series_id: string;
  title?: string;
  units?: string;
}

const FRED_SERIES = [
  { id: 'VIXCLS', title: 'CBOE Volatility Index (VIX)', unit: 'Index' },
  { id: 'BAMLH0A0HYM2', title: 'High Yield Spread', unit: 'Percent' },
  { id: 'DTWEXBGS', title: 'Trade Weighted U.S. Dollar Index', unit: 'Index' },
  { id: 'ICSA', title: 'Initial Jobless Claims', unit: 'Number' },
  { id: 'CPIAUCSL', title: 'Consumer Price Index', unit: 'Index' },
  { id: 'WM2NS', title: 'M2 Money Stock', unit: 'Billions of Dollars' },
  { id: 'MORTGAGE30US', title: '30-Year Fixed Rate Mortgage', unit: 'Percent' },
  { id: 'GSCPI', title: 'Global Supply Chain Pressure Index', unit: 'Index' },
] as const;

export async function fetchFredData(apiKey: string): Promise<SourceResult> {
  if (!apiKey) {
    return {
      name: 'fred', source: 'fred',
      success: false,
      error: 'API key not configured',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const requests = FRED_SERIES.map((s) => {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${s.id}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=2`;
      return safeFetchJSON<FredSeriesResponse>(url).then((res) => ({
        meta: s,
        observations: res.observations || [],
      }));
    });

    const results = await Promise.allSettled(requests);

    const series = results.map((r, i) => {
      const meta = FRED_SERIES[i];

      if (r.status === 'rejected') {
        return {
          id: meta.id,
          title: meta.title,
          value: null,
          date: null,
          unit: meta.unit,
          change: null,
        };
      }

      const obs = r.value.observations;
      const latest = obs[0];
      const previous = obs[1];

      const latestVal = latest ? parseFloat(latest.value) : null;
      const prevVal = previous ? parseFloat(previous.value) : null;
      const change =
        latestVal !== null && prevVal !== null && !isNaN(latestVal) && !isNaN(prevVal)
          ? parseFloat((latestVal - prevVal).toFixed(4))
          : null;

      return {
        id: meta.id,
        title: meta.title,
        value: latestVal !== null && !isNaN(latestVal) ? latestVal : null,
        date: latest?.date ?? null,
        unit: meta.unit,
        change,
      };
    });

    return {
      name: 'fred', source: 'fred',
      success: true,
      data: { series },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'fred', source: 'fred',
      success: false,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };
  }
}
