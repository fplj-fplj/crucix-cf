import { safeFetch } from '../utils/fetch';
import type { SourceResult } from "../../types";

export async function fetchGscpiData(): Promise<SourceResult> {
  try {
    const response = await safeFetch(
      'https://fred.stlouisfed.org/graph/fredgraph.csv?id=GSCPI',
      undefined,
      15_000,
    );

    const raw = await response.text();
    const lines = raw.trim().split('\n');

    const historicalData: { date: string; value: number }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 2) {
        const date = parts[0].trim();
        const val = parseFloat(parts[1].trim());
        if (date && !isNaN(val)) {
          historicalData.push({ date, value: val });
        }
      }
    }

    if (historicalData.length === 0) {
      return {
        name: 'gscpi', source: 'gscpi',
        success: false,
        error: 'No valid GSCPI data found',
        timestamp: new Date().toISOString(),
      };
    }

    const currentValue = historicalData[historicalData.length - 1].value;
    const previousValue = historicalData.length >= 2
      ? historicalData[historicalData.length - 2].value
      : currentValue;
    const change = parseFloat((currentValue - previousValue).toFixed(4));

    let trend: 'rising' | 'falling' | 'stable';
    const recentSlice = historicalData.slice(-6);
    if (recentSlice.length >= 3) {
      const firstHalf = recentSlice.slice(0, Math.floor(recentSlice.length / 2));
      const secondHalf = recentSlice.slice(Math.floor(recentSlice.length / 2));
      const avgFirst = firstHalf.reduce((s, d) => s + d.value, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((s, d) => s + d.value, 0) / secondHalf.length;
      const diff = avgSecond - avgFirst;
      if (Math.abs(diff) < 0.1) trend = 'stable';
      else trend = diff > 0 ? 'rising' : 'falling';
    } else {
      trend = 'stable';
    }

    return {
      name: 'gscpi', source: 'gscpi',
      success: true,
      data: {
        currentValue,
        previousValue,
        change,
        trend,
        historicalData: historicalData.slice(-24),
      },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'gscpi', source: 'gscpi',
      success: false,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };
  }
}
