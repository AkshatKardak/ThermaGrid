/**
 * MapLibre & CARTO Basemap Configuration.
 * Free, keyless vector basemap with dark cartographic styling.
 */

export const MAP_STYLE_URL =
  import.meta.env.VITE_MAP_STYLE_URL ||
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
