import { safeFetchJSON } from '../utils/fetch';
import type { SourceResult } from "../../types";

interface FirmsFirePoint {
  latitude: number;
  longitude: number;
  frp: number;
  confidence: string;
  acq_date: string;
  acq_time: string;
  daynight: string;
  country_id: string;
}

export async function fetchFirmsData(mapKey: string): Promise<SourceResult> {
  if (!mapKey) {
    return {
      name: 'firms', source: 'firms',
      success: false,
      error: 'API key not configured',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const fires = await safeFetchJSON<FirmsFirePoint[]>(
      `https://firms.modaps.eosdis.nasa.gov/api/area/json/${mapKey}/VIIRS_SNPP_NRT/world/1`,
    );

    const regionMap = new Map<string, { count: number; maxFrp: number }>();
    let nightDetections = 0;

    for (const fire of fires) {
      const region = fire.country_id || 'Unknown';
      const entry = regionMap.get(region) || { count: 0, maxFrp: 0 };
      entry.count += 1;
      entry.maxFrp = Math.max(entry.maxFrp, fire.frp);
      regionMap.set(region, entry);

      if (fire.daynight === 'N') {
        nightDetections += 1;
      }
    }

    const regions = Array.from(regionMap.entries())
      .map(([name, val]) => ({ name, count: val.count, maxFrp: val.maxFrp }))
      .sort((a, b) => b.count - a.count);

    const topFires = [...fires]
      .sort((a, b) => b.frp - a.frp)
      .slice(0, 10)
      .map((f) => ({
        lat: f.latitude,
        lng: f.longitude,
        frp: f.frp,
        confidence: f.confidence,
        acqDate: f.acq_date,
        acqTime: f.acq_time,
      }));

    return {
      name: 'firms', source: 'firms',
      success: true,
      data: {
        total: fires.length,
        regions,
        nightDetections,
        topFires,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'firms', source: 'firms',
      success: false,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };
  }
}
