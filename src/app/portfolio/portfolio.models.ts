import { EnergyPeriod } from '../energy/energy.models';

export type PortfolioPeriod = EnergyPeriod;

export interface PortfolioExportSummary {
  period: PortfolioPeriod;
  total_grid_export_kwh: number;
  tradable_export_kwh: number;
  customer_count: number;
  site_count: number;
  interval_minutes: number;
  safety_factor: number;
}

export interface PortfolioPoint {
  ts: string;
  value: number;
}

export interface PortfolioSeries {
  name: 'portfolio_grid_export' | 'portfolio_tradable_export' | string;
  unit: string;
  points: PortfolioPoint[];
}

export interface PortfolioExportTimeseriesResponse {
  interval_minutes: number;
  from: string;
  to: string;
  series: PortfolioSeries[];
}
