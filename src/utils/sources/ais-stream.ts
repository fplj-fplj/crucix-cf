import { safeFetchJSON } from '../utils/fetch';
import type { SourceResult } from "../../types";

const CHOKEPOINT_REGIONS = [
  { name: 'Strait of Hormuz', lat: 26.56, lng: 56.25, radius: 1.5 },
  { name: 'Strait of Malacca', lat: 1.35, lng: 103.8, radius: 1.5 },
  { name: 'Suez Canal', lat: 30.47, lng: 32.35, radius: 1.0 },
  { name: 'Panama Canal', lat: 9.08, lng: -79.68, radius: 1.0 },
  { name: 'Bab el-Mandeb', lat: 12.58, lng: 43.33, radius: 1.0 },
  { name: 'Turkish Straits', lat: 41.02, lng: 28.98, radius: 0.8 },
  { name: 'Strait of Gibraltar', lat: 35.95, lng: -5.61, radius: 0.8 },
  { name: 'Lombok Strait', lat: -8.55, lng: 115.85, radius: 0.8 },
];

function isInRadius(vLat: number, vLng: number, cLat: number, cLng: number, radius: number): boolean {
  const dLat = vLat - cLat;
  const dLng = vLng - cLng;
  return dLat * dLat + dLng * dLng < radius * radius;
}

export async function fetchAisData(apiKey: string): Promise<SourceResult> {
  if (!apiKey) {
    return { name: 'ais-stream', source: 'ais-stream', success: false, error: 'API key not configured', timestamp: new Date().toISOString() };
  }

  try {
    const result = await safeFetchJSON<any>(
      'https://aisstream.io/api/v1/lastposition',
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
      15_000,
    );

    const raw = Array.isArray(result) ? result : result?.vessels ?? result?.data ?? [];

    const vessels = raw.slice(0, 5000).map((v: any) => ({
      mmsi: v.MMSI ?? v.mmsi ?? '',
      name: v.NAME ?? v.name ?? v.shipName ?? '',
      lat: v.LATITUDE ?? v.lat ?? v.latitude ?? 0,
      lng: v.LONGITUDE ?? v.lng ?? v.longitude ?? 0,
      speed: v.SOG ?? v.speed ?? 0,
      course: v.COG ?? v.course ?? 0,
      type: v.TYPE ?? v.type ?? v.shipType ?? '',
    }));

    const chokepoints = CHOKEPOINT_REGIONS.map((cp) => {
      const count = vessels.filter((v: any) => isInRadius(v.lat, v.lng, cp.lat, cp.lng, cp.radius)).length;
      return { name: cp.name, lat: cp.lat, lng: cp.lng, vesselCount: count };
    });

    const typeMap = new Map<string, number>();
    for (const v of vessels) {
      const t = v.type || 'Unknown';
      typeMap.set(t, (typeMap.get(t) ?? 0) + 1);
    }
    const byType = Array.from(typeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      name: 'ais-stream', source: 'ais-stream',
      success: true,
      data: { vessels, chokepoints, byType },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'ais-stream', source: 'ais-stream',
      success: false,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };
  }
}
