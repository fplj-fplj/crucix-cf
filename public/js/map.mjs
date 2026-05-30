import { createMarkerData, createArcData, MARKER_TYPES } from './markers.mjs';

const REGION_BOUNDS = {
  WORLD: [[-60, -180], [80, 180]],
  AMERICAS: [[-55, -130], [70, -30]],
  EUROPE: [[35, -10], [70, 40]],
  MIDDLE_EAST: [[15, 25], [45, 65]],
  ASIA_PACIFIC: [[-10, 60], [60, 180]],
  AFRICA: [[-35, -20], [37, 55]]
};

let map = null;
let tileLayer = null;
let markersLayer = null;
let arcsLayer = null;
let clusterGroup = null;

function createCircleMarker(point) {
  const cfg = MARKER_TYPES[point.type] || MARKER_TYPES.news;
  return L.circleMarker([point.lat, point.lng], {
    radius: Math.max(4, point.size * 10),
    fillColor: cfg.color,
    color: cfg.color,
    weight: 1,
    opacity: 0.9,
    fillOpacity: 0.6
  }).bindPopup(
    `<div style="font-family:monospace;font-size:12px;">` +
    `<b>${cfg.icon} ${point.label}</b><br/>` +
    `<span style="color:#888;">${point.type}</span>` +
    (point.details ? `<br/><span style="color:#666;">${point.details}</span>` : '') +
    `</div>`
  );
}

function createArcPolyline(arc) {
  const startType = MARKER_TYPES[arc.startLabel] || MARKER_TYPES.aircraft;
  const latlngs = [
    [arc.startLat, arc.startLng],
    [arc.endLat, arc.endLng]
  ];
  return L.polyline(latlngs, {
    color: startType.color,
    weight: Math.max(1, arc.stroke),
    opacity: 0.5,
    dashArray: '6 4'
  }).bindPopup(
    `<div style="font-family:monospace;font-size:12px;">` +
    `<b>${arc.startLabel} \u2192 ${arc.endLabel}</b><br/>` +
    `<span style="color:#888;">Flights: ${arc.count}</span>` +
    `</div>`
  );
}

export function initMap(container) {
  if (map) destroyMap();

  const el = typeof container === 'string' 
    ? document.getElementById(container) 
    : container || document.getElementById('leaflet-view');
  if (!el) return;

  map = L.map(el, {
    center: [20, 0],
    zoom: 2,
    minZoom: 2,
    maxZoom: 18,
    zoomControl: true,
    attributionControl: false,
    worldCopyJump: true
  });

  tileLayer = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    { subdomains: 'abcd', maxZoom: 19 }
  ).addTo(map);

  if (L.markerClusterGroup) {
    clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction(cluster) {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div style="background:rgba(0,136,255,0.7);color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:11px;font-family:monospace;">${count}</div>`,
          className: '',
          iconSize: [30, 30]
        });
      }
    });
    map.addLayer(clusterGroup);
  }

  markersLayer = L.layerGroup();
  arcsLayer = L.layerGroup();

  if (!clusterGroup) {
    markersLayer.addTo(map);
  }
  arcsLayer.addTo(map);

  setTimeout(() => map.invalidateSize(), 200);
}

export function updateMapData(data) {
  if (!map) return;

  const points = createMarkerData(data);
  const arcs = createArcData(data);

  if (clusterGroup) {
    clusterGroup.clearLayers();
  } else {
    markersLayer.clearLayers();
  }
  arcsLayer.clearLayers();

  points.forEach(point => {
    const marker = createCircleMarker(point);
    if (clusterGroup) {
      clusterGroup.addLayer(marker);
    } else {
      markersLayer.addLayer(marker);
    }
  });

  arcs.forEach(arc => {
    arcsLayer.addLayer(createArcPolyline(arc));
  });
}

export function zoomToRegion(region) {
  if (!map) return;
  const bounds = REGION_BOUNDS[region] || REGION_BOUNDS.WORLD;
  map.fitBounds(bounds, { padding: [20, 20], maxZoom: 6, animate: true, duration: 1 });
}

export function setMapVisible(visible) {
  if (!map) return;
  const el = map.getContainer();
  if (el) {
    el.style.display = visible ? '' : 'none';
    if (visible) map.invalidateSize();
  }
}

export function destroyMap() {
  if (!map) return;
  if (clusterGroup) {
    map.removeLayer(clusterGroup);
    clusterGroup = null;
  }
  if (markersLayer) {
    map.removeLayer(markersLayer);
    markersLayer = null;
  }
  if (arcsLayer) {
    map.removeLayer(arcsLayer);
    arcsLayer = null;
  }
  if (tileLayer) {
    map.removeLayer(tileLayer);
    tileLayer = null;
  }
  map.remove();
  map = null;
}
