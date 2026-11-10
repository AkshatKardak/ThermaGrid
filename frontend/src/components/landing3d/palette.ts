import * as THREE from 'three';
import { THEME_COLORS } from '../../theme/tokens';

export const RISK_THRESHOLDS = {
  SAFE: 25,
  MODERATE: 50,
  HIGH: 70,
  VERY_HIGH: 85,
} as const;

export const RISK_COLORS = {
  safe: THEME_COLORS.heatScale.safe,           // #2FA37C
  moderate: THEME_COLORS.heatScale.moderate,   // #E8C547
  high: THEME_COLORS.heatScale.high,           // #F59E0B
  veryhigh: THEME_COLORS.heatScale.veryhigh,   // #FF704F
  extreme: THEME_COLORS.heatScale.extreme,     // #C31D3C
} as const;

export const THREE_RISK_COLORS = {
  safe: new THREE.Color(RISK_COLORS.safe),
  moderate: new THREE.Color(RISK_COLORS.moderate),
  high: new THREE.Color(RISK_COLORS.high),
  veryhigh: new THREE.Color(RISK_COLORS.veryhigh),
  extreme: new THREE.Color(RISK_COLORS.extreme),
} as const;

export const THREE_SURFACE_COLORS = {
  bg: new THREE.Color(THEME_COLORS.bg),
  surface: new THREE.Color(THEME_COLORS.surface),
  raised: new THREE.Color(THEME_COLORS.raised),
  accent: new THREE.Color(THEME_COLORS.accent),
} as const;

export function getRiskHex(score: number): string {
  if (score < RISK_THRESHOLDS.SAFE) return RISK_COLORS.safe;
  if (score < RISK_THRESHOLDS.MODERATE) return RISK_COLORS.moderate;
  if (score < RISK_THRESHOLDS.HIGH) return RISK_COLORS.high;
  if (score < RISK_THRESHOLDS.VERY_HIGH) return RISK_COLORS.veryhigh;
  return RISK_COLORS.extreme;
}

export function getRiskColor(score: number): THREE.Color {
  if (score < RISK_THRESHOLDS.SAFE) return THREE_RISK_COLORS.safe;
  if (score < RISK_THRESHOLDS.MODERATE) return THREE_RISK_COLORS.moderate;
  if (score < RISK_THRESHOLDS.HIGH) return THREE_RISK_COLORS.high;
  if (score < RISK_THRESHOLDS.VERY_HIGH) return THREE_RISK_COLORS.veryhigh;
  return THREE_RISK_COLORS.extreme;
}
