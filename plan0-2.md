# Plan 0-2 — Location Search Bar + Geolocation Start

## Goal
1. Add a search bar to the map that lets users type a NZ place name, select from autocomplete suggestions, and have the map fly to that location and load its UV data.
2. On app load, automatically request the user's location and centre the map there — falling back to Auckland if permission is denied or unavailable.

---

## Feature 1 — Search Bar

### Search API: Nominatim (OpenStreetMap)
- Already used for reverse geocoding in `/api/uv` — consistent, free, no extra key needed
- Endpoint: `GET https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=5&addressdetails=1&countrycodes=nz`
- `countrycodes=nz` restricts results to New Zealand only
- Returns: `display_name`, `lat`, `lon`, `address`

### Placement
- Floating overlay on the **top-left of the map** (above Leaflet controls)
- Stays on the map surface so it doesn't shrink the map area
- `z-index` above Leaflet tiles

### Behaviour
1. User types into the input (debounced 350ms)
2. Suggestions dropdown appears below the input (max 5 NZ results)
3. User clicks a suggestion → map flies to that location + UV panel loads (same flow as a map click)
4. Pressing `Enter` selects the top suggestion
5. Pressing `Escape` or clicking outside closes the dropdown
6. Clicking anywhere on the map still works as before

### Component Design
```
┌─────────────────────────────────────────┐
│ [🔍 Search for a city or place...    ] │  ← input, always visible
│ ┌─────────────────────────────────────┐ │
│ │ Auckland, Auckland, New Zealand     │ │  ← suggestion item
│ │ Wellington, Wellington, New Zealand │ │
│ │ ...                                 │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

- Input: white background, rounded, subtle shadow, search icon prefix
- Suggestions: dropdown card, primary name bold + secondary address grey
- Highlighted item on hover/keyboard navigation
- Loading spinner inside input while fetching

### State in `SearchBar.tsx`
```
query: string          — controlled input value
suggestions: Result[]  — current autocomplete results
isOpen: boolean        — dropdown visibility
loading: boolean       — fetch in progress
activeIndex: number    — keyboard navigation index (-1 = none)
```

### Keyboard Navigation
- `ArrowDown` / `ArrowUp` — move `activeIndex` through suggestions
- `Enter` — select `suggestions[activeIndex]` (or `suggestions[0]` if none highlighted)
- `Escape` — close dropdown, keep query text

### Edge Cases
- Empty / <2 char query → don't fetch, close dropdown
- Nominatim rate limit (1 req/sec) — debounce 350ms is sufficient
- No results → show "No places found" in dropdown
- Click outside → dismiss via `document.addEventListener('mousedown', ...)`

---

## Feature 2 — Geolocation on Start

### Behaviour
1. On app mount, `navigator.geolocation.getCurrentPosition` is called
2. Browser shows native permission prompt
3. **Granted** → map flies to user's current coordinates, UV panel loads for that location
4. **Denied / timeout (8s) / API unavailable** → falls back to Auckland (`-36.8485, 174.7633`), map flies there, UV panel loads for Auckland
5. A "Locating you…" spinner appears on the map while geolocation is pending

### State added to `page.tsx`
```
geolocating: boolean       — true while waiting for geolocation result
flyTo: SelectedLocation | null  — set by geolocation only; triggers map animation
```

### `FlyToController` (inside `MapComponent.tsx`)
- Inner component that uses `useMap()` (must live inside `MapContainer`)
- Watches the `flyTo` prop; calls `map.flyTo([lat, lng], 12)` when it changes
- Used for geolocation result only — `SearchBar` handles its own `flyTo` internally, map clicks need no animation

---

## Files Created / Modified

| File | Action | Detail |
|------|--------|--------|
| `app/api/search/route.ts` | Created | Nominatim proxy, NZ-only (`countrycodes=nz`) |
| `components/Map/SearchBar.tsx` | Created | Search input + dropdown + keyboard nav |
| `components/Map/MapComponent.tsx` | Modified | Added `flyTo` prop, `FlyToController`, `<SearchBar>` |
| `app/page.tsx` | Modified | Geolocation on mount, `flyTo` + `geolocating` state |
