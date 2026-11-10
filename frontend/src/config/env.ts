/**
 * Centralized typed environment configuration.
 * Single source of truth for import.meta.env values.
 * Components must NEVER read import.meta.env directly.
 */

interface EnvConfig {
  readonly API_BASE_URL: string;
  readonly APP_NAME: string;
  readonly CLERK_PUBLISHABLE_KEY: string;
  readonly MAP_STYLE_URL: string;
  readonly MAPBOX_TOKEN: string;
  readonly ENABLE_3D: boolean;
  readonly ENABLE_ANALYTICS: boolean;
  readonly DEFAULT_CITY: string;
}

const rawEnv = import.meta.env;

export const env: EnvConfig = Object.freeze({
  API_BASE_URL: rawEnv.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  APP_NAME: rawEnv.VITE_APP_NAME || 'ThermaGrid',
  CLERK_PUBLISHABLE_KEY: rawEnv.VITE_CLERK_PUBLISHABLE_KEY || '',
  MAP_STYLE_URL: rawEnv.VITE_MAP_STYLE_URL || 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  MAPBOX_TOKEN: rawEnv.VITE_MAPBOX_TOKEN || '',
  ENABLE_3D: rawEnv.VITE_ENABLE_3D !== 'false',
  ENABLE_ANALYTICS: rawEnv.VITE_ENABLE_ANALYTICS !== 'false',
  DEFAULT_CITY: rawEnv.VITE_DEFAULT_CITY || 'Mumbai',
});
