export type EnergyPeriod = 'today' | '7d' | '30d';

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

export interface DailyConsumptionItem {
  consumption_date: string;
  consumption_kwh: number;
  source_type: string;
}

export interface DailyConsumptionParams {
  start_date?: string;
  end_date?: string;
  auto_generate?: boolean;
}
