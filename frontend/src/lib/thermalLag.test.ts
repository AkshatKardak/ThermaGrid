import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateThermalLag, getOutdoorTemp } from './thermalLag.ts';
import { formatNumber } from '../utils/format.ts';

test('thermalLag model is deterministic', () => {
  const s1 = evaluateThermalLag(14.5);
  const s2 = evaluateThermalLag(14.5);
  assert.deepEqual(s1, s2);
  assert.equal(s1.outdoorTemp, s2.outdoorTemp);
  assert.equal(s1.tinIndoorTemp, s2.tinIndoorTemp);
  assert.equal(s1.rccIndoorTemp, s2.rccIndoorTemp);
});

test('outdoor daily curve peaks at 15:00 at 39°C', () => {
  const peak = getOutdoorTemp(15.0);
  assert.equal(peak, 39.0);
});

test('outdoor daily curve reaches minimum at 03:00 at 25°C', () => {
  const min = getOutdoorTemp(3.0);
  assert.equal(min, 25.0);
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

  assert.ok(tinPeakHour < rccPeakHour, `Tin peak (${tinPeakHour}) should precede RCC peak (${rccPeakHour})`);

  const lagHours = rccPeakHour - tinPeakHour;
  assert.ok(
    lagHours >= 1.5 && lagHours <= 3.5,
    `RCC peak lag (${formatNumber(lagHours, 2)}h) must be between 1.5h and 3.5h`
  );
});

test('nocturnal indoor temp of RCC stays higher than tin at 03:00', () => {
  const stateAt03 = evaluateThermalLag(3.0);
  assert.ok(
    stateAt03.rccIndoorTemp > stateAt03.tinIndoorTemp,
    `RCC indoor (${stateAt03.rccIndoorTemp}°C) must be higher than tin (${stateAt03.tinIndoorTemp}°C) at 03:00`
  );
  // Verify difference is significant (at least 1.5°C retention)
  assert.ok(stateAt03.rccIndoorTemp - stateAt03.tinIndoorTemp > 1.5);
});
