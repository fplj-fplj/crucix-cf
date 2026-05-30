export const MARKER_TYPES = {
  fire: { color: '#ff4400', size: 0.5, label: 'Thermal/Fire', icon: '\u{1F525}' },
  aircraft: { color: '#00d4ff', size: 0.4, label: 'Air Traffic', icon: '\u2708\uFE0F' },
  radiation: { color: '#ffaa00', size: 0.6, label: 'Nuclear Site', icon: '\u2622\uFE0F' },
  maritime: { color: '#0088ff', size: 0.5, label: 'Chokepoint', icon: '\u2693' },
  sdr: { color: '#aa55ff', size: 0.3, label: 'SDR Receiver', icon: '\u{1F4E1}' },
  osint: { color: '#ff3366', size: 0.4, label: 'OSINT Event', icon: '\u{1F441}' },
  health: { color: '#00ff88', size: 0.4, label: 'Health Alert', icon: '\u{1F3E5}' },
  news: { color: '#ffffff', size: 0.3, label: 'World News', icon: '\u{1F4F0}' },
  conflict: { color: '#ff0000', size: 0.6, label: 'Conflict Event', icon: '\u2694\uFE0F' }
};

export function createMarkerData(briefing) {
  if (!briefing || !Array.isArray(briefing.geoPoints)) return [];
  return briefing.geoPoints.map(gp => {
    const cfg = MARKER_TYPES[gp.type] || MARKER_TYPES.news;
    return {
      lat: gp.lat,
      lng: gp.lng,
      type: gp.type,
      label: gp.label,
      size: cfg.size,
      color: cfg.color,
      icon: cfg.icon,
      details: gp.details || ''
    };
  });
}

export function createArcData(briefing) {
  if (!briefing || !Array.isArray(briefing.flightArcs)) return [];
  return briefing.flightArcs.map(arc => {
    const startType = MARKER_TYPES[arc.start.type] || MARKER_TYPES.aircraft;
    return {
      startLat: arc.start.lat,
      startLng: arc.start.lng,
      endLat: arc.end.lat,
      endLng: arc.end.lng,
      color: () => [startType.color, startType.color],
      stroke: Math.max(0.5, Math.min(3, arc.count * 0.3)),
      count: arc.count,
      startLabel: arc.start.label,
      endLabel: arc.end.label
    };
  });
}
