export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';

export function getRiskLevel(uvi: number): RiskLevel {
  if (uvi < 3) return 'Low';
  if (uvi < 6) return 'Moderate';
  if (uvi < 8) return 'High';
  if (uvi < 11) return 'Very High';
  return 'Extreme';
}

export function getRiskColor(uvi: number): string {
  if (uvi < 3) return '#22c55e';
  if (uvi < 6) return '#eab308';
  if (uvi < 8) return '#f97316';
  if (uvi < 11) return '#ef4444';
  return '#a855f7';
}

export function getRiskBg(uvi: number): string {
  if (uvi < 3) return 'bg-green-500';
  if (uvi < 6) return 'bg-yellow-500';
  if (uvi < 8) return 'bg-orange-500';
  if (uvi < 11) return 'bg-red-500';
  return 'bg-purple-500';
}

export function getRiskAdvice(uvi: number): string {
  if (uvi < 3) return 'Minimal protection needed. Safe to be outside.';
  if (uvi < 6) return 'Wear sunscreen SPF 30+, a hat, and sunglasses.';
  if (uvi < 8) return 'Reduce time in the midday sun. SPF 50+ recommended.';
  if (uvi < 11) return 'Take full precautions. Minimize time outdoors 10am–4pm.';
  return 'Avoid sun exposure. Stay in shade or indoors if possible.';
}

// StartTime from API is UTC (no Z suffix). TimeZoneOffset is ms offset from UTC.
export function getLocalHour(startTime: string, tzOffsetMs: number, index: number): number {
  const utcMs = Date.parse(startTime + 'Z') + index * 3600_000;
  const localMs = utcMs + tzOffsetMs;
  return new Date(localMs).getUTCHours();
}

export function formatHour(h: number): string {
  if (h === 0 || h === 24) return '12am';
  if (h === 12) return '12pm';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

// SafeBefore / SafeAfter are also UTC (no Z suffix)
export function formatLocalTime(isoString: string, tzOffsetMs: number): string {
  const utcMs = Date.parse(isoString + 'Z');
  const localMs = utcMs + tzOffsetMs;
  const d = new Date(localMs);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  const min = m.toString().padStart(2, '0');
  return `${hour}:${min}${ampm}`;
}

export function formatBurnTime(minutes: number | null): string {
  if (minutes === null || minutes >= 720) return 'No risk';
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${minutes} min`;
}

export const SKIN_TYPES = [
  { value: 0, label: 'Default', color: '#d1d5db' },
  { value: 1, label: 'Type I', color: '#fde8d0' },
  { value: 2, label: 'Type II', color: '#f5cba7' },
  { value: 3, label: 'Type III', color: '#e8a07c' },
  { value: 4, label: 'Type IV', color: '#c68642' },
  { value: 5, label: 'Type V', color: '#8d5524' },
  { value: 6, label: 'Type VI', color: '#4a2912' },
] as const;
