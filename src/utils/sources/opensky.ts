import { safeFetchJSON } from '../utils/fetch';
import type { SourceResult } from "../../types";

interface OpenSkyState {
  icao24: string;
  callsign: string | null;
  origin_country: string;
  time_position: number | null;
  last_contact: number;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  on_ground: boolean;
  velocity: number | null;
  heading: number | null;
  vertical_rate: number | null;
}

interface OpenSkyResponse {
  time: number;
  states: OpenSkyState[];
}

interface TheaterDef {
  name: string;
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

const THEATERS: TheaterDef[] = [
  { name: 'Middle East', latMin: 12, latMax: 42, lngMin: 25, lngMax: 63 },
  { name: 'Eastern Europe', latMin: 44, latMax: 60, lngMin: 22, lngMax: 42 },
  { name: 'South China Sea', latMin: 0, latMax: 25, lngMin: 100, lngMax: 125 },
  { name: 'Korean Peninsula', latMin: 33, latMax: 43, lngMin: 124, lngMax: 131 },
  { name: 'North Africa', latMin: 15, latMax: 37, lngMin: -18, lngMax: 35 },
  { name: 'South Asia', latMin: 5, latMax: 37, lngMin: 60, lngMax: 98 },
];

export async function fetchOpenSkyData(): Promise<SourceResult> {
  try {
    const result = await safeFetchJSON<OpenSkyResponse>(
      'https://opensky-network.org/api/states/all',
    );

    const states = result.states || [];

    const theaters = THEATERS.map((theater) => {
      const inTheater = states.filter(
        (s) =>
          !s.on_ground &&
          s.latitude !== null &&
          s.longitude !== null &&
          s.latitude >= theater.latMin &&
          s.latitude <= theater.latMax &&
          s.longitude >= theater.lngMin &&
          s.longitude <= theater.lngMax,
      );

      const countryCount = new Map<string, number>();
      let highAlt = 0;
      let noCallsign = 0;

      for (const s of inTheater) {
        const c = s.origin_country || 'Unknown';
        countryCount.set(c, (countryCount.get(c) || 0) + 1);
        if (s.baro_altitude !== null && s.baro_altitude > 10000) highAlt += 1;
        if (!s.callsign || s.callsign.trim() === '') noCallsign += 1;
      }

      const topCountries = Array.from(countryCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([country, count]) => ({ country, count }));

      return {
        name: theater.name,
        count: inTheater.length,
        highAlt,
        noCallsign,
        topCountries,
      };
    });

    const hotspotGrid = new Map<string, { lat: number; lng: number; count: number }>();
    for (const s of states) {
      if (s.on_ground || s.latitude === null || s.longitude === null) continue;
      const gridLat = Math.floor(s.latitude / 2) * 2;
      const gridLng = Math.floor(s.longitude / 2) * 2;
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
      name: 'opensky', source: 'opensky',
      success: true,
      data: {
        totalAircraft: states.filter((s) => !s.on_ground).length,
        theaters,
        hotspots,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'opensky', source: 'opensky',
      success: false,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };
  }
}
