/**
 * ThermaGrid Typography Tokens
 * Fonts:
 *   - Display: Bricolage Grotesque
 *   - Body: IBM Plex Sans
 *   - Data/Labels: IBM Plex Mono
 *
 * Rules:
 *   - All numerals use `font-variant-numeric: tabular-nums`.
 *   - Body text measure max 68ch (`max-w-[68ch]`).
 *   - Never center body copy — only hero and single-line stats.
 *   - Minimum body size 14px / 22px line-height.
 */

export const TYPOGRAPHY = {
  // Hero headline only
  displayXl: 'font-display text-[44px] leading-[46px] sm:text-[62px] sm:leading-[60px] lg:text-[76px] lg:leading-[72px] font-bold tracking-[-0.04em] text-ink',

  // Section openers
  displayL: 'font-display text-[36px] leading-[40px] sm:text-[46px] sm:leading-[50px] lg:text-[56px] lg:leading-[58px] font-bold tracking-[-0.035em] text-ink',

  // Page titles
  h1: 'font-display text-[32px] leading-[36px] sm:text-[40px] sm:leading-[44px] font-bold tracking-[-0.03em] text-ink',

  // Section titles
  h2: 'font-display text-[24px] leading-[30px] sm:text-[30px] sm:leading-[36px] font-bold tracking-[-0.02em] text-ink',

  // Card titles
  h3: 'font-display text-[20px] leading-[26px] sm:text-[22px] sm:leading-[28px] font-semibold tracking-[-0.01em] text-ink',

  // Lead paragraphs (max 68ch)
  bodyL: 'font-sans text-[17px] leading-[28px] font-normal tracking-normal text-muted max-w-[68ch]',

  // Default body (minimum 14px/22px line height, here 15px/24px)
  body: 'font-sans text-[15px] leading-[24px] font-normal tracking-normal text-ink max-w-[68ch]',

  // Section labels (mono sentence case)
  label: 'font-mono text-xs leading-4 font-medium text-muted',

  // Captions & telemetry data (mono)
  micro: 'font-mono text-[11px] leading-[14px] font-medium tracking-[0.06em] text-muted',

  // Hero KPI (mono, tabular)
  numeralXl: 'font-mono text-[56px] leading-[56px] sm:text-[72px] sm:leading-[72px] font-bold tracking-[-0.03em] tabular-nums text-ink',

  // Card KPI
  numeralL: 'font-mono text-[36px] leading-[36px] sm:text-[44px] sm:leading-[44px] font-bold tracking-[-0.02em] tabular-nums text-ink',

  // Inline stats
  numeralM: 'font-mono text-[22px] leading-[22px] sm:text-[26px] sm:leading-[26px] font-semibold tracking-[-0.01em] tabular-nums text-ink',
} as const;
