import { createMarkerData, createArcData, MARKER_TYPES } from './markers.mjs';

const REGION_COORDS = {
  WORLD: { lat: 20, lng: 0, altitude: 2.5 },
  AMERICAS: { lat: 30, lng: -90, altitude: 1.8 },
  EUROPE: { lat: 50, lng: 15, altitude: 1.5 },
  MIDDLE_EAST: { lat: 30, lng: 45, altitude: 1.5 },
  ASIA_PACIFIC: { lat: 30, lng: 110, altitude: 1.8 },
  AFRICA: { lat: 5, lng: 25, altitude: 1.5 }
};

let globe = null;
let currentPoints = [];
let currentArcs = [];

export function initGlobe(container) {
  if (globe) destroyGlobe();

  const el = typeof container === 'string' 
    ? document.getElementById(container) 
    : container || document.getElementById('globe-view');
  if (!el) return;

  globe = Globe()
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
    .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
    .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
    .atmosphereColor('#0088ff')
    .atmosphereAltitude(0.15)
    .showAtmosphere(true)
    .pointsData([])
    .pointLat(d => d.lat)
    .pointLng(d => d.lng)
    .pointColor(d => d.color)
    .pointSize(d => d.size * 2.5)
    .pointLabel(d => `<div style="font-family:monospace;color:#0ff;font-size:12px;"><b>${d.icon} ${d.label}</b><br/><span style="color:#aaa;">${d.type}</span>${d.details ? '<br/><span style="color:#888;">' + d.details + '</span>' : ''}</div>`)
    .pointsMerge(true)
    .arcsData([])
    .arcStartLat(d => d.startLat)
    .arcStartLng(d => d.startLng)
    .arcEndLat(d => d.endLat)
    .arcEndLng(d => d.endLng)
    .arcColor(d => d.color())
    .arcStroke(d => d.stroke)
    .arcDashLength(0.4)
    .arcDashGap(0.2)
    .arcDashAnimateTime(1500)
    .arcsMerge(true)
    .autoRotate(true)
    .autoRotateSpeed(0.3)
    (el);

  setTimeout(() => {
    globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 0);
  }, 100);
}

export function updateGlobeData(data) {
  if (!globe) return;

  currentPoints = createMarkerData(data);
  currentArcs = createArcData(data);

  globe
    .pointsData(currentPoints)
    .arcsData(currentArcs);
}

export function rotateToRegion(region) {
  if (!globe) return;
  const coords = REGION_COORDS[region] || REGION_COORDS.WORLD;
  globe
    .autoRotate(false)
    .pointOfView({ lat: coords.lat, lng: coords.lng, altitude: coords.altitude }, 1200);
}

export function setGlobeVisible(visible) {
  const el = globe && globe.renderer && globe.renderer().domElement
    ? globe.renderer().domElement.parentElement
    : null;
  if (el) {
    el.style.display = visible ? '' : 'none';
  }
}

export function destroyGlobe() {
  if (!globe) return;
  try {
    const el = globe.renderer && globe.renderer().domElement
      ? globe.renderer().domElement.parentElement
      : null;
    if (el) el.innerHTML = '';
  } catch (_) {}
  globe = null;
  currentPoints = [];
  currentArcs = [];
}
