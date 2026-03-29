import {
  buildStatisticsRequest,
  formatStatisticValue,
  hasStatisticsContent,
  toStatisticsCards
} from './weather-price-statistics.helpers';

describe('weather-price-statistics.helpers', () => {
  it('formats null-ish values as n/a', () => {
    expect(formatStatisticValue(null)).toBe('n/a');
    expect(formatStatisticValue(undefined)).toBe('n/a');
  });

  it('formats numbers with two decimals', () => {
    expect(formatStatisticValue(1.236)).toBe('1.24');
  });

  it('handles numeric strings and non-numeric strings safely', () => {
    expect(formatStatisticValue('3.14159')).toBe('3.14');
    expect(formatStatisticValue('n/a')).toBe('n/a');
  });

  it('maps descriptive stats to cards', () => {
    const cards = toStatisticsCards({
      price_eur_mwh: { mean: 2, median: 3, std: 4, min: 1, max: 5 }
    });

    expect(cards[0].metric).toBe('price_eur_mwh');
    expect(cards[0].mean).toBe('2.00');
  });

  it('builds run-id statistics request when analysis_run_id is numeric', () => {
    const payload = buildStatisticsRequest({
      analysisRunIdRaw: '123',
      start_date: '2026-01-01',
      end_date: '2026-01-03',
      bidding_zone_id: 10,
      product_id: '',
      price_type: 'spot',
      cities: [{ analysis_city_id: 1, weight: 1 }]
    });

    expect(payload).toEqual({ analysis_run_id: 123 });
  });

  it('builds raw selection payload when analysis_run_id is missing', () => {
    const payload = buildStatisticsRequest({
      analysisRunIdRaw: '',
      start_date: '2026-01-01',
      end_date: '2026-01-03',
      bidding_zone_id: 10,
      product_id: '77',
      price_type: 'spot',
      cities: [{ analysis_city_id: 1, weight: 1 }]
    });

    expect('analysis_run_id' in payload).toBeFalse();
    expect((payload as { product_id?: number }).product_id).toBe(77);
  });

  it('detects empty statistics payload', () => {
    const hasContent = hasStatisticsContent({
      meta: {},
      descriptive_statistics: {},
      correlations: {},
      correlation_matrix: {},
      bucket_analysis: {},
      scatter_data: {},
      lag_analysis: {},
      interpretation_hints: []
    });

    expect(hasContent).toBeFalse();
  });
});
