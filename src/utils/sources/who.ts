import { safeFetchJSON } from '../utils/fetch';
import type { SourceResult } from "../../types";

interface WhoOutbreak {
  Id: number;
  Title: string;
  Date: string;
  Country: string;
  Disease: string;
  Severity: string;
  URL: string;
}

export async function fetchWhoData(): Promise<SourceResult> {
  try {
    const data = await safeFetchJSON<WhoOutbreak[]>(
      'https://ghoapi.azureedge.net/api/DiseaseOutbreak',
    );

    const outbreaks = Array.isArray(data) ? data : [];

    const alerts = outbreaks.map((o) => ({
      title: o.Title || 'Unknown outbreak',
      date: o.Date || null,
      country: o.Country || 'Unknown',
      disease: o.Disease || 'Unknown',
      severity: o.Severity || 'unknown',
    }));

    return {
      name: 'who', source: 'who',
      success: true,
      data: { alerts },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'who', source: 'who',
      success: false,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };
  }
}
