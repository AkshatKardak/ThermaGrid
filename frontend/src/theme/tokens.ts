/**
 * ThermaGrid Design Tokens
 * Arctic Observatory Palette (Single Source of Truth)
 *
 * LAW OF USAGE:
 * - Interactive Accent (#8FB3D9): UI Chrome, primary buttons, active nav, focus rings, "live" indicators ONLY.
 *   NEVER used for a heading, a card, an icon, or a risk value.
 * - Heat scale: Risk values and bands ONLY. Never a headline, a border, or a hover state.
 * - Never pure black (#000000) or pure white (#FFFFFF).
 * - Max one saturated element per viewport region.
 */

export const THEME_COLORS = {
  // Arctic Observatory surfaces
  bg: '#0B141B',
  surface: '#142630',
  raised: '#203A45',
  hairline: 'rgba(255,255,255,.075)',
  hairline2: 'rgba(255,255,255,.14)',

  // Legacy surface aliases for compatibility
  surfaceElevated: '#203A45',
  surfaceRecessed: '#142630',
  surfaceOverlay: 'rgba(20, 38, 48, 0.86)',

  // Borders & hairlines
  border: 'rgba(255, 255, 255, 0.075)',
  borderEmphasized: 'rgba(255, 255, 255, 0.14)',

  // Text
  text: '#D8E8E6',
  muted: '#6B7C8A',
  dim: '#93A3B0',
  textDim: '#6B7C8A',
  textFaint: '#5F7183',

  // Interactive Accent (UI Chrome ONLY)
  accent: '#8FB3D9',
  accentDim: '#6E93B8',
  accentSoft: 'rgba(143,179,217,.16)',

  // Alert indicator
  alert: '#FF704F',

  // Heat Scale (Normative thermal bands - RISK ONLY)
  heatScale: {
    safe: '#2FA37C',
    moderate: '#E8C547',
    high: '#F59E0B',
    veryhigh: '#FF704F',
    extreme: '#C31D3C',
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
  chips: '6px',
  inputs: '8px',
  buttons: '8px',
  cards: '14px',
  overlays: '22px',
  pills: '9999px',
} as const;

export const THEME_SHADOWS = {
  l1: 'none',
  l2: '0 20px 60px -30px rgba(0, 0, 0, 0.90)',
  l3: '0 30px 80px -40px rgba(0, 0, 0, 0.95)',
  highlight: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
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
    color: THEME_COLORS.heatScale.safe,
    minScore: 0,
    maxScore: 24.9,
    description: 'Minimal thermal strain. Normal outdoor physical activity tolerable.',
  },
  moderate: {
    code: 'moderate',
    label: 'Moderate',
    color: THEME_COLORS.heatScale.moderate,
    minScore: 25,
    maxScore: 49.9,
    description: 'Elevated discomfort. Regular hydration and shaded rest advised.',
  },
  high: {
    code: 'high',
    label: 'High Risk',
    color: THEME_COLORS.heatScale.high,
    minScore: 50,
    maxScore: 69.9,
    description: 'Heat cramps or exhaustion likely. Implement 30m work-rest cycles.',
  },
  veryhigh: {
    code: 'veryhigh',
    label: 'Very High Risk',
    color: THEME_COLORS.heatScale.veryhigh,
    minScore: 70,
    maxScore: 84.9,
    description: 'Dangerous thermal stress. Suspend non-essential afternoon outdoor manual labor.',
  },
  extreme: {
    code: 'extreme',
    label: 'Extreme / Emergency',
    color: THEME_COLORS.heatScale.extreme,
    minScore: 85,
    maxScore: 100,
    description: 'Acute heat stroke emergency. Cease outdoor heavy labor; activate emergency cooling shelters.',
  },
};

export function getRiskBand(score: number): RiskBandDefinition {
  if (score < 25) return RISK_BANDS.safe;
  if (score < 50) return RISK_BANDS.moderate;
  if (score < 70) return RISK_BANDS.high;
  if (score < 85) return RISK_BANDS.veryhigh;
  return RISK_BANDS.extreme;
}
