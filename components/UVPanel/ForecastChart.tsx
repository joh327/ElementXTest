'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ForecastDay } from '@/types/uv';
import { getRiskColor, getLocalHour, formatHour, formatBurnTime } from '@/lib/uvUtils';

interface Props {
  day: ForecastDay;
  startTime: string;
  tzOffset: number;
  label: string;
}

export default function ForecastChart({ day, startTime, tzOffset, label }: Props) {
  const nowUTCHour = new Date().getUTCHours();
  const nowLocalHour = (nowUTCHour + tzOffset / 3_600_000 + 24) % 24;

  const data = day.UVForecast.map((uv, i) => {
    const localHour = getLocalHour(startTime, tzOffset, i);
    return {
      hour: localHour,
      label: i % 3 === 0 ? formatHour(localHour) : '',
      uv: Math.round(uv * 10) / 10,
      burn: day.BurntimeForecast?.[i] ?? null,
      fill: uv > 0 ? getRiskColor(uv) : '#e5e7eb',
      isCurrent: Math.abs(localHour - nowLocalHour) < 1,
    };
  });

  // Find peak
  const peakIndex = day.UVForecast.indexOf(day.MaxUVI);
  const peakHour = peakIndex >= 0 ? getLocalHour(startTime, tzOffset, peakIndex) : null;

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: typeof data[0] }[] }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-gray-100 shadow-lg rounded-lg px-3 py-2 text-sm">
        <div className="font-semibold text-gray-700">{formatHour(d.hour)}</div>
        <div style={{ color: d.uv > 0 ? getRiskColor(d.uv) : '#9ca3af' }}>
          UV {d.uv}
        </div>
        {d.burn !== null && (
          <div className="text-gray-400 text-xs">Burn: {formatBurnTime(d.burn)}</div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        {peakHour !== null && (
          <span className="text-xs text-gray-400">
            Peak {day.MaxUVString} ({day.MaxUVI.toFixed(1)}) at {formatHour(peakHour)}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -28 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, Math.max(12, day.MaxUVI + 1)]}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          {peakHour !== null && (
            <ReferenceLine
              x={formatHour(peakHour)}
              stroke="#d1d5db"
              strokeDasharray="3 3"
            />
          )}
          <Bar dataKey="uv" radius={[3, 3, 0, 0]} maxBarSize={20}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.fill}
                opacity={entry.isCurrent ? 1 : 0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
