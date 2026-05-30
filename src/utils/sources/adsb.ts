import { safeFetchJSON } from '../utils/fetch';
import type { SourceResult } from "../../types";

interface AdsbAircraft {
  hex: string;
  type: string;
  flight: string | null;
  r: string;
  t: string;
  origin_country: string;
  lat: number | null;
  lng: number | null;
  alt_baro: number | string | null;
  alt_geom: number | null;
  gs: number | null;
  track: number | null;
  bar_rate: number | null;
}

interface AdsbResponse {
  ac: AdsbAircraft[];
  total: number;
  ctime: number;
  ptime: number;
  msg: string;
  now: number;
}

export async function fetchAdsbData(apiKey: string): Promise<SourceResult> {
  if (!apiKey) {
    return {
      name: 'adsb', source: 'adsb',
      success: false,
      error: 'API key not configured',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const result = await safeFetchJSON<AdsbResponse>(
      'https://adsbexchange-com1.p.rapidapi.com/v2/icao/',
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'adsbexchange-com1.p.rapidapi.com',
        },
      },
    );

    const aircraft = result.ac || [];

    const countryDist = new Map<string, number>();
    let highAlt = 0;
    let lowAlt = 0;
    let noCallsign = 0;

    for (const ac of aircraft) {
      const country = ac.origin_country || 'Unknown';
      countryDist.set(country, (countryDist.get(country) || 0) + 1);
      const alt = typeof ac.alt_baro === 'number' ? ac.alt_baro : null;
      if (alt !== null) {
        if (alt > 30000) highAlt += 1;
        else if (alt < 5000) lowAlt += 1;
      }
      if (!ac.flight || ac.flight.trim() === '') noCallsign += 1;
    }

    const topCountries = Array.from(countryDist.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([country, count]) => ({ country, count }));

    const hotspotGrid = new Map<string, { lat: number; lng: number; count: number }>();
    for (const ac of aircraft) {
      if (ac.lat === null || ac.lng === null) continue;
      const gridLat = Math.floor(ac.lat / 2) * 2;
      const gridLng = Math.floor(ac.lng / 2) * 2;
      const key = `${gridLat},${gridLng}`;
      const cell = hotspotGrid.get(key) || { lat: gridLat + 1, lng: gridLng + 1, count: 0 };
      cell.count += 1;
      hotspotGrid.set(key, cell);
    }

    const hotspots = Array.from(hotspotGrid.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((h) => ({ lat: h.lat, lng: h.lng, count: h.count, label: `Grid ${h.lat},${h.lng}` }));

    return {
      name: 'adsb', source: 'adsb',
      success: true,
      data: {
        totalAircraft: aircraft.length,
        altitudeDistribution: { high: highAlt, low: lowAlt },
        noCallsign,
        topCountries,
        hotspots,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'adsb', source: 'adsb',
      success: false,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };
  }
}
