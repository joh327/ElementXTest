import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://api.uvlens.com';
const KEY = process.env.UVLENS_API_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const skinType = searchParams.get('skinType') ?? '0';

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  const params = new URLSearchParams({ latitude: lat, longitude: lng, skinType, key: KEY });

  const [forecastRes, geoRes] = await Promise.all([
    fetch(`${BASE}/api/Forecast?${params}`, { next: { revalidate: 300 } }),
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': 'UVLensMapApp/1.0' }, next: { revalidate: 3600 } }
    ),
  ]);

  if (!forecastRes.ok) {
    const err = await forecastRes.text();
    return NextResponse.json({ error: err || 'UVLens API error' }, { status: forecastRes.status });
  }

  const forecast = await forecastRes.json();

  let locationName = `${parseFloat(lat).toFixed(4)}°, ${parseFloat(lng).toFixed(4)}°`;
  if (geoRes.ok) {
    const geo = await geoRes.json();
    const a = geo.address ?? {};
    locationName =
      a.city || a.town || a.village || a.county || a.state ||
      geo.display_name?.split(',')[0] ||
      locationName;
  }

  return NextResponse.json({ forecast, locationName });
}
