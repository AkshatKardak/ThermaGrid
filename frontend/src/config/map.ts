/**
 * Keyless Vector Basemap Configuration (OpenFreeMap / OSM).
 * Free, keyless vector basemap with dark cartographic styling.
 */

export const MAP_STYLE_URL =
  import.meta.env.VITE_MAP_STYLE_URL ||
  'https://tiles.openfreemap.org/styles/positron';

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
