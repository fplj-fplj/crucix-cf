import { safeFetchJSON } from '../utils/fetch';
import type { SourceResult } from "../../types";

interface EiaDataPoint {
  period: string;
  value: number | null;
  'unit-abbr': string;
}

interface EiaResponse {
  response: {
    data: EiaDataPoint[];
  };
}

const EIA_SERIES = [
  {
    id: 'crude-inventory',
    name: 'Crude Oil Inventories',
    route: 'petroleum/stoc/wstk',
    unit: 'MBBL',
  },
  {
    id: 'natgas-inventory',
    name: 'Natural Gas Inventories',
    route: 'natural-gas/stor/wkly',
    unit: 'BCF',
  },
  {
    id: 'refinery-utilization',
    name: 'Refinery Utilization',
    route: 'petroleum/refining/cap-util',
    unit: '%',
  },
  {
    id: 'crude-production',
    name: 'Crude Oil Production',
    route: 'petroleum/crude/production',
    unit: 'MBBL/D',
  },
] as const;

export async function fetchEiaData(apiKey: string): Promise<SourceResult> {
  if (!apiKey) {
    return {
      name: 'eia', source: 'eia',
      success: false,
      error: 'API key not configured',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const requests = EIA_SERIES.map((s) => {
      const url = `https://api.eia.gov/v2/${s.route}?api_key=${apiKey}&frequency=weekly&sort[0][column]=period&sort[0][direction]=desc&length=1`;
      return safeFetchJSON<EiaResponse>(url).then((res) => ({
        meta: s,
        data: res.response?.data || [],
      }));
    });

    const results = await Promise.allSettled(requests);

    const series = results.map((r, i) => {
      const meta = EIA_SERIES[i];

      if (r.status === 'rejected') {
        return {
          id: meta.id,
          name: meta.name,
          value: null,
          date: null,
          unit: meta.unit,
        };
      }

      const point = r.value.data[0];
      return {
        id: meta.id,
        name: meta.name,
        value: point?.value ?? null,
        date: point?.period ?? null,
        unit: point?.['unit-abbr'] ?? meta.unit,
      };
    });

    return {
      name: 'eia', source: 'eia',
      success: true,
      data: { series },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'eia', source: 'eia',
      success: false,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };
  }
}
