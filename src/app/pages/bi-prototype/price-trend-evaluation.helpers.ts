import { BiPrototypeTrendPoint } from '../../bi-prototype/bi-prototype.models';

interface ParsedTrendPoint extends BiPrototypeTrendPoint {
  value: number;
  parsedTs: number;
}

export interface PriceTrendEvaluation {
  validPointCount: number;
  minValue: number;
  maxValue: number;
  averageValue: number;
  firstValue: number;
  lastValue: number;
  absoluteChange: number;
  percentChange: number;
  slopePerHour: number;
  direction: 'steigend' | 'fallend' | 'stabil';
}

export function sanitizeAndSortTrendPoints(points: BiPrototypeTrendPoint[]): ParsedTrendPoint[] {
  return points
    .map((point) => ({
      ...point,
      value: toNumericValue((point as { value: unknown }).value),
      parsedTs: Date.parse(point.ts)
    }))
    .filter((point): point is ParsedTrendPoint => Number.isFinite(point.parsedTs) && Number.isFinite(point.value))
    .sort((a, b) => a.parsedTs - b.parsedTs);
}

export function evaluatePriceTrend(points: BiPrototypeTrendPoint[]): PriceTrendEvaluation | null {
  const sanitized = sanitizeAndSortTrendPoints(points);
  if (!sanitized.length) {
    return null;
  }

  const values = sanitized.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const averageValue = values.reduce((sum, value) => sum + value, 0) / values.length;

  const firstPoint = sanitized[0];
  const lastPoint = sanitized[sanitized.length - 1];
  const absoluteChange = lastPoint.value - firstPoint.value;
  const percentChange = firstPoint.value === 0 ? 0 : (absoluteChange / Math.abs(firstPoint.value)) * 100;

  const durationMs = Math.max(lastPoint.parsedTs - firstPoint.parsedTs, 1);
  const durationHours = durationMs / (1000 * 60 * 60);
  const slopePerHour = absoluteChange / durationHours;

  const directionThreshold = Math.max(0.01, (maxValue - minValue) * 0.01);
  const direction: PriceTrendEvaluation['direction'] =
    absoluteChange > directionThreshold ? 'steigend' : absoluteChange < -directionThreshold ? 'fallend' : 'stabil';

  return {
    validPointCount: values.length,
    minValue,
    maxValue,
    averageValue,
    firstValue: firstPoint.value,
    lastValue: lastPoint.value,
    absoluteChange,
    percentChange,
    slopePerHour,
    direction
  };
}

function toNumericValue(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    return Number.NaN;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return Number.NaN;
  }

  return Number(trimmed.replace(',', '.'));
}
