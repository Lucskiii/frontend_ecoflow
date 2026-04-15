export type EnergyPeriod = 'today' | '7d' | '30d' | 'all';

export interface EnergyTimeseriesQueryParams {
  from?: string;
  to?: string;
}

export interface EnergySummary {
  period: string;
  grid_import_kwh: number;
  grid_export_kwh: number;
  load_kwh: number;
  pv_generation_kwh: number;
  self_consumption_share_pct?: number;
}

export interface EnergyPoint {
  ts: string;
  value: number | string;
}

export interface EnergySeries {
  meter_type: 'load' | 'pv_generation' | 'grid_import' | 'grid_export' | string;
  unit: string;
  points: EnergyPoint[];
}

export interface EnergyTimeseriesResponse {
  interval_minutes: number;
  from: string;
  to: string;
  series: EnergySeries[];
}
