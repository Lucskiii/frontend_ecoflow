export interface AnalysisCity {
  id: number;
  city_name: string;
  country_code: string | null;
  country_name: string;
  latitude: number;
  longitude: number;
  open_meteo_location_id: number;
  admin1: string;
  timezone: string;
  created_at: string;
}

export interface AnalysisCityCreateRequest {
  city_name: string;
  country_code?: string;
}

export interface AnalysisCityListResponse {
  items: AnalysisCity[];
}
