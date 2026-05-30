import { safeFetchJSON } from '../utils/fetch';
import type { SourceResult } from "../../types";

interface EpaRadnetRow {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  reading: number;
  unit: string;
  status: string;
}

export async function fetchEpaRadnetData(): Promise<SourceResult> {
  try {
    const data = await safeFetchJSON<EpaRadnetRow[]>(
      'https://enviro.epa.gov/enviro/efservice/RADNET_COMBINED/ROWS/0:100/JSON',
    );

    const monitors = (data || []).map((row) => ({
      city: row.city || 'Unknown',
      state: row.state || 'Unknown',
      lat: row.latitude ?? null,
      lng: row.longitude ?? null,
      reading: row.reading ?? null,
      unit: row.unit || 'pCi/L',
      status: row.status || 'normal',
    }));

    return {
      name: 'epa-radnet', source: 'epa-radnet',
      success: true,
      data: { monitors },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'epa-radnet', source: 'epa-radnet',
      success: false,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };
  }
}
