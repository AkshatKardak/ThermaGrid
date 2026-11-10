/**
 * WCAG 2.1 Contrast Ratio Verification Script for ThermaGrid Light Theme
 */

function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '').trim();
  const num = parseInt(cleanHex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

function contrastRatio(hex1: string, hex2: string): number {
  const lum1 = relativeLuminance(hex1);
  const lum2 = relativeLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Single Source of Truth Tokens
const TOKENS = {
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
  risk1: '#2FA37C',
  risk2: '#E8C547',
  risk3: '#D97706',
  risk4: '#FF704F',
  risk5: '#C31D3C',
};

interface Check {
  pair: string;
  fg: string;
  bg: string;
  expectedMinRatio?: number;
  expectedMaxRatio?: number;
  expectedVerdict: 'pass' | 'fail';
  description: string;
}

const checks: Check[] = [
  // Core text contrast (WCAG AA Normal Text >= 4.5:1)
  { pair: 'ink / bg', fg: TOKENS.ink, bg: TOKENS.bg, expectedMinRatio: 4.5, expectedVerdict: 'pass', description: 'Primary text on page background' },
  { pair: 'ink / surface', fg: TOKENS.ink, bg: TOKENS.surface, expectedMinRatio: 4.5, expectedVerdict: 'pass', description: 'Primary text on cards & panels' },
  { pair: 'ink / raised', fg: TOKENS.ink, bg: TOKENS.raised, expectedMinRatio: 4.5, expectedVerdict: 'pass', description: 'Primary text on inputs & elevated surfaces' },

  { pair: 'muted / bg', fg: TOKENS.muted, bg: TOKENS.bg, expectedMinRatio: 4.5, expectedVerdict: 'pass', description: 'Secondary labels on page background' },
  { pair: 'muted / surface', fg: TOKENS.muted, bg: TOKENS.surface, expectedMinRatio: 4.5, expectedVerdict: 'pass', description: 'Secondary labels on cards & panels' },
  { pair: 'muted / raised', fg: TOKENS.muted, bg: TOKENS.raised, expectedMinRatio: 4.5, expectedVerdict: 'pass', description: 'Secondary labels on inputs' },

  { pair: 'on-accent / accent', fg: TOKENS.onAccent, bg: TOKENS.accent, expectedMinRatio: 4.5, expectedVerdict: 'pass', description: 'Text on primary button / active nav' },
  { pair: 'on-accent / accent-hover', fg: TOKENS.onAccent, bg: TOKENS.accentHover, expectedMinRatio: 4.5, expectedVerdict: 'pass', description: 'Text on hovered button' },
  { pair: 'accent / bg (links)', fg: TOKENS.accent, bg: TOKENS.bg, expectedMinRatio: 4.5, expectedVerdict: 'pass', description: 'Interactive links on background' },
  { pair: 'error / raised', fg: TOKENS.error, bg: TOKENS.raised, expectedMinRatio: 4.5, expectedVerdict: 'pass', description: 'Error message on input / modal' },
  { pair: 'raised / panel-dark', fg: TOKENS.raised, bg: TOKENS.panelDark, expectedMinRatio: 7.0, expectedVerdict: 'pass', description: '3D and Map DOM overlays on dark canvas' },

  // Risk scale as text verification:
  // Risk 1-4 must FAIL contrast against light surfaces, proving why they are NEVER used as text!
  { pair: 'risk-1 / bg', fg: TOKENS.risk1, bg: TOKENS.bg, expectedMaxRatio: 4.5, expectedVerdict: 'fail', description: 'Safe band color as text (MUST FAIL)' },
  { pair: 'risk-2 / bg', fg: TOKENS.risk2, bg: TOKENS.bg, expectedMaxRatio: 4.5, expectedVerdict: 'fail', description: 'Moderate band color as text (MUST FAIL)' },
  { pair: 'risk-3 / bg', fg: TOKENS.risk3, bg: TOKENS.bg, expectedMaxRatio: 4.5, expectedVerdict: 'fail', description: 'High band color as text (MUST FAIL)' },
  { pair: 'risk-4 / bg', fg: TOKENS.risk4, bg: TOKENS.bg, expectedMaxRatio: 4.5, expectedVerdict: 'fail', description: 'Very High band color as text (MUST FAIL)' },

  // Risk-5 is the single exception: passes >= 4.5:1
  { pair: 'risk-5 / bg', fg: TOKENS.risk5, bg: TOKENS.bg, expectedMinRatio: 4.5, expectedVerdict: 'pass', description: 'Extreme band text exception (MUST PASS >= 4.5:1)' },
  { pair: 'risk-5 / surface', fg: TOKENS.risk5, bg: TOKENS.surface, expectedMinRatio: 4.5, expectedVerdict: 'pass', description: 'Extreme band text on surface (MUST PASS >= 4.5:1)' },
];

console.log('='.repeat(78));
console.log(' THERMAGRID WCAG 2.1 CONTRAST RATIO AUDIT');
console.log('='.repeat(78));
console.log(
  'Pair'.padEnd(25) +
  'Ratio'.padEnd(12) +
  'Expected'.padEnd(12) +
  'Result'.padEnd(10) +
  'Description'
);
console.log('-'.repeat(78));

let allPassed = true;

for (const c of checks) {
  const ratio = contrastRatio(c.fg, c.bg);
  const formattedRatio = `${ratio.toFixed(2)}:1`;

  let verdict: 'PASS' | 'FAIL';
  if (c.expectedVerdict === 'pass') {
    verdict = (c.expectedMinRatio && ratio >= c.expectedMinRatio) ? 'PASS' : 'FAIL';
  } else {
    verdict = (c.expectedMaxRatio && ratio < c.expectedMaxRatio) ? 'PASS' : 'FAIL';
  }

  if (verdict === 'FAIL') allPassed = false;

  console.log(
    c.pair.padEnd(25) +
    formattedRatio.padEnd(12) +
    c.expectedVerdict.toUpperCase().padEnd(12) +
    verdict.padEnd(10) +
    c.description
  );
}

console.log('='.repeat(78));
if (allPassed) {
  console.log('✅ ALL CONTRAST CHECKS PASSED THE AUDIT CONTRACT PERFECTLY.');
} else {
  console.error('❌ SOME CHECKS FAILED!');
  process.exit(1);
}
