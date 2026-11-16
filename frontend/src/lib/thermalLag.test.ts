import { test, expect } from 'vitest';
import { evaluateThermalLag, getOutdoorTemp } from './thermalLag.ts';
import { formatNumber } from '../utils/format.ts';

test('thermalLag model is deterministic', () => {
  const s1 = evaluateThermalLag(14.5);
  const s2 = evaluateThermalLag(14.5);
  expect(s1).toEqual(s2);
  expect(s1.outdoorTemp).toBe(s2.outdoorTemp);
  expect(s1.tinIndoorTemp).toBe(s2.tinIndoorTemp);
  expect(s1.rccIndoorTemp).toBe(s2.rccIndoorTemp);
});

test('outdoor daily curve peaks at 15:00 at 39°C', () => {
  const peak = getOutdoorTemp(15.0);
  expect(peak).toBe(39.0);
});

test('outdoor daily curve reaches minimum at 03:00 at 25°C', () => {
  const min = getOutdoorTemp(3.0);
  expect(min).toBe(25.0);
});

test('tin roof peaks before RCC roof, with peak lag between 1.5h and 3.5h', () => {
  let tinPeakHour = 0;
  let tinPeakTemp = -Infinity;
  let rccPeakHour = 0;
  let rccPeakTemp = -Infinity;

  for (let t = 0; t <= 24; t += 0.05) {
    const state = evaluateThermalLag(t);
    if (state.tinIndoorTemp > tinPeakTemp) {
      tinPeakTemp = state.tinIndoorTemp;
      tinPeakHour = t;
    }
    if (state.rccIndoorTemp > rccPeakTemp) {
      rccPeakTemp = state.rccIndoorTemp;
      rccPeakHour = t;
    }
  }

  expect(tinPeakHour).toBeLessThan(rccPeakHour);

  const lagHours = rccPeakHour - tinPeakHour;
  expect(lagHours).toBeGreaterThanOrEqual(1.5);
  expect(lagHours).toBeLessThanOrEqual(3.5);
});

test('nocturnal indoor temp of RCC stays higher than tin at 03:00', () => {
  const stateAt03 = evaluateThermalLag(3.0);
  expect(stateAt03.rccIndoorTemp).toBeGreaterThan(stateAt03.tinIndoorTemp);
  // Verify difference is significant (at least 1.5°C retention)
  expect(stateAt03.rccIndoorTemp - stateAt03.tinIndoorTemp).toBeGreaterThan(1.5);
});
