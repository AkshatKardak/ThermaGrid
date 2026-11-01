/**
 * ThermaGrid Design Tokens
 * Midnight Climate Palette (Single Source of Truth)
 *
 * RULE: Interactive accent (Amethyst #9B6FD8) is for chrome and UI controls ONLY.
 * Risk is ALWAYS encoded by the heat scale (safe -> extreme), NEVER by accent.
 */

export const THEME_COLORS = {
  bg: '#101820',          // Midnight
  surface: '#1F3445',     // Panel
  surfaceElevated: '#263E50', // Raised Panel
  border: 'rgba(255, 255, 255, 0.10)',
  text: '#D7E0E7',
  textDim: '#8B9AA8',

  // Interactive Accent (UI Chrome ONLY)
  accent: '#9B6FD8',      // Amethyst
  accentDim: '#7F56BD',
  accentSoft: 'rgba(155, 111, 216, 0.18)',

  // Alert
  alert: '#FF704F',

  // Heat Scale (Normative thermal bands)
  heatScale: {
    safe: '#2FA37C',
    moderate: '#E8C547',
    high: '#F59E0B',
    veryhigh: '#FF704F',
    extreme: '#C31D3C',
  },
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
