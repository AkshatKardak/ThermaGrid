import { create } from 'zustand';
import { getCitiesForState, getStateForCity } from '../config/indiaGeo';

export interface LayerState {
  heatField: boolean;
  wardChoropleth: boolean;
  populationDensity: boolean;
  outdoorWorkers: boolean;
  coolingCentres: boolean;
}

export interface TimeRangeState {
  from: string;
  to: string;
}

interface AppState {
  selectedState: string;
  selectedCity: string;
  selectedLocationId: number;
  timeRange: TimeRangeState;
  activeLayers: LayerState;

  setSelectedState: (state: string) => void;
  setSelectedCity: (city: string) => void;
  setSelectedLocationId: (id: number) => void;
  setTimeRange: (range: TimeRangeState) => void;
  toggleLayer: (layer: keyof LayerState) => void;
  setLayers: (layers: Partial<LayerState>) => void;
}

function syncToUrl(
  wardId?: number,
  timeRange?: TimeRangeState,
  layers?: LayerState
) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);

  if (wardId) {
    url.searchParams.set('ward', String(wardId));
  }
  if (timeRange?.from) {
    url.searchParams.set('from', timeRange.from);
  } else {
    url.searchParams.delete('from');
  }
  if (timeRange?.to) {
    url.searchParams.set('to', timeRange.to);
  } else {
    url.searchParams.delete('to');
  }
  if (layers) {
    const active = Object.entries(layers)
      .filter(([_, v]) => v)
      .map(([k]) => k)
      .join(',');
    if (active) {
      url.searchParams.set('layers', active);
    } else {
      url.searchParams.delete('layers');
    }
  }

  window.history.replaceState(null, '', url.toString());
}

function getInitialParams() {
  const defaultLayers: LayerState = {
    heatField: true,
    wardChoropleth: true,
    populationDensity: false,
    outdoorWorkers: true,
    coolingCentres: true,
  };

  if (typeof window === 'undefined') {
    return {
      wardId: 1,
      from: '',
      to: '',
      layers: defaultLayers,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const wardParam = params.get('ward');
  const wardId = wardParam ? parseInt(wardParam, 10) : 1;
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const layersParam = params.get('layers');

  const layers: LayerState = { ...defaultLayers };
  if (layersParam) {
    const list = layersParam.split(',');
    layers.heatField = list.includes('heatField');
    layers.wardChoropleth = list.includes('wardChoropleth');
    layers.populationDensity = list.includes('populationDensity');
    layers.outdoorWorkers = list.includes('outdoorWorkers');
    layers.coolingCentres = list.includes('coolingCentres');
  }

  return {
    wardId: isNaN(wardId) ? 1 : wardId,
    from,
    to,
    layers,
  };
}

const initial = getInitialParams();

export const useAppStore = create<AppState>((set, get) => ({
  selectedState: 'Maharashtra',
  selectedCity: 'Mumbai',
  selectedLocationId: initial.wardId,
  timeRange: { from: initial.from, to: initial.to },
  activeLayers: initial.layers,

  setSelectedState: (stateName: string) => {
    const cities = getCitiesForState(stateName);
    const firstCity = cities[0]?.name || 'Mumbai';
    set({
      selectedState: stateName,
      selectedCity: firstCity,
    });
  },

  setSelectedCity: (city: string) => {
    const matchedState = getStateForCity(city);
    set({
      selectedCity: city,
      ...(matchedState ? { selectedState: matchedState.name } : {}),
    });
  },

  setSelectedLocationId: (id: number) => {
    set({ selectedLocationId: id });
    syncToUrl(id, get().timeRange, get().activeLayers);
  },

  setTimeRange: (range: TimeRangeState) => {
    set({ timeRange: range });
    syncToUrl(get().selectedLocationId, range, get().activeLayers);
  },

  toggleLayer: (layer) => {
    const newLayers = {
      ...get().activeLayers,
      [layer]: !get().activeLayers[layer],
    };
    set({ activeLayers: newLayers });
    syncToUrl(get().selectedLocationId, get().timeRange, newLayers);
  },

  setLayers: (updated) => {
    const newLayers = {
      ...get().activeLayers,
      ...updated,
    };
    set({ activeLayers: newLayers });
    syncToUrl(get().selectedLocationId, get().timeRange, newLayers);
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    const p = getInitialParams();
    useAppStore.setState({
      selectedLocationId: p.wardId,
      timeRange: { from: p.from, to: p.to },
      activeLayers: p.layers,
    });
  });
}
