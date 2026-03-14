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
