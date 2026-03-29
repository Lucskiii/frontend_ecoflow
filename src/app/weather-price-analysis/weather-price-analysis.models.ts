export type WeatherPriceType = 'spot' | 'intraday' | 'day_ahead' | string;

export interface WeatherPriceAnalysisCityWeight {
  analysis_city_id: number;
  weight: number;
}

export interface WeatherPriceAnalysisRequest {
  run_name?: string;
  bidding_zone_id: number;
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

export interface WeatherPriceStatisticsByRunIdRequest {
  analysis_run_id: number;
}

export interface WeatherPriceStatisticsSelectionRequest {
  start_date: string;
  end_date: string;
  bidding_zone_id: number;
  product_id?: number;
  price_type?: string;
  cities: WeatherPriceAnalysisCityWeight[];
}

export type WeatherPriceStatisticsRequest =
  | WeatherPriceStatisticsByRunIdRequest
  | WeatherPriceStatisticsSelectionRequest;

export interface WeatherPriceStatisticsMeta {
  source?: string;
  analysis_run_id?: number;
  start_date?: string;
  end_date?: string;
  observations?: number;
  [key: string]: string | number | null | undefined;
}

export interface WeatherPriceDescriptiveStatistic {
  mean: number | null;
  median: number | null;
  std: number | null;
  min: number | null;
  max: number | null;
  count?: number | null;
}

export type WeatherPriceDescriptiveStatistics = Record<string, WeatherPriceDescriptiveStatistic>;

export type WeatherPriceCorrelations = Record<string, number | null>;

export type WeatherPriceCorrelationMatrix = Record<string, Record<string, number | null>>;

export interface WeatherPriceBucketItem {
  bucket: string;
  count: number;
  avg_price: number | null;
  avg_weather?: number | null;
}

export type WeatherPriceBucketAnalysis = Record<string, WeatherPriceBucketItem[]>;

export interface WeatherPriceScatterPoint {
  ts_utc: string;
  x: number | null;
  y: number | null;
}

export type WeatherPriceScatterData = Record<string, WeatherPriceScatterPoint[]>;

export interface WeatherPriceLagPoint {
  lag: number;
  value: number | null;
}

export type WeatherPriceLagAnalysis = Record<string, WeatherPriceLagPoint[]>;

export interface WeatherPriceOutlier {
  ts_utc: string;
  metric: string;
  value: number | null;
  z_score?: number | null;
}

export interface WeatherPriceTrendLine {
  slope: number | null;
  intercept: number | null;
  r2?: number | null;
}

export interface WeatherPriceStatisticsResponse {
  meta: WeatherPriceStatisticsMeta;
  descriptive_statistics: WeatherPriceDescriptiveStatistics;
  correlations: WeatherPriceCorrelations;
  correlation_matrix: WeatherPriceCorrelationMatrix;
  bucket_analysis: WeatherPriceBucketAnalysis;
  scatter_data: WeatherPriceScatterData;
  lag_analysis: WeatherPriceLagAnalysis;
  interpretation_hints: string[];
  outliers?: WeatherPriceOutlier[];
  trend_lines?: Record<string, WeatherPriceTrendLine>;
}
