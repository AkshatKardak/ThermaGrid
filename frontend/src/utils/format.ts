/**
 * Safe numeric formatting and rounding helpers.
 * Prevents runtime errors when values from upstream telemetry are undefined or null.
 */
export function formatNumber(
  value: number | string | null | undefined,
  digits: number = 1,
  fallback: string = '—'
): string {
  if (value === null || value === undefined || value === '') return fallback;
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return num.toFixed(digits);
}

export function roundNumber(
  value: number | string | null | undefined,
  digits: number = 1,
  fallback: number = 0
): number {
  if (value === null || value === undefined || value === '') return fallback;
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Number(num.toFixed(digits));
}
