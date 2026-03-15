'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { SelectedLocation } from '@/types/uv';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

interface Props {
  onLocationSelect: (loc: SelectedLocation) => void;
}

function primaryName(r: NominatimResult): string {
  const a = r.address;
  return a.city || a.town || a.village || a.county || r.display_name.split(',')[0];
}

function secondaryName(r: NominatimResult): string {
  const parts = r.display_name.split(',').map((s) => s.trim());
  return parts.slice(1, 3).join(', ');
}

export default function SearchBar({ onLocationSelect }: Props) {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data: NominatimResult[] = await res.json();
      setSuggestions(data);
      setIsOpen(data.length > 0);
      setActiveIndex(-1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchSuggestions]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectResult = useCallback((result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    map.flyTo([lat, lng], 12, { duration: 1.2 });
    onLocationSelect({ lat, lng });
    setQuery(primaryName(result));
    setIsOpen(false);
  }, [map, onLocationSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = suggestions[activeIndex] ?? suggestions[0];
      if (target) selectResult(target);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute top-3 left-3 z-[1000] w-72"
      // Prevent map click/drag from firing through the search bar
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {loading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder="Search for a city or place…"
          className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl shadow-md border border-gray-100 text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-200 transition-all"
        />
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="mt-1.5 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {suggestions.map((result, i) => (
            <button
              key={result.place_id}
              onMouseDown={(e) => { e.preventDefault(); selectResult(result); }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`w-full text-left px-4 py-2.5 flex flex-col transition-colors ${
                i === activeIndex ? 'bg-gray-50' : 'hover:bg-gray-50'
              } ${i > 0 ? 'border-t border-gray-50' : ''}`}
            >
              <span className="text-sm font-medium text-gray-800 truncate">
                {primaryName(result)}
              </span>
              <span className="text-xs text-gray-400 truncate mt-0.5">
                {secondaryName(result)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && !loading && query.trim().length >= 2 && suggestions.length === 0 && (
        <div className="mt-1.5 bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 text-sm text-gray-400">
          No places found
        </div>
      )}
    </div>
  );
}
