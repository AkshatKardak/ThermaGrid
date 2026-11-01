import { THREE_TOKENS } from './tokens';

/**
 * Normative 5-tier heat scale palette imported directly from design tokens.
 * [Safe, Moderate, High, Very High, Extreme]
 */
export const HEAT = [
  THREE_TOKENS.heat.safe,      // #2FA37C
  THREE_TOKENS.heat.moderate,  // #E8C547
  THREE_TOKENS.heat.high,      // #F59E0B
  THREE_TOKENS.heat.veryhigh,  // #FF704F
  THREE_TOKENS.heat.extreme,   // #C31D3C
] as const;

/**
 * Resolves hex colour for a given risk value (0.0 – 1.0 or 0 – 100).
 * Thresholds: [0.2, 0.4, 0.6, 0.8]
 */
export const heatColor = (risk: number): string => {
  // Normalize if given on 0–100 scale
  const r = risk > 1.0 ? risk / 100.0 : Math.max(0, risk);
  const idx = r < 0.2 ? 0 : r < 0.4 ? 1 : r < 0.6 ? 2 : r < 0.8 ? 3 : 4;
  return HEAT[idx];
};

/**
 * Returns integer heat band index (0 to 4).
 */
export const heatBandIndex = (risk: number): number => {
  const r = risk > 1.0 ? risk / 100.0 : Math.max(0, risk);
  return r < 0.2 ? 0 : r < 0.4 ? 1 : r < 0.6 ? 2 : r < 0.8 ? 3 : 4;
};
