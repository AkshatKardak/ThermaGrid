/**
 * ThermaGrid Design Tokens
 * Midnight Climate Palette (Single Source of Truth)
 *
 * LAW OF USAGE:
 * - Amethyst (#9B6FD8): UI Chrome, buttons, active nav, focus rings, "live" indicators, 3D rim light ONLY.
 *   NEVER used for a risk value.
 * - Heat scale: Risk values and bands ONLY. Never a headline, a border, or a hover state.
 * - Never pure black (#000000) or pure white (#FFFFFF).
 * - Max one saturated element per viewport region.
 */

export const THEME_COLORS = {
  // Page canvas & base
  bg: '#101820', // Midnight

  // Surface tiers (L1 -> L3)
  surface: '#1F3445', // L1 card
  surfaceElevated: '#263E50', // L2 raised
  surfaceRecessed: '#2F4A5E', // L3 recessed / well / input
  surfaceOverlay: 'rgba(31, 52, 69, 0.82)', // L3 modal/sheet

  // Borders & hairlines
  border: 'rgba(255, 255, 255, 0.08)',
  borderEmphasized: 'rgba(255, 255, 255, 0.16)',

  // Typography shades (never pure white)
  text: '#D7E0E7', // Primary
  textDim: '#8B9AA8', // Secondary
  textFaint: '#5F7183', // Captions, labels, hairlines

  // Interactive Accent (UI Chrome ONLY)
  accent: '#9B6FD8', // Amethyst
  accentDim: '#7F56BD',
  accentSoft: 'rgba(155, 111, 216, 0.18)',

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
