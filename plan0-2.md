# Plan 0-2 — Location Search Bar

## Goal
Add a search bar to the map that lets users type a place name, select from autocomplete suggestions, and have the map fly to that location and load its UV data — without requiring a map click.

---

## Approach

### Search API: Nominatim (OpenStreetMap)
- Already used for reverse geocoding in `/api/uv` — consistent, free, no extra key needed
- Endpoint: `GET https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=5`
- Returns: `display_name`, `lat`, `lon`, `type` (city, country, etc.)

### Placement
- Floating overlay on the **top-left of the map** (above Leaflet controls)
- Stays on the map surface so it doesn't shrink the map area
- `z-index` above Leaflet tiles but below modals

### Behaviour
1. User types into the input (debounced 350ms)
2. Suggestions dropdown appears below the input (max 5 results)
3. User clicks a suggestion → map flies to that location + UV panel loads (same flow as a map click)
4. Pressing `Enter` selects the top suggestion
5. Pressing `Escape` or clicking outside closes the dropdown
6. Clicking anywhere on the map still works as before

---

## New Files

### `app/api/search/route.ts`
Server-side proxy to Nominatim search (keeps `User-Agent` header server-side, avoids CORS):
```
GET /api/search?q={query}
→ https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=5&addressdetails=1
Returns: [{ display_name, lat, lon, type, address }]
```

### `components/Map/SearchBar.tsx`
Client component, overlaid on the map:
- Controlled input with debounce hook
- Fetches `/api/search?q=...` as user types
- Renders suggestion list
- On selection: calls `onLocationSelect({ lat, lng })` (same prop as map click)
- Also calls `map.flyTo([lat, lng], 12)` via a `useMap()` hook inside the component

---

## Changes to Existing Files

### `app/page.tsx`
- No changes needed — `handleLocationSelect` already handles the flow; SearchBar will call it directly

### `components/Map/MapComponent.tsx`
- Accept optional `onLocationSelect` already passed ✓
- Import and render `<SearchBar onLocationSelect={onLocationSelect} />` inside `MapContainer` (so it can access `useMap()`)

---

## Component Design

```
┌─────────────────────────────────────────┐
│ [🔍 Search for a city or place...    ] │  ← input, always visible
│ ┌─────────────────────────────────────┐ │
│ │ Auckland, Auckland, New Zealand     │ │  ← suggestion item
│ │ Auckland, Northland, New Zealand    │ │
│ │ ...                                 │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

- Input: white background, rounded, subtle shadow, search icon prefix
- Suggestions: dropdown card below input, each item shows primary name bold + secondary address grey
- Highlighted item on hover/keyboard navigation
- Loading spinner inside input while fetching

---

## State in `SearchBar.tsx`
```
query: string          — controlled input value
suggestions: Result[]  — current autocomplete results
isOpen: boolean        — dropdown visibility
loading: boolean       — fetch in progress
activeIndex: number    — keyboard navigation index (-1 = none)
```

---

## Keyboard Navigation
- `ArrowDown` / `ArrowUp` — move `activeIndex` through suggestions
- `Enter` — select `suggestions[activeIndex]` (or `suggestions[0]` if none highlighted)
- `Escape` — close dropdown, keep query text

---

## Edge Cases
- Empty query → don't fetch, close dropdown
- Nominatim rate limit (1 req/sec) — debounce 350ms is sufficient for typing
- No results → show "No places found" message in dropdown
- Click outside to dismiss — `useEffect` with `document.addEventListener('mousedown', ...)`

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `app/api/search/route.ts` | Create — Nominatim proxy |
| `components/Map/SearchBar.tsx` | Create — search input + dropdown |
| `components/Map/MapComponent.tsx` | Modify — render `<SearchBar>` inside `MapContainer` |
