export interface BiPrototypeSyncResponse {
  from: string;
  to: string;
  inserted_or_updated_dim_time: number;
  inserted_or_updated_dim_site: number;
  inserted_or_updated_dim_market_product: number;
  inserted_or_updated_fact_energy_interval: number;
  inserted_or_updated_fact_market_price: number;
}

export interface BiPrototypeTrendPoint {
  ts: string;
  value: number;
}

export interface BiPrototypeEnergyTrendResponse {
  from: string;
  to: string;
  site_key?: string | null;
  points: BiPrototypeTrendPoint[];
}

export interface BiPrototypePriceTrendResponse {
  from: string;
  to: string;
  market_product_key?: string | null;
  bidding_zone_id?: string | null;
  points: BiPrototypeTrendPoint[];
}

export interface BiPrototypeSyncQuery {
  from: string;
  to: string;
}

export interface BiPrototypeEnergyTrendQuery {
  from: string;
  to: string;
  site_key?: string;
}

export interface BiPrototypePriceTrendQuery {
  from: string;
  to: string;
  market_product_key?: string;
  bidding_zone_id?: string;
}
