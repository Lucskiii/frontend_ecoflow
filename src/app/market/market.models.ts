export interface MarketPricePoint {
  ts: string;
  price_eur_mwh: number;
}

export interface MarketPriceResponse {
  source: string;
  product: string;
  unit: string;
  from: string;
  to: string;
  points: MarketPricePoint[];
}

export interface LiveMarketPricePoint {
  ts: string;
  price_eur_mwh: number;
  price_ct_kwh: number;
}

export interface LiveMarketPriceResponse {
  source: string;
  product: string;
  unit: string;
  fetched_at: string;
  current: LiveMarketPricePoint | null;
  next: LiveMarketPricePoint | null;
  points: LiveMarketPricePoint[];
}

export interface LiveMarketPriceApiPoint {
  ts: string;
  price_eur_mwh: number;
  price_ct_kwh?: number;
}

export interface LiveMarketPriceApiResponse {
  source: string;
  product: string;
  unit: string;
  fetched_at: string;
  current: LiveMarketPriceApiPoint | null;
  next: LiveMarketPriceApiPoint | null;
  points: LiveMarketPriceApiPoint[];
}
