import { safeFetchJSON } from '../utils/fetch';
import type { SourceResult } from "../../types";

interface SafecastMeasurement {
  id: number;
  value: number;
  unit: string;
  location_name: string;
  latitude: number;
  longitude: number;
  captured_at: string;
  device_id: number;
}

const ANOMALY_CPM_THRESHOLD = 150;

export async function fetchSafecastData(): Promise<SourceResult> {
  try {
    const measurements = await safeFetchJSON<SafecastMeasurement[]>(
      'https://api.safecast.org/en-US/measurements.json?limit=100',
    );

    const readings = measurements.map((m) => ({
      location: m.location_name || 'Unknown',
      lat: m.latitude,
      lng: m.longitude,
      cpm: m.value,
      capturedAt: m.captured_at,
    }));

    const anomalies = measurements
      .filter((m) => m.value > ANOMALY_CPM_THRESHOLD)
      .map((m) => ({
        location: m.location_name || 'Unknown',
        lat: m.latitude,
        lng: m.longitude,
        cpm: m.value,
        threshold: ANOMALY_CPM_THRESHOLD,
      }));

    return {
      name: 'safecast', source: 'safecast',
      success: true,
      data: { readings, anomalies },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'safecast', source: 'safecast',
      success: false,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };
  }
}
