import { roundNumber } from '../utils/format.ts';

/**
 * First-order biometeorological indoor thermal lag model.
 * Simulates indoor temperature response to outdoor daily cycle across roof types:
 * - Tin roof: Low thermal inertia (tau ~ 1h) + solar absorption gain. Peaks early (~14:30), cools rapidly at night.
 * - RCC roof: High thermal inertia (tau ~ 3.2h), heavy concrete envelope. Peaks late (~17:00), retains heat at night.
 */

export interface ThermalConfig {
  tMean: number;        // Baseline mean daily outdoor temp (°C)
  tAmp: number;         // Amplitude of 24-hour oscillation (°C)
  peakHour: number;     // Hour of outdoor daily peak (15.0 = 15:00)
  tin: {
    tau: number;        // Time constant (hours)
    solarGain: number;  // Peak solar penetration (°C)
  };
  rcc: {
    tau: number;        // Time constant (hours)
    solarGain: number;  // Peak solar penetration (°C)
  };
}

export const THERMAL_CONFIG: ThermalConfig = {
  tMean: 32.0,
  tAmp: 7.0,
  peakHour: 15.0,
  tin: {
    tau: 0.9,          // ~55 min thermal response
    solarGain: 3.8,     // Direct sheet radiation heating
  },
  rcc: {
    tau: 3.4,          // ~3.4 hours thermal mass delay
    solarGain: 0.6,     // Concrete insulative mass attenuation
  },
};

/**
 * Computes outdoor ambient temperature at hour t (0..24).
 * Daily sine wave peaking at peakHour (15:00) with 39°C max and 25°C min.
 */
export function getOutdoorTemp(t: number, config: ThermalConfig = THERMAL_CONFIG): number {
  const omega = (2 * Math.PI) / 24;
  // Sinusoid that peaks at t = config.peakHour: sin(omega * (t - peakHour) + pi/2) = cos(omega * (t - peakHour))
  const temp = config.tMean + config.tAmp * Math.cos(omega * (t - config.peakHour));
  return roundNumber(temp, 2);
}

/**
 * Computes solar radiation gain contribution during daytime (06:00 to 18:00).
 */
function getSolarGain(t: number, gainMax: number): number {
  if (t < 6 || t > 18) return 0;
  // Half-sine solar bell curve from 06:00 to 18:00 peaking at 12:00
  const SOLAR_SPAN_HOURS = 12;
  const solarAngle = ((t - 6) / SOLAR_SPAN_HOURS) * Math.PI;
  return gainMax * Math.sin(solarAngle);
}

/**
 * First-order steady state thermal lag response for sinusoidal outdoor forcing.
 * Output(t) = Mean + Amp_attenuated * cos(omega*(t - peakHour) - phase_lag) + SolarGain(t)
 */
function computeBuildingIndoorTemp(
  t: number,
  tau: number,
  solarGainMax: number,
  config: ThermalConfig
): number {
  const omega = (2 * Math.PI) / 24;
  const phaseLagRad = Math.atan(omega * tau);
  const phaseLagHours = phaseLagRad / omega;
  const attenuation = 1 / Math.sqrt(1 + Math.pow(omega * tau, 2));

  const baseResponse =
    config.tMean +
    config.tAmp * attenuation * Math.cos(omega * (t - config.peakHour - phaseLagHours));

  const solar = getSolarGain(t, solarGainMax);
  return roundNumber(baseResponse + solar, 2);
}

export interface ThermalState {
  hour: number;
  timeFormatted: string;
  outdoorTemp: number;
  tinIndoorTemp: number;
  rccIndoorTemp: number;
  tinAlertGrade: 'safe' | 'moderate' | 'high' | 'veryhigh' | 'extreme';
  rccAlertGrade: 'safe' | 'moderate' | 'high' | 'veryhigh' | 'extreme';
  lagHours: number;
}

export function getAlertGrade(temp: number): 'safe' | 'moderate' | 'high' | 'veryhigh' | 'extreme' {
  if (temp < 28) return 'safe';
  if (temp < 33) return 'moderate';
  if (temp < 37) return 'high';
  if (temp < 40) return 'veryhigh';
  return 'extreme';
}

/**
 * Evaluates the full thermal state at hour t (0..24).
 */
export function evaluateThermalLag(t: number, config: ThermalConfig = THERMAL_CONFIG): ThermalState {
  const hourNorm = ((t % 24) + 24) % 24;
  const outdoor = getOutdoorTemp(hourNorm, config);
  const tinIndoor = computeBuildingIndoorTemp(hourNorm, config.tin.tau, config.tin.solarGain, config);
  const rccIndoor = computeBuildingIndoorTemp(hourNorm, config.rcc.tau, config.rcc.solarGain, config);

  const hours = Math.floor(hourNorm);
  const mins = Math.floor((hourNorm - hours) * 60);
  const timeFormatted = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

  return {
    hour: hourNorm,
    timeFormatted,
    outdoorTemp: outdoor,
    tinIndoorTemp: tinIndoor,
    rccIndoorTemp: rccIndoor,
    tinAlertGrade: getAlertGrade(tinIndoor),
    rccAlertGrade: getAlertGrade(rccIndoor),
    lagHours: 2.3, // ~2.3 hours nominal phase shift
  };
}
