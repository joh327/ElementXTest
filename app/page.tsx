'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { UVApiResponse, SelectedLocation } from '@/types/uv';
import UVPanel from '@/components/UVPanel/UVPanel';
import EmptyState from '@/components/UVPanel/EmptyState';

const MapComponent = dynamic(() => import('@/components/Map/MapComponent'), { ssr: false });

const AUCKLAND: SelectedLocation = { lat: -36.8485, lng: 174.7633 };

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [flyTo, setFlyTo] = useState<SelectedLocation | null>(null);
  const [uvData, setUvData] = useState<UVApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skinType, setSkinType] = useState(0);
  const [geolocating, setGeolocating] = useState(true);

  const fetchUV = useCallback(async (loc: SelectedLocation, skin: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/uv?lat=${loc.lat}&lng=${loc.lng}&skinType=${skin}`);
      if (!res.ok) throw new Error('Failed to fetch UV data');
      const data: UVApiResponse = await res.json();
      setUvData(data);
    } catch {
      setError('Could not load UV data for this location. Try another spot.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedLocation) return;
    fetchUV(selectedLocation, skinType);
  }, [selectedLocation, skinType, fetchUV]);

  const handleLocationSelect = useCallback((loc: SelectedLocation) => {
    setSelectedLocation(loc);
  }, []);

  // On mount: request geolocation, fall back to Auckland
  useEffect(() => {
    if (!navigator.geolocation) {
      setFlyTo(AUCKLAND);
      handleLocationSelect(AUCKLAND);
      setGeolocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setFlyTo(loc);
        handleLocationSelect(loc);
        setGeolocating(false);
      },
      () => {
        setFlyTo(AUCKLAND);
        handleLocationSelect(AUCKLAND);
        setGeolocating(false);
      },
      { timeout: 8000 }
    );
  }, [handleLocationSelect]);

  const handleSkinTypeChange = useCallback((v: number) => {
    setSkinType(v);
  }, []);

  const currentUV = uvData?.forecast.InterpolatedUV ?? null;

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-gray-50">
      {/* Map — left panel */}
      <div className="relative h-[50vh] md:h-full md:flex-[3] min-w-0">
        <MapComponent
          selectedLocation={selectedLocation}
          currentUV={currentUV}
          onLocationSelect={handleLocationSelect}
          flyTo={flyTo}
        />
        {/* Geolocation / hint overlay */}
        {geolocating && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm text-gray-600 text-sm px-4 py-2 rounded-full shadow-md flex items-center gap-2 whitespace-nowrap">
              <div className="w-3 h-3 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
              Locating you…
            </div>
          </div>
        )}
        {/* Loading indicator on map */}
        {loading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
            <div className="bg-white/90 backdrop-blur-sm text-gray-600 text-sm px-4 py-2 rounded-full shadow-md flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
              Loading UV data…
            </div>
          </div>
        )}
      </div>

      {/* Info panel — right */}
      <div className="flex-[2] md:max-w-md md:min-w-80 h-[50vh] md:h-full bg-white shadow-xl overflow-hidden flex flex-col border-l border-gray-100">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full px-8 text-center">
            <div className="text-3xl mb-3">⚠️</div>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        ) : uvData && selectedLocation ? (
          <UVPanel
            data={uvData}
            location={selectedLocation}
            skinType={skinType}
            onSkinTypeChange={handleSkinTypeChange}
            loading={loading}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
