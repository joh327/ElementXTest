# UV Explorer

An interactive UV index map for New Zealand. Click or search any location to get real-time UV levels, safe sun windows, burn time estimates, and a 2-day hourly forecast.

---

## Setup

**Prerequisites:** Node.js 18+, npm

```bash
# Install dependencies
npm install

# Create environment file
echo "UVLENS_API_KEY=your_key_here" > .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Environment variables**

| Variable | Description |
|----------|-------------|
| `UVLENS_API_KEY` | UVLens API client key, passed as `?key=` query param |

---

## Technologies

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 (App Router) | API routes for server-side proxying; API key stays off the client |
| Map | Leaflet + react-leaflet | Free, no API key, lightweight, great click/event support |
| Map tiles | CartoDB Positron | Clean minimal aesthetic, free, no key required |
| Styling | Tailwind CSS v4 | Rapid utility-first styling |
| Charts | Recharts | Lightweight bar chart with per-bar colouring via `Cell` |
| Geocoding | Nominatim (OpenStreetMap) | Free reverse geocoding + place search, no key required |
| Language | TypeScript | End-to-end type safety across API responses and components |

---

## Key Features to Try

- **Geolocation on load** — allow location access when prompted; the map flies to your position and loads UV data automatically. Deny it and Auckland is used as the default.

- **Click anywhere on the map** — the right panel instantly shows the UV index, risk level, and forecast for that spot.

- **Search bar** (top-left of map) — type any NZ city, suburb, or landmark. Results are restricted to New Zealand. Select a suggestion and the map animates to it.

- **Skin type selector** — choose your Fitzpatrick skin type (I–VI) in the panel; the burn time estimate updates to reflect your personal sensitivity.

- **Safe sun window** — shows the pre-calculated "safe before / safe after" times for today based on the location's forecast.

- **Today / Tomorrow tabs** — switch between two days of hourly UV forecast, with bars coloured by risk level and a dashed line marking peak UV.

- **Risk colour theming** — the panel header colour shifts from green → yellow → orange → red → purple as UV risk increases, giving an immediate visual signal.

---

## Architectural & Design Decisions

### Server-side API proxy
All calls to the UVLens API go through a Next.js API route (`/api/uv`). This keeps the API key out of the browser, handles CORS, and lets us fan out to both the UVLens forecast endpoint and Nominatim reverse geocoding in a single server-side request before returning a merged response to the client.

### Split panel layout
The map occupies the left portion of the screen permanently, with a fixed info panel on the right — rather than an overlay drawer that hides the map. This keeps both surfaces always visible, which suits a data exploration tool where you want to compare locations rapidly.

### Leaflet over Mapbox
Leaflet with CartoDB Positron tiles was chosen to avoid requiring a third-party API key. The tile provider can be swapped to Mapbox or Stadia Maps in a single line if better vector tile aesthetics are needed later.

### Geolocation fallback
The browser's native permission prompt is used directly — no custom UI. If the user denies or the request times out (8s), the app silently falls back to Auckland and loads normally. The intent is that the app is always immediately useful regardless of permission choice.

### NZ-scoped search
Nominatim's `countrycodes=nz` filter restricts search results to New Zealand, reducing noise and making the autocomplete immediately useful without requiring users to qualify their queries.

### FlyToController pattern
Leaflet's `useMap()` hook only works inside a `MapContainer`. A small `FlyToController` component is mounted inside the container and watches a `flyTo` prop, triggering `map.flyTo()` when it changes. This cleanly separates map navigation logic from the parent page state without needing refs or imperative calls across the component boundary.

### UV data interpretation
The `UVForecast` array returned by the API contains 25 hourly values. `StartTime` is in UTC; combined with `TimeZoneOffset` (ms), each index is converted to local time for correct chart labelling and current-hour burn time lookup.
