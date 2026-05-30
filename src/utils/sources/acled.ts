import { safeFetchJSON } from '../utils/fetch';
import type { SourceResult } from "../../types";

interface AcledLoginResponse {
  token: string;
}

interface AcledEvent {
  event_id_cnty: string;
  event_date: string;
  year: string;
  time_precision: string;
  event_type: string;
  sub_event_type: string;
  actor1: string;
  actor2: string;
  country: string;
  region: string;
  latitude: string;
  longitude: string;
  fatalities: string;
  notes: string;
}

interface AcledEventResponse {
  count: number;
  data: AcledEvent[];
}

export async function fetchAcledData(email: string, password: string): Promise<SourceResult> {
  if (!email || !password) {
    return {
      name: 'acled', source: 'acled',
      success: false,
      error: 'API key not configured',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const loginResp = await safeFetchJSON<AcledLoginResponse>(
      'https://api.acleddata.com/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      },
    );

    const token = loginResp.token;

    const eventResp = await safeFetchJSON<AcledEventResponse>(
      `https://api.acleddata.com/event/read?token=${token}&limit=50&order_by=event_date&sort_order=desc`,
    );

    const events = eventResp.data || [];

    let totalFatalities = 0;
    const typeMap = new Map<string, number>();
    const countryMap = new Map<string, { count: number; fatalities: number }>();

    for (const e of events) {
      const f = parseInt(e.fatalities || '0', 10);
      totalFatalities += f;

      const etype = e.event_type || 'Unknown';
      typeMap.set(etype, (typeMap.get(etype) || 0) + 1);

      const country = e.country || 'Unknown';
      const entry = countryMap.get(country) || { count: 0, fatalities: 0 };
      entry.count += 1;
      entry.fatalities += f;
      countryMap.set(country, entry);
    }

    const eventsByType = Array.from(typeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }));

    const eventsByCountry = Array.from(countryMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([country, val]) => ({ country, count: val.count, fatalities: val.fatalities }));

    const recentEvents = events.slice(0, 20).map((e) => ({
      date: e.event_date,
      type: e.event_type,
      country: e.country,
      fatalities: parseInt(e.fatalities || '0', 10),
      notes: e.notes,
    }));

    return {
      name: 'acled', source: 'acled',
      success: true,
      data: {
        totalEvents: eventResp.count || events.length,
        fatalities: totalFatalities,
        eventsByType,
        eventsByCountry,
        recentEvents,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'acled', source: 'acled',
      success: false,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };
  }
}
