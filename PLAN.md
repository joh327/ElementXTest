# UVLens Map App — Implementation Plan

## Project Overview

Recreate and improve the UVLens web app: an interactive map where users click any location to retrieve and visualise UV index data and forecasts via the UVLens Public API.

---

## Tech Stack Decision

### Framework: Next.js 14 (App Router)

**Why Next.js over alternatives:**

- API routes allow proxying UVLens API calls server-side (hides any API keys, avoids CORS)
- RSC + SSR for fast initial load
- File-based routing is minimal overhead for a single-page-heavy app
- Strong ecosystem, easy deployment to Vercel
- Alternatives considered: plain Vite+React (no server-side proxy), SvelteKit (less familiarity), Streamlit (Python, poor map perf)

### Mapping: Leaflet (via react-leaflet)

**Why Leaflet:**

- Completely free, no API key required (uses OpenStreetMap tiles)
- Lightweight, excellent click handler support
- Alternatives: Mapbox (great visuals but requires paid key), Google Maps (cost), MapLibre (good but more config)
- **Upgrade path**: swap tile provider to Stadia Maps or Mapbox later for better aesthetics with zero code change

### Styling: Tailwind CSS + shadcn/ui

- Rapid, consistent styling
- shadcn/ui for accessible popover/card components for UV data display

### State: React hooks (useState, useEffect) — no Redux/Zustand needed for this scope

---

## UVLens API Integration

Base URL: `https://api.uvlens.com`
Docs: `https://api.uvlens.com/swagger`

### Authentication
All requests require a `key` query parameter:
```
?key={API_KEY}
```
The key will be stored in `.env.local` as `UVLENS_API_KEY` and only used server-side (never exposed to the client).

### Confirmed Endpoints (from Swagger + live test)

| Endpoint           | Method | Status    | Use                                      |
| ------------------ | ------ | --------- | ---------------------------------------- |
| `/api/Forecast`    | GET    | Active    | Primary — UV forecast + burn times       |
| `/api/Combined`    | GET    | Deprecated (still works) | UV + current weather + daily messages |

All other endpoints (`/api/CurrentConditions`, `/api/Forecast/withZ`, etc.) are deprecated.

#### `GET /api/Forecast` — Parameters
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `longitude` | number (-180–180) | Yes | Decimal degrees |
| `latitude` | number (-90–90) | Yes | Decimal degrees |
| `skinType` | integer (0–6) | No | Fitzpatrick scale; 0 = not provided |
| `key` | string | Yes | Client ID via `?key=` query param |

#### `GET /api/Forecast` — Response Shape
```json
{
  "InterpolatedUV": 2.56,              // current UV index (interpolated to now)
  "StartTime": "2026-03-15T17:00:00",  // local time start of forecast
  "ForecastLocation": {
    "type": "Point",
    "coordinates": [174.7633, -36.8485]  // [lng, lat]
  },
  "DailyForecasts": [                  // 2 days of data
    {
      "SafeBefore": "2026-03-15T22:10:00",  // safe sun window start
      "SafeAfter": "2026-03-16T03:10:00",   // safe sun window end
      "MaxUVString": "High",                // human-readable risk level
      "MaxUVI": 6.47,                       // peak UV for the day
      "UVForecast": [0,0,0.21,...],         // 25 hourly UV values (hours 0–24)
      "BurntimeForecast": [270,210,...]     // 25 hourly burn times in minutes
    }
  ],
  "TimeZoneOffset": 46800000             // local timezone offset in ms
}
```

#### `/api/Combined` bonus fields (deprecated, use for weather + messages)
```json
{
  "CurrentWeather": "Mostly Cloudy",
  "CurrentTemperature": 19.5,
  "WeatherIcon": "partly-cloudy",        // nullable
  "CurrentUV": 2.56,
  "DailyMessage": "UV is moderate...",   // human-readable summary for today
  "DailyMessageTomorrow": "...",         // summary for tomorrow
  "LiveData": true
}
```

> **Note:** All API calls are proxied through a Next.js API route (`/api/uv`) — the API key never reaches the browser. We'll call both `/api/Forecast` and `/api/Combined` in a single server-side handler and merge the responses.

### UV Risk Scale (WHO Standard)

| Index | Risk Level | Colour |
| ----- | ---------- | ------ |
| 0–2   | Low        | Green  |
| 3–5   | Moderate   | Yellow |
| 6–7   | High       | Orange |
| 8–10  | Very High  | Red    |
| 11+   | Extreme    | Violet |

---

## Application Architecture

```
src/
├── app/
│   ├── page.tsx              # Main map page
│   ├── layout.tsx            # Root layout
│   └── api/
│       └── uv/
│           └── route.ts      # Server-side proxy to UVLens API
├── components/
│   ├── Map/
│   │   ├── MapContainer.tsx  # react-leaflet map setup
│   │   └── ClickHandler.tsx  # Captures lat/lng on click
│   ├── UVPanel/
│   │   ├── UVPanel.tsx       # Side/bottom panel container
│   │   ├── UVGauge.tsx       # Visual UV index gauge
│   │   ├── RiskBadge.tsx     # Colour-coded risk level
│   │   └── ForecastChart.tsx # Hourly forecast bar chart
│   └── ui/                   # shadcn components
├── lib/
│   ├── uvlens.ts             # API client functions
│   └── uvUtils.ts            # Risk level helpers, colour mapping
└── types/
    └── uv.ts                 # TypeScript interfaces for UV data
```

---

## Features to Build

### Part 1 — Core (MVP)

- [x] Interactive map (pan, zoom, click)
- [x] Click → fetch current UV index for lat/lng
- [x] Display UV index number, risk category, risk colour
- [x] Display hourly UV forecast for the day (bar chart)
- [x] Loading state while fetching
- [x] Error handling (API down, invalid location, ocean click)
- [x] Responsive layout (mobile-friendly panel)

### Part 2 — Improvements (Differentiators)

These are proposed improvements beyond the existing UVLens app:

1. **UV Heatmap overlay** — Toggle a colour-gradient heatmap layer over the map showing UV intensity across a region (computed from multiple API calls or a grid approximation). _High impact, visually compelling._

2. **"Safe sun time" calculator** — Given skin type (Fitzpatrick scale I–VI), calculate how many minutes of unprotected sun exposure is safe at the current UV index. Display alongside UV data. _Highly practical, differentiates from competitors._

3. **Persistent location pins** — Users can pin multiple locations and see their UV indices at a glance without re-clicking. Stored in localStorage. _Useful for people monitoring multiple sites._

4. **Daily max UV alert** — Show what time today the UV will peak and a countdown to it. _Actionable insight from existing forecast data._

5. **Sunscreen reminder copy** — Contextual, friendly message based on risk level ("Grab SPF 50+ and a hat!"). _Improves tone, makes app feel consumer-grade._

---

## UI/UX Design Decisions

### Layout — Split Panel (original design, not based on existing UVLens app)

```
┌─────────────────────────┬──────────────────────┐
│                         │                      │
│      Interactive        │    Info Panel        │
│         Map             │                      │
│        (left)           │  [empty state]       │
│                         │  "Click anywhere on  │
│                         │   the map to explore │
│                         │   UV levels"         │
│                         │                      │
│                         │  [after click]       │
│                         │  Location name       │
│                         │  UV index + colour   │
│                         │  Risk level badge    │
│                         │  Safe sun time       │
│                         │  Hourly forecast     │
│                         │  Peak UV time        │
└─────────────────────────┴──────────────────────┘
```

- **Left**: Map takes ~60% width — full height, always visible
- **Right**: Info panel takes ~40% width — persistent, always visible
  - **Empty state**: friendly prompt ("Click anywhere on the map to discover UV levels") with an illustration or icon
  - **Loaded state**: all UV data for the selected location
- **Mobile**: stacks vertically — map on top, panel below (scrollable)
- The map and panel are always present; no sliding/overlay behaviour needed

### Colour Strategy

- Map stays neutral (light/muted tile style)
- UV risk colour is the dominant theme in the right panel — background tint or large colour swatch changes with risk level
- Use WHO standard colours (green → violet) consistently

### Tradeoff Notes

- **No overlay/drawer**: permanent split is simpler, gives users constant access to both map and data without tap gymnastics
- **Leaflet vs Mapbox**: Chose Leaflet to avoid API key friction; Mapbox's vector tiles look better but add setup cost. Easy to swap later.
- **Chart library**: Recharts (lightweight) for forecast bars rather than Chart.js (heavier).
- **No auth**: Fully public/stateless. Pins stored in localStorage.

---

## Implementation Phases

### Phase 1 — Scaffold (Day 1)

1. `npx create-next-app@latest uvlens-map --typescript --tailwind --app`
2. Install: `react-leaflet leaflet recharts`
3. Set up map component with OSM tiles
4. Implement click handler → console.log lat/lng

### Phase 2 — API Integration (Day 1–2)

1. Explore UVLens Swagger to confirm exact endpoint paths/params
2. Build Next.js API proxy route
3. Wire map click → API call → display raw data

### Phase 3 — UI Polish (Day 2)

1. Build UV panel with gauge, risk badge, forecast chart
2. Add loading skeletons
3. Mobile responsive layout
4. Error states

### Phase 4 — Improvements (Day 3)

1. Safe sun time calculator
2. Location pins (localStorage)
3. Daily peak UV display
4. UV heatmap overlay (stretch goal)

---

## Deployment

- **Vercel** (zero config for Next.js)
- Environment variable: `UVLENS_API_BASE_URL` (if API key needed)

---

## Environment Variables

```env
# .env.local
UVLENS_API_KEY=0f131533-ba99-869a-9be8-27d5b3b4485e
```

## Questions Resolved

1. ~~API key?~~ — Yes, `?key=` query param. Confirmed working.
2. ~~Hourly or daily?~~ — **2 days, 25 hourly values each.** `UVForecast[i]` = UV at hour `i`.
3. ~~skinType?~~ — Integer 0–6. 0 = not provided. Affects `BurntimeForecast` values.
4. ~~What risk levels exist?~~ — `MaxUVString` returns e.g. "High", "Very High" (WHO scale).
5. ~~Safe window pre-calculated?~~ — Yes, `SafeBefore` and `SafeAfter` are provided directly.

## Remaining Unknowns
- Rate limits — debounce map clicks by ~500ms to be safe
- Whether ocean coordinates return data or error (coastal Auckland worked fine)
