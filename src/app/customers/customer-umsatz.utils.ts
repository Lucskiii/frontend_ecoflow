export function parseUmsatzEur(value: string | number | null | undefined): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const normalized = normalizeNumericString(value);
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function normalizeNumericString(rawValue: string): string {
  const value = rawValue.trim().replace(/\s/g, '').replace(/'/g, '');
  const lastComma = value.lastIndexOf(',');
  const lastDot = value.lastIndexOf('.');

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    return normalizeWithDecimalSeparator(value, decimalSeparator);
  }

  if (lastComma >= 0) {
    return normalizeSingleSeparator(value, ',');
  }

  if (lastDot >= 0) {
    return normalizeSingleSeparator(value, '.');
  }

  return value;
}

function normalizeWithDecimalSeparator(value: string, decimalSeparator: ',' | '.'): string {
  const decimalIndex = value.lastIndexOf(decimalSeparator);
  const integerPart = value.slice(0, decimalIndex).replace(/[.,]/g, '');
  const fractionPart = value.slice(decimalIndex + 1).replace(/[.,]/g, '');
  return `${integerPart}.${fractionPart}`;
}

function normalizeSingleSeparator(value: string, separator: ',' | '.'): string {
  const occurrences = value.split(separator).length - 1;

  if (occurrences > 1) {
    return value.replace(new RegExp(`\\${separator}`, 'g'), '');
  }

  const separatorIndex = value.indexOf(separator);
  const digitsAfterSeparator = value.length - separatorIndex - 1;

  if (digitsAfterSeparator === 3) {
    return value.replace(separator, '');
  }

  return separator === ',' ? value.replace(',', '.') : value;
}

export function formatUmsatzEur(value: string | number | null | undefined): string {
  const amount = parseUmsatzEur(value);

  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
