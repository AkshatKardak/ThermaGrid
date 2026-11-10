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
 */

export const TYPOGRAPHY = {
  // Hero headline only
  displayXl: 'font-display text-[44px] leading-[46px] sm:text-[62px] sm:leading-[60px] lg:text-[76px] lg:leading-[72px] font-bold tracking-[-0.04em]',

  // Section openers
  displayL: 'font-display text-[36px] leading-[40px] sm:text-[46px] sm:leading-[50px] lg:text-[56px] lg:leading-[58px] font-bold tracking-[-0.035em]',

  // Page titles
  h1: 'font-display text-[32px] leading-[36px] sm:text-[40px] sm:leading-[44px] font-bold tracking-[-0.03em]',

  // Section titles
  h2: 'font-display text-[24px] leading-[30px] sm:text-[30px] sm:leading-[36px] font-bold tracking-[-0.02em]',

  // Card titles
  h3: 'font-display text-[20px] leading-[26px] sm:text-[22px] sm:leading-[28px] font-semibold tracking-[-0.01em]',

  // Lead paragraphs (max 68ch)
  bodyL: 'font-sans text-[17px] leading-[28px] font-normal tracking-normal text-[#8B9AA8] max-w-[68ch]',

  // Default body
  body: 'font-sans text-[15px] leading-[24px] font-normal tracking-normal text-[#D7E0E7] max-w-[68ch]',

  // Section labels (mono sentence case)
  label: 'font-mono text-xs leading-4 font-medium text-[#6B7C8A]',

  // Captions & telemetry data (mono)
  micro: 'font-mono text-[11px] leading-[14px] font-medium tracking-[0.06em] text-[#5F7183]',

  // Hero KPI (mono, tabular)
  numeralXl: 'font-mono text-[56px] leading-[56px] sm:text-[72px] sm:leading-[72px] font-bold tracking-[-0.03em] tabular-nums',

  // Card KPI
  numeralL: 'font-mono text-[36px] leading-[36px] sm:text-[44px] sm:leading-[44px] font-bold tracking-[-0.02em] tabular-nums',

  // Inline stats
  numeralM: 'font-mono text-[22px] leading-[22px] sm:text-[26px] sm:leading-[26px] font-semibold tracking-[-0.01em] tabular-nums',
} as const;
