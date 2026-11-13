/**
 * API response and domain types for ThermaGrid.
 * Mirrors backend Pydantic schemas.
 */

export interface Location {
  id: number;
  state: string;
  district: string;
  city: string;
  ward_code: string;
  ward_name: string;
  latitude: number;
  longitude: number;
  area_sq_km: number | null;
  population: number;
  population_density_per_km2: number;
  outdoor_worker_ratio: number | null;
  informal_settlement_ratio: number | null;
  tree_canopy_fraction: number | null;
  elderly_ratio: number | null;
  children_ratio: number | null;
  cooling_access_deficit: number | null;
  hospital_count: number;
  drinking_water_deficit: number;
  description: string | null;
  geometry_geojson?: {
    type: string;
    coordinates: number[][][];
  };
}

export interface WeatherCurrent {
  location_id: number;
  city: string;
  ward_name: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
  temperature_c: number;
  rel_humidity_pct: number;
  wind_speed_ms: number;
  solar_radiation_wm2: number;
  apparent_temperature_c: number | null;
  source_name: string;
  is_demo: boolean;
  demo_label?: string;
}

export interface HourlyWeatherItem {
  time: string;
  temperature_c: number;
  rel_humidity_pct: number;
  wind_speed_ms: number;
  solar_radiation_wm2: number;
}

export interface WeatherForecast {
  location_id: number;
  city: string;
  ward_name: string;
  hourly: HourlyWeatherItem[];
  is_demo: boolean;
  demo_label?: string;
}

export interface ThermalCurrent {
  location_id: number;
  city: string;
  ward_name: string;
  calculated_for: string;
  wbgt_c: number;
  wet_bulb_c: number;
  globe_temp_c: number;
  wbgt_category: string;
  wbgt_work_rest_guidance: string;
  utci_c: number;
  utci_category: string;
  utci_impact: string;
  heat_index_c: number;
  heat_index_category: string;
  heat_index_warning: string;
  citation: string;
  is_demo: boolean;
  demo_label?: string;
}

export interface HourlyThermalItem {
  time: string;
  wbgt_c: number;
  utci_c: number;
  heat_index_c: number;
  temperature_c: number;
}

export interface ThermalHistory {
  location_id: number;
  city: string;
  ward_name: string;
  items: HourlyThermalItem[];
  is_demo: boolean;
  demo_label?: string;
}

export interface FactorContribution {
  name: string;
  share_pct: number;
  value_unit: string;
}

export interface RiskCurrent {
  location_id: number;
  city: string;
  ward_name: string;
  ward_code: string;
  calculated_for: string;
  risk_score: number;
  band: 'safe' | 'moderate' | 'high' | 'veryhigh' | 'extreme';
  band_label: string;
  alert_color: string;
  hazard_score: number;
  exposure_index: number;
  vulnerability_index: number;
  factor_breakdown: FactorContribution[];
  explanation: string;
  temperature_c: number;
  wbgt_c: number;
  utci_c: number;
  confidence: number;
  latitude?: number;
  longitude?: number;
  population?: number;
  imd_grade?: 'NORMAL' | 'YELLOW' | 'ORANGE' | 'RED';
  imd_label?: string;
  consecutive_hot_days?: number;
  consecutive_hot_nights?: number;
  hours_to_threshold?: number | null;
  is_demo: boolean;
  demo_label?: string;
}

export interface HourlyRiskForecastItem {
  time: string;
  predicted_risk_score: number;
  lower_bound: number;
  upper_bound: number;
  band: string;
  predicted_wbgt: number;
  temperature_c: number;
}

export interface RiskForecast {
  location_id: number;
  city: string;
  ward_name: string;
  forecast_days: number;
  items: HourlyRiskForecastItem[];
  model_name: string;
  is_demo: boolean;
  demo_label?: string;
}

export interface CoolingCentre {
  id: number;
  name: string;
  facility_type: string;
  city: string;
  ward_name?: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity_persons: number;
  current_occupancy: number;
  amenities?: string[];
  operating_hours: string;
  contact_phone: string;
  distance_km?: number;
  is_demo: boolean;
  demo_label?: string;
}

export interface Alert {
  id: number;
  location_id: number;
  alert_level: string;
  title: string;
  message: string;
  action_directives: string;
  target_audience: string;
  channels: string;
  is_active: boolean;
  dispatched_at: string;
  city?: string;
  ward_name?: string;
}

export interface DataSource {
  id: number;
  name: string;
  provider: string;
  url: string;
  spatial_resolution: string;
  temporal_resolution: string;
  date_range: string;
  license: string;
  variables: string;
  update_frequency: string;
  description?: string;
}

export interface SimulationResult {
  location_id: number;
  city: string;
  ward_name: string;
  baseline_risk_score: number;
  simulated_risk_score: number;
  risk_reduction_points: number;
  baseline_wbgt_c: number;
  simulated_wbgt_c: number;
  estimated_uhi_reduction_c: number;
  population_protected_count: number;
  is_demo: boolean;
  demo_label: string;
}

export const TYPES_VERSION = '1.0.0';
