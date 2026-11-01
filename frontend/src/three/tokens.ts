/**
 * 3D Scene Design Tokens
 * Re-exports the canonical Midnight Climate palette from theme/tokens.ts.
 * Never hardcode hex values in Three.js scenes or materials.
 */
import { THEME_COLORS, RISK_BANDS } from '../theme/tokens';

export const THREE_TOKENS = {
  bg: THEME_COLORS.bg,                      // #101820 Midnight
  panel: THEME_COLORS.surface,              // #1F3445 Panel
  panelElevated: THEME_COLORS.surfaceElevated, // #263E50 Raised Panel
  text: THEME_COLORS.text,                  // #D7E0E7 Text
  textDim: THEME_COLORS.textDim,            // #8B9AA8 Secondary Text
  accent: THEME_COLORS.accent,              // #9B6FD8 Amethyst (UI chrome & rim lighting ONLY)
  accentDim: THEME_COLORS.accentDim,
  accentSoft: THEME_COLORS.accentSoft,
  alert: THEME_COLORS.alert,                // #FF704F Alert

  // Heat Scale (strictly mapped from single source of truth)
  heat: {
    safe: THEME_COLORS.heatScale.safe,           // #2FA37C
    moderate: THEME_COLORS.heatScale.moderate,   // #E8C547
    high: THEME_COLORS.heatScale.high,           // #F59E0B
    veryhigh: THEME_COLORS.heatScale.veryhigh,   // #FF704F
    extreme: THEME_COLORS.heatScale.extreme,     // #C31D3C
  },
} as const;

export { RISK_BANDS };
