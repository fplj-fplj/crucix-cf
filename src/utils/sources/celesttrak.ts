import { safeFetchJSON } from '../utils/fetch';
import type { SourceResult } from "../../types";

const MILITARY_KEYWORDS = [
  'USA', 'USSF', 'NRO', 'SBIRS', 'AEHF', 'WGS', 'GPS', 'DSP',
  'MIL', 'MILITARY', 'DEFENSE', 'RECON', 'SPY', 'SIGINT',
  'COSMOS', 'LUCH', 'GONETS', 'TUNDRA', 'MERIDIAN',
  'YAOGAN', 'BEIDOU', 'FENGYUN', 'GAOFEN', 'TIANLIAN',
  'SKYNET', 'ZHUHAI', 'SHIJIAN', 'HUJIAN',
  'HELIOS', 'PLEIADES', 'CSO', 'SAR-LUPE',
  'RADARSAT', 'SAPPHIRE', 'NEON',
  'OFEK', 'EROS', 'TECSAR',
  'RISAT', 'CARTOSAT', 'EMISAT',
  'KOMPSAT', 'CAS500',
  'IGS', 'RADAR', 'INFO',
];

function isMilitarySat(name: string): boolean {
  const upper = name.toUpperCase();
  return MILITARY_KEYWORDS.some((kw) => upper.includes(kw));
}

export async function fetchCelesttrakData(): Promise<SourceResult> {
  try {
    const [activeSats, starlinkSats, onewebSats] = await Promise.all([
      safeFetchJSON<any[]>('https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json', undefined, 30_000),
      safeFetchJSON<any[]>('https://celestrak.org/NORAD/elements/gp.php?NAME=STARLINK&FORMAT=json', undefined, 20_000),
      safeFetchJSON<any[]>('https://celestrak.org/NORAD/elements/gp.php?NAME=ONEWEB&FORMAT=json', undefined, 20_000),
    ]);

    const active = Array.isArray(activeSats) ? activeSats : [];
    const starlink = Array.isArray(starlinkSats) ? starlinkSats : [];
    const oneweb = Array.isArray(onewebSats) ? onewebSats : [];

    const totalActive = active.length;
    const starlinkCount = starlink.length;
    const onewebCount = oneweb.length;
    const militarySats = active.filter((s: any) => isMilitarySat(s.OBJECT_NAME ?? s.name ?? '')).length;

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const newObjects30d = active.filter((s: any) => {
      const launch = s.LAUNCH_DATE ?? s.launchDate ?? '';
      if (!launch) return false;
      try {
        return new Date(launch).getTime() > thirtyDaysAgo;
      } catch {
        return false;
      }
    }).length;

    let issAltitude: number | null = null;
    const issEntry = active.find(
      (s: any) => (s.OBJECT_NAME ?? s.name ?? '').toUpperCase().includes('ISS') &&
        (s.OBJECT_NAME ?? s.name ?? '').toUpperCase().includes('ZARYA'),
    );
    if (issEntry?.SEMIMAJOR_AXIS) {
      issAltitude = Math.round(issEntry.SEMIMAJOR_AXIS - 6371);
    }

    const recentLaunches = active
      .filter((s: any) => s.LAUNCH_DATE ?? s.launchDate)
      .sort((a: any, b: any) => {
        const da = new Date(a.LAUNCH_DATE ?? a.launchDate).getTime();
        const db = new Date(b.LAUNCH_DATE ?? b.launchDate).getTime();
        return db - da;
      })
      .slice(0, 30)
      .map((s: any) => ({
        name: s.OBJECT_NAME ?? s.name ?? '',
        intlDes: s.INTLDES ?? s.internationalDesignator ?? '',
        launchDate: s.LAUNCH_DATE ?? s.launchDate ?? '',
      }));

    return {
      name: 'celesttrak', source: 'celesttrak',
      success: true,
      data: { totalActive, newObjects30d, militarySats, starlinkCount, onewebCount, issAltitude, recentLaunches },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'celesttrak', source: 'celesttrak',
      success: false,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };
  }
}
