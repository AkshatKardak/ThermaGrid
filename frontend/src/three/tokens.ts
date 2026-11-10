/**
 * 3D Scene Design Tokens
 * Re-exports the canonical palette from theme/tokens.ts.
 * Never hardcode hex values in Three.js scenes or materials.
 * 3D canvases and map canvases use --panel-dark; text on it uses --raised.
 */
import { THEME_COLORS, RISK_BANDS } from '../theme/tokens';

export const THREE_TOKENS = {
  bg: THEME_COLORS.panelDark,                   // #14181A panelDark
  panel: THEME_COLORS.panelDark,               // #14181A panelDark
  panelElevated: THEME_COLORS.surface,         // #EAE5DA
  text: THEME_COLORS.raised,                   // #FBF9F4
  textDim: THEME_COLORS.muted,                 // #5E645F
  accent: THEME_COLORS.accent,                 // #1F3A5F
  accentDim: THEME_COLORS.accentHover,
  accentSoft: THEME_COLORS.accentSoft,
  alert: THEME_COLORS.error,                   // #8A2B22

  // Heat Scale (strictly mapped from single source of truth)
  heat: {
    safe: THEME_COLORS.heatScale.safe,           // #2FA37C
    moderate: THEME_COLORS.heatScale.moderate,   // #E8C547
    high: THEME_COLORS.heatScale.high,           // #D97706
    veryhigh: THEME_COLORS.heatScale.veryhigh,   // #FF704F
    extreme: THEME_COLORS.heatScale.extreme,     // #C31D3C
  },
} as const;

export { RISK_BANDS };
