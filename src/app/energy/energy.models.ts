export type EnergyPeriod = 'today' | 'last_7_days' | 'last_30_days';

export interface EnergySummary {
  period: string;
  grid_import_kwh: number;
  grid_export_kwh: number;
  load_kwh: number;
  pv_generation_kwh: number;
  self_consumption_ratio?: number;
}

export interface EnergyPoint {
  ts: string;
  value: number;
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
