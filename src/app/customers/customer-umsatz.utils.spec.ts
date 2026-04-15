import { formatUmsatzEur, parseUmsatzEur } from './customer-umsatz.utils';

describe('customer umsatz utils', () => {
  it('parses numeric input', () => {
    expect(parseUmsatzEur(1234.5)).toBe(1234.5);
  });

  it('parses string input', () => {
    expect(parseUmsatzEur('1234.5')).toBe(1234.5);
    expect(parseUmsatzEur('1234,5')).toBe(1234.5);
  });

  it('parses grouped number strings safely', () => {
    expect(parseUmsatzEur('1.234,56')).toBe(1234.56);
    expect(parseUmsatzEur('1,234.56')).toBe(1234.56);
    expect(parseUmsatzEur('1.234')).toBe(1234);
    expect(parseUmsatzEur('1,234')).toBe(1234);
  });

  it('falls back to 0 for invalid or empty values', () => {
    expect(parseUmsatzEur('')).toBe(0);
    expect(parseUmsatzEur('n/a')).toBe(0);
    expect(parseUmsatzEur(undefined)).toBe(0);
  });

  it('formats string and number values as eur currency', () => {
    expect(formatUmsatzEur(1)).toBe('1,00 €');
    expect(formatUmsatzEur('1')).toBe('1,00 €');
    expect(formatUmsatzEur(undefined)).toBe('0,00 €');
  });
});
