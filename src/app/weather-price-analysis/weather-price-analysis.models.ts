export type WeatherPriceType = 'spot' | 'intraday' | 'day_ahead' | string;

export interface WeatherPriceAnalysisCityWeight {
  analysis_city_id: number;
  weight: number;
}

export interface WeatherPriceAnalysisRequest {
  run_name?: string;
  start_date: string;
  end_date: string;
  product_id?: string;
  price_type?: WeatherPriceType;
  cities: WeatherPriceAnalysisCityWeight[];
}

export interface WeatherPriceAnalysisRenameRequest {
  run_name: string;
}

export interface WeatherPriceAnalysisDataPoint {
  ts_utc: string;
  temp_c_weighted: number;
  wind_ms_weighted: number;
  ghi_wm2_weighted: number;
  cloud_pct_weighted: number;
  price_eur_mwh: number;
  product_id: string;
  price_type: string;
}

export interface WeatherPriceAnalysisResponse {
  analysis_run_id: string;
  run_name?: string;
  normalized_weights: Record<string, number>;
  rows_inserted_weather: number;
  rows_inserted_aggregate: number;
  rows_inserted_analysis: number;
  data: WeatherPriceAnalysisDataPoint[];
}

export interface WeatherPriceAnalysisStatusResponse {
  analysis_run_id: string;
  run_name?: string;
  status: string;
  message?: string;
}
