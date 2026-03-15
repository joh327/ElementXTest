'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import SearchBar from './SearchBar';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SelectedLocation } from '@/types/uv';
import { getRiskColor } from '@/lib/uvUtils';

interface Props {
  selectedLocation: SelectedLocation | null;
  currentUV: number | null;
  onLocationSelect: (loc: SelectedLocation) => void;
}

function createMarkerIcon(uv: number | null) {
  const color = uv !== null ? getRiskColor(uv) : '#6b7280';
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 22px; height: 22px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 10px rgba(0,0,0,0.35);
        position: relative;
      ">
        <div style="
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          background: ${color};
          opacity: 0.25;
          animation: pulse 2s infinite;
        "></div>
      </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function ClickHandler({ onLocationSelect }: { onLocationSelect: (loc: SelectedLocation) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapComponent({ selectedLocation, currentUV, onLocationSelect }: Props) {
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setIcon(createMarkerIcon(currentUV));
    }
  }, [currentUV]);

  return (
    <MapContainer
      center={[20, 0]}
      zoom={3}
      style={{ height: '100%', width: '100%', cursor: 'crosshair' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={19}
      />
      <SearchBar onLocationSelect={onLocationSelect} />
      <ClickHandler onLocationSelect={onLocationSelect} />
      {selectedLocation && (
        <Marker
          position={[selectedLocation.lat, selectedLocation.lng]}
          icon={createMarkerIcon(currentUV)}
          ref={markerRef}
        />
      )}
    </MapContainer>
  );
}
