import {
  WeatherPriceDescriptiveStatistics,
  WeatherPriceStatisticsRequest,
  WeatherPriceStatisticsResponse
} from './weather-price-analysis.models';

export interface StatisticsCardViewModel {
  metric: string;
  mean: string;
  median: string;
  std: string;
  min: string;
  max: string;
}

export function formatStatisticValue(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'n/a';
  }

  return value.toFixed(2);
}

export function toStatisticsCards(stats: WeatherPriceDescriptiveStatistics): StatisticsCardViewModel[] {
  return Object.entries(stats).map(([metric, values]) => ({
    metric,
    mean: formatStatisticValue(values.mean),
    median: formatStatisticValue(values.median),
    std: formatStatisticValue(values.std),
    min: formatStatisticValue(values.min),
    max: formatStatisticValue(values.max)
  }));
}

export function hasStatisticsContent(response: WeatherPriceStatisticsResponse | null): boolean {
  if (!response) {
    return false;
  }

  return (
    Object.keys(response.descriptive_statistics).length > 0 ||
    Object.keys(response.correlations).length > 0 ||
    Object.keys(response.correlation_matrix).length > 0 ||
    Object.keys(response.bucket_analysis).length > 0 ||
    Object.keys(response.scatter_data).length > 0 ||
    Object.keys(response.lag_analysis).length > 0 ||
    response.interpretation_hints.length > 0
  );
}

export function buildStatisticsRequest(params: {
  analysisRunIdRaw: string;
  start_date: string;
  end_date: string;
  bidding_zone_id: number;
  product_id: string;
  price_type: string;
  cities: Array<{ analysis_city_id: number; weight: number }>;
}): WeatherPriceStatisticsRequest {
  const analysisRunId = Number(params.analysisRunIdRaw);
  if (params.analysisRunIdRaw.trim() && Number.isFinite(analysisRunId) && analysisRunId > 0) {
    return { analysis_run_id: analysisRunId };
  }

  const productIdNum = Number(params.product_id);

  return {
    start_date: params.start_date,
    end_date: params.end_date,
    bidding_zone_id: Number(params.bidding_zone_id),
    product_id: params.product_id.trim() && Number.isFinite(productIdNum) ? productIdNum : undefined,
    price_type: params.price_type?.trim() || undefined,
    cities: params.cities.map((city) => ({
      analysis_city_id: Number(city.analysis_city_id),
      weight: Number(city.weight)
    }))
  };
}
