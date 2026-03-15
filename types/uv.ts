export interface ForecastDay {
  SafeBefore: string;
  SafeAfter: string;
  MaxUVString: string;
  MaxUVI: number;
  UVForecast: number[]; // 25 hourly values
  BurntimeForecast: number[] | null; // 25 hourly burn times in minutes
}

export interface ForecastResponse {
  InterpolatedUV: number;
  StartTime: string; // UTC datetime string (no Z suffix)
  ForecastLocation: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  DailyForecasts: ForecastDay[];
  TimeZoneOffset: number; // ms offset from UTC
}

export interface UVApiResponse {
  forecast: ForecastResponse;
  locationName: string;
}

export interface SelectedLocation {
  lat: number;
  lng: number;
}
