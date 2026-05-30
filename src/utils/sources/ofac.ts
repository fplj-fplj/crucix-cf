import { safeFetch } from '../utils/fetch';
import type { SourceResult } from "../../types";

interface OfacEntry {
  name: string;
  program: string;
  date: string;
  type: string;
}

export async function fetchOfacData(): Promise<SourceResult> {
  try {
    const response = await safeFetch(
      'https://www.treasury.gov/ofac/downloads/sdnlist.txt',
    );
    const text = await response.text();

    const lines = text.split('\n');
    const entries: OfacEntry[] = [];
    const programCounts = new Map<string, number>();
    let currentProgram = '';
    let totalEntries = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const programMatch = trimmed.match(/^\[(.+)\]$/);
      if (programMatch) {
        currentProgram = programMatch[1];
        continue;
      }

      totalEntries += 1;

      const dateMatch = trimmed.match(/\d{2}\/\d{2}\/\d{4}/);
      const date = dateMatch ? dateMatch[0] : '';

      const entryType = trimmed.includes('(individual)')
        ? 'Individual'
        : trimmed.includes('(entity)')
          ? 'Entity'
          : trimmed.includes('(vessel)')
            ? 'Vessel'
            : 'Other';

      const name = trimmed.replace(/\[.*?\]/g, '').replace(/\d{2}\/\d{2}\/\d{4}/g, '').trim();

      if (currentProgram) {
        programCounts.set(currentProgram, (programCounts.get(currentProgram) || 0) + 1);
      }

      entries.push({
        name: name || trimmed,
        program: currentProgram || 'Unknown',
        date,
        type: entryType,
      });
    }

    const recentAdditions = entries
      .filter((e) => e.date)
      .sort((a, b) => {
        const [am, ad, ay] = a.date.split('/').map(Number);
        const [bm, bd, by] = b.date.split('/').map(Number);
        return new Date(ay, am - 1, ad).getTime() - new Date(by, bm - 1, bd).getTime();
      })
      .reverse()
      .slice(0, 50);

    const byProgram = Array.from(programCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([program, count]) => ({ program, count }));

    return {
      name: 'ofac', source: 'ofac',
      success: true,
      data: {
        totalEntries,
        recentAdditions,
        byProgram,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'ofac', source: 'ofac',
      success: false,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };
  }
}
