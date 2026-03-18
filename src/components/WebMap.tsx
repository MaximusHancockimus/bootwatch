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
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 28px; height: 28px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

export default function WebMap({ complexes, onMarkerPress, colorOverrides }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize map once
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

    // User location
    map.locate({ setView: false, watch: false });
    map.on('locationfound', (e) => {
      L.circleMarker(e.latlng, {
        radius: 8,
        fillColor: '#4285F4',
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

  // Update markers when complexes change
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
        .bindTooltip(complex.name, { direction: 'top', offset: [0, -16] })
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
