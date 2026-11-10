/**
 * ThermaGrid Design Tokens
 * Light Editorial / Technical Scientific Instrument Palette (Single Source of Truth)
 *
 * LAW OF USAGE:
 * - Interactive Accent (#1F3A5F): UI Chrome, primary buttons, active nav, focus rings, "live" indicators ONLY.
 *   NEVER used for risk values.
 * - Risk scale: Risk values and bands ONLY. Never for UI chrome, headings, or branding.
 * - Risk-as-text rule: --risk-1 through --risk-4 may NEVER be used as text color.
 *   Numbers/labels render in --ink with a dot/bar/chip fill.
 * - Never pure #000 or #FFF.
 */

export const TOKENS = {
  bg: '#F3EFE7',
  surface: '#EAE5DA',
  raised: '#FBF9F4',
  border: '#CFC8B8',
  ink: '#1A1E1C',
  muted: '#5E645F',
  accent: '#1F3A5F',
  accentHover: '#2C4F80',
  onAccent: '#FBF9F4',
  error: '#8A2B22',
  panelDark: '#14181A',
} as const;

export const RISK_SCALE = {
  risk1: '#2FA37C',
  risk2: '#E8C547',
  risk3: '#D97706',
  risk4: '#FF704F',
  risk5: '#C31D3C',
} as const;

export const RISK_THRESHOLDS = {
  SAFE: 25,
  MODERATE: 50,
  HIGH: 70,
  VERY_HIGH: 85,
} as const;

// Backward compatibility mappings
export const THEME_COLORS = {
  bg: TOKENS.bg,
  surface: TOKENS.surface,
  raised: TOKENS.raised,
  hairline: TOKENS.border,
  hairline2: TOKENS.border,

  surfaceElevated: TOKENS.raised,
  surfaceRecessed: TOKENS.surface,
  surfaceOverlay: 'color-mix(in srgb, var(--surface) 92%, transparent)',

  border: TOKENS.border,
  borderEmphasized: TOKENS.border,

  text: TOKENS.ink,
  ink: TOKENS.ink,
  muted: TOKENS.muted,
  dim: TOKENS.muted,
  textDim: TOKENS.muted,
  textFaint: TOKENS.muted,

  accent: TOKENS.accent,
  accentHover: TOKENS.accentHover,
  accentDim: TOKENS.accentHover,
  accentSoft: 'color-mix(in srgb, var(--accent) 8%, var(--bg))',
  onAccent: TOKENS.onAccent,

  error: TOKENS.error,
  alert: TOKENS.error,
  panelDark: TOKENS.panelDark,

  heatScale: {
    safe: RISK_SCALE.risk1,
    moderate: RISK_SCALE.risk2,
    high: RISK_SCALE.risk3,
    veryhigh: RISK_SCALE.risk4,
    extreme: RISK_SCALE.risk5,
  },
} as const;

export const MOTION = {
  fast:   { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
  base:   { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  reveal: { duration: 0.6,  ease: [0.22, 1, 0.36, 1] },
  stagger: 0.06,
  countUp: 0.7,
} as const;

export const THEME_RADIUS = {
  chips: '4px',
  inputs: '6px',
  buttons: '6px',
  cards: '8px',
  overlays: '8px',
  pills: '9999px',
} as const;

export const THEME_SHADOWS = {
  l1: 'none',
  l2: 'none',
  l3: 'none',
  highlight: 'none',
} as const;

export type RiskBand = 'safe' | 'moderate' | 'high' | 'veryhigh' | 'extreme';

export interface RiskBandDefinition {
  readonly label: string;
  readonly code: RiskBand;
  readonly color: string;
  readonly minScore: number;
  readonly maxScore: number;
  readonly description: string;
}

export const RISK_BANDS: Record<RiskBand, RiskBandDefinition> = {
  safe: {
    code: 'safe',
    label: 'Low / Safe',
    color: RISK_SCALE.risk1,
    minScore: 0,
    maxScore: 24.9,
    description: 'Minimal thermal strain. Normal outdoor physical activity tolerable.',
  },
  moderate: {
    code: 'moderate',
    label: 'Moderate',
    color: RISK_SCALE.risk2,
    minScore: 25,
    maxScore: 49.9,
    description: 'Elevated discomfort. Regular hydration and shaded rest advised.',
  },
  high: {
    code: 'high',
    label: 'High Risk',
    color: RISK_SCALE.risk3,
    minScore: 50,
    maxScore: 69.9,
    description: 'Heat cramps or exhaustion likely. Implement 30m work-rest cycles.',
  },
  veryhigh: {
    code: 'veryhigh',
    label: 'Very High Risk',
    color: RISK_SCALE.risk4,
    minScore: 70,
    maxScore: 84.9,
    description: 'Dangerous thermal stress. Suspend non-essential afternoon outdoor manual labor.',
  },
  extreme: {
    code: 'extreme',
    label: 'Extreme / Emergency',
    color: RISK_SCALE.risk5,
    minScore: 85,
    maxScore: 100,
    description: 'Acute heat stroke emergency. Cease outdoor heavy labor; activate emergency cooling shelters.',
  },
};

export function riskBand(score: number): RiskBandDefinition {
  if (score < RISK_THRESHOLDS.SAFE) return RISK_BANDS.safe;
  if (score < RISK_THRESHOLDS.MODERATE) return RISK_BANDS.moderate;
  if (score < RISK_THRESHOLDS.HIGH) return RISK_BANDS.high;
  if (score < RISK_THRESHOLDS.VERY_HIGH) return RISK_BANDS.veryhigh;
  return RISK_BANDS.extreme;
}

export const getRiskBand = riskBand;

export function riskColor(score: number): string {
  return riskBand(score).color;
}
