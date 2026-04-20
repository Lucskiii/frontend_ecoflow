import { evaluatePriceTrend, sanitizeAndSortTrendPoints } from './price-trend-evaluation.helpers';

describe('price-trend-evaluation.helpers', () => {
  it('sorts points by timestamp and removes invalid entries', () => {
    const sorted = sanitizeAndSortTrendPoints([
      { ts: '2026-01-01T03:00:00Z', value: 50 },
      { ts: 'invalid', value: 70 },
      { ts: '2026-01-01T01:00:00Z', value: Number.NaN },
      { ts: '2026-01-01T02:00:00Z', value: 40 }
    ]);

    expect(sorted).toHaveSize(2);
    expect(sorted[0].ts).toBe('2026-01-01T02:00:00Z');
    expect(sorted[1].ts).toBe('2026-01-01T03:00:00Z');
  });

  it('keeps numeric values represented as strings', () => {
    const sorted = sanitizeAndSortTrendPoints([
      { ts: '2026-01-01T01:00:00Z', value: '45.2' as unknown as number },
      { ts: '2026-01-01T02:00:00Z', value: '46,7' as unknown as number }
    ]);

    expect(sorted).toHaveSize(2);
    expect(sorted[0].value).toBeCloseTo(45.2);
    expect(sorted[1].value).toBeCloseTo(46.7);
  });

  it('evaluates rising trend correctly', () => {
    const evaluation = evaluatePriceTrend([
      { ts: '2026-01-01T03:00:00Z', value: 40 },
      { ts: '2026-01-01T01:00:00Z', value: 10 },
      { ts: '2026-01-01T02:00:00Z', value: 20 }
    ]);

    expect(evaluation).not.toBeNull();
    expect(evaluation?.validPointCount).toBe(3);
    expect(evaluation?.minValue).toBe(10);
    expect(evaluation?.maxValue).toBe(40);
    expect(evaluation?.averageValue).toBe(70 / 3);
    expect(evaluation?.absoluteChange).toBe(30);
    expect(evaluation?.percentChange).toBe(300);
    expect(evaluation?.slopePerHour).toBe(15);
    expect(evaluation?.direction).toBe('steigend');
  });

  it('classifies nearly unchanged values as stable', () => {
    const evaluation = evaluatePriceTrend([
      { ts: '2026-01-01T00:00:00Z', value: 100 },
      { ts: '2026-01-01T01:00:00Z', value: 100.2 }
    ]);

    expect(evaluation?.direction).toBe('stabil');
  });

  it('returns null when no valid points are available', () => {
    const evaluation = evaluatePriceTrend([{ ts: 'invalid', value: Number.NaN }]);
    expect(evaluation).toBeNull();
  });
});
