import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams.get('q');
  if (!q || q.trim().length < 2) {
    return NextResponse.json([]);
  }

  const params = new URLSearchParams({ q, format: 'json', limit: '5', addressdetails: '1', countrycodes: 'nz' });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': 'UVLensMapApp/1.0' },
  });

  if (!res.ok) return NextResponse.json([]);
  const data = await res.json();
  return NextResponse.json(data);
}
