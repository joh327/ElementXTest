'use client';

import { useState } from 'react';
import { UVApiResponse } from '@/types/uv';
import {
  getRiskLevel,
  getRiskColor,
  getRiskAdvice,
  formatLocalTime,
  formatBurnTime,
  SKIN_TYPES,
} from '@/lib/uvUtils';
import ForecastChart from './ForecastChart';
import { SelectedLocation } from '@/types/uv';

interface Props {
  data: UVApiResponse;
  location: SelectedLocation;
  skinType: number;
  onSkinTypeChange: (v: number) => void;
  loading: boolean;
}

export default function UVPanel({ data, location, skinType, onSkinTypeChange, loading }: Props) {
  const [activeDay, setActiveDay] = useState(0);
  const { forecast, locationName } = data;
  const { InterpolatedUV, DailyForecasts, TimeZoneOffset, StartTime } = forecast;

  const today = DailyForecasts[0];
  const tomorrow = DailyForecasts[1];
  const riskColor = getRiskColor(InterpolatedUV);
  const riskLevel = getRiskLevel(InterpolatedUV);

  // Current burn time: find the hour in today's forecast closest to now
  const nowUTCHour = new Date().getUTCHours();
  const nowLocalHour = Math.round((nowUTCHour + TimeZoneOffset / 3_600_000 + 24) % 24);
  const currentBurn = today.BurntimeForecast?.[nowLocalHour] ?? null;

  const lat = location.lat.toFixed(4);
  const lng = location.lng.toFixed(4);
  const latDir = location.lat >= 0 ? 'N' : 'S';
  const lngDir = location.lng >= 0 ? 'E' : 'W';

  return (
    <div className={`flex flex-col h-full transition-opacity duration-300 ${loading ? 'opacity-60' : 'opacity-100'}`}>
      {/* Hero header — coloured by risk */}
      <div
        className="px-6 py-6 text-white flex-shrink-0"
        style={{ backgroundColor: riskColor }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-bold leading-none tabular-nums">
                {InterpolatedUV.toFixed(1)}
              </span>
              <span className="text-2xl font-light opacity-80">UV</span>
            </div>
            <div className="mt-1 text-lg font-semibold opacity-90">{riskLevel}</div>
          </div>
          <SunIcon uv={InterpolatedUV} />
        </div>
        <div className="mt-4 text-sm opacity-80">
          <div className="font-medium text-base opacity-100">{locationName}</div>
          <div className="mt-0.5">
            {Math.abs(parseFloat(lat))}°{latDir}, {Math.abs(parseFloat(lng))}°{lngDir}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Advice */}
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm text-gray-600">{getRiskAdvice(InterpolatedUV)}</p>
        </div>

        {/* Safe sun window */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Safe Sun Window — Today
          </div>
          <div className="flex gap-4">
            <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
              <div className="text-xs text-green-600 font-medium mb-1">Safe before</div>
              <div className="text-lg font-bold text-green-700">
                {formatLocalTime(today.SafeBefore, TimeZoneOffset)}
              </div>
            </div>
            <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
              <div className="text-xs text-green-600 font-medium mb-1">Safe after</div>
              <div className="text-lg font-bold text-green-700">
                {formatLocalTime(today.SafeAfter, TimeZoneOffset)}
              </div>
            </div>
          </div>
        </div>

        {/* Burn time + skin type selector */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Burn Time Now
            </div>
            <div
              className="text-base font-bold"
              style={{ color: currentBurn && currentBurn < 30 ? '#ef4444' : '#374151' }}
            >
              {formatBurnTime(currentBurn)}
            </div>
          </div>
          <div className="text-xs text-gray-400 mb-2">Your skin type</div>
          <div className="flex gap-1.5 flex-wrap">
            {SKIN_TYPES.map((st) => (
              <button
                key={st.value}
                onClick={() => onSkinTypeChange(st.value)}
                title={st.label}
                className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg border text-xs transition-all ${
                  skinType === st.value
                    ? 'border-gray-400 bg-gray-100 font-semibold'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full border border-gray-300"
                  style={{ backgroundColor: st.color }}
                />
                <span className="text-gray-500">{st.value === 0 ? '–' : `${st.value}`}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Forecast charts */}
        <div className="px-6 py-4">
          <div className="flex gap-2 mb-4">
            {['Today', 'Tomorrow'].map((label, i) => (
              <button
                key={label}
                onClick={() => setActiveDay(i)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeDay === i
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {activeDay === 0 && today && (
            <ForecastChart
              day={today}
              startTime={StartTime}
              tzOffset={TimeZoneOffset}
              label={`Max UV: ${today.MaxUVI.toFixed(1)} — ${today.MaxUVString}`}
            />
          )}
          {activeDay === 1 && tomorrow && (
            <ForecastChart
              day={tomorrow}
              startTime={StartTime}
              tzOffset={TimeZoneOffset}
              label={`Max UV: ${tomorrow.MaxUVI.toFixed(1)} — ${tomorrow.MaxUVString}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SunIcon({ uv }: { uv: number }) {
  const r = Math.min(1, uv / 11);
  const size = 40 + r * 20;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="opacity-80 flex-shrink-0"
    >
      <circle cx="40" cy="40" r="18" fill="white" fillOpacity="0.9" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 40 + 24 * Math.cos(rad);
        const y1 = 40 + 24 * Math.sin(rad);
        const x2 = 40 + (28 + r * 6) * Math.cos(rad);
        const y2 = 40 + (28 + r * 6) * Math.sin(rad);
        return (
          <line
            key={angle}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeOpacity="0.85"
          />
        );
      })}
    </svg>
  );
}
