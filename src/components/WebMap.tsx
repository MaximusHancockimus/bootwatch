import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Complex } from '../types/complex';
import { RISK_CONFIG } from '../utils/risk';
import { REXBURG_CENTER } from '../data/complexes';

interface Props {
  complexes: Complex[];
  onMarkerPress: (complex: Complex) => void;
  colorOverrides?: Map<string, string>;
}

function createMarkerIcon(color: string) {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <defs>
        <filter id="s" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.35"/>
        </filter>
      </defs>
      <path filter="url(#s)" fill="${color}" stroke="#ffffff" stroke-width="2.5"
        d="M18 2C10.8 2 5 7.48 5 14.2c0 8.1 11.2 20.5 12.4 21.8.4.4 1 .6 1.6.6s1.2-.2 1.6-.6C21.8 34.7 33 22.3 33 14.2 33 7.48 27.2 2 20 2h-2z"/>
      <circle fill="#ffffff" cx="18" cy="15" r="5.5" opacity="0.95"/>
      <circle fill="${color}" cx="18" cy="15" r="3"/>
    </svg>`,
  );
  return L.divIcon({
    className: 'bootwatch-marker',
    html: `<div style="width:36px;height:44px;background:url('data:image/svg+xml,${svg}') center/contain no-repeat"></div>`,
    iconSize: [36, 44],
    iconAnchor: [18, 42],
    popupAnchor: [0, -36],
  });
}

export default function WebMap({ complexes, onMarkerPress, colorOverrides }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([REXBURG_CENTER.latitude, REXBURG_CENTER.longitude], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    map.locate({ setView: false, watch: false });
    map.on('locationfound', (e) => {
      L.circleMarker(e.latlng, {
        radius: 8,
        fillColor: '#16A34A',
        fillOpacity: 1,
        color: 'white',
        weight: 3,
      }).addTo(map);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    complexes.forEach((complex) => {
      const color = colorOverrides?.get(complex.id) ?? RISK_CONFIG[complex.riskLevel].color;
      const marker = L.marker([complex.latitude, complex.longitude], {
        icon: createMarkerIcon(color),
      })
        .bindTooltip(complex.name, { direction: 'top', offset: [0, -28] })
        .on('click', () => onMarkerPress(complex))
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [complexes, onMarkerPress, colorOverrides]);

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, width: '100%', height: '100%', minHeight: 400 }}
    />
  );
}
