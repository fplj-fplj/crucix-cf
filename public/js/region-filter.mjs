const REGION_COORDS = {
  WORLD: { lat: 0, lng: 0, zoom: 2 },
  AMERICAS: { lat: 30, lng: -90, zoom: 3 },
  EUROPE: { lat: 50, lng: 15, zoom: 4 },
  MIDDLE_EAST: { lat: 30, lng: 45, zoom: 4 },
  ASIA_PACIFIC: { lat: 30, lng: 120, zoom: 3 },
  AFRICA: { lat: 5, lng: 25, zoom: 3 }
};

function rotateGlobe(region) {
  const coords = REGION_COORDS[region];
  if (!coords) return;

  window.dispatchEvent(new CustomEvent('globe:rotate', {
    detail: { lat: coords.lat, lng: coords.lng }
  }));
}

function zoomMap(region) {
  const coords = REGION_COORDS[region];
  if (!coords) return;

  window.dispatchEvent(new CustomEvent('map:zoom', {
    detail: { lat: coords.lat, lng: coords.lng, zoom: coords.zoom }
  }));
}

export function initRegionFilter() {
  const buttons = document.querySelectorAll('.region-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const region = btn.dataset.region;
      if (!region) return;

      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      rotateGlobe(region);
      zoomMap(region);

      window.dispatchEvent(new CustomEvent('regionchange', {
        detail: { region }
      }));
    });
  });
}
