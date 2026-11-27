import { create } from 'zustand';
import {
  firstCityOf,
  getStateByCodeOrName,
  getStateForCity,
  wardBelongsToCity,
} from '../config/indiaGeo';

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

export type Selection = {
  stateCode: string | null;
  cityCode: string | null;
  wardId: number | null; // derived, never set independently of cityCode
};

export interface AppState {
  selection: Selection;
  // Convenience read fields for backward compatibility
  selectedState: string;
  selectedCity: string;
  selectedLocationId: number | null;
  timeRange: TimeRangeState;
  activeLayers: LayerState;

  setSelection: (action: {
    stateCode?: string | null;
    cityCode?: string | null;
    wardId?: number | null;
  }) => void;
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
  } else {
    url.searchParams.delete('ward');
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

const initialSelection: Selection = {
  stateCode: 'MH',
  cityCode: 'Mumbai',
  wardId: initial.wardId,
};

export const useAppStore = create<AppState>((set, get) => ({
  selection: initialSelection,
  selectedState: 'Maharashtra',
  selectedCity: 'Mumbai',
  selectedLocationId: initial.wardId,
  timeRange: { from: initial.from, to: initial.to },
  activeLayers: initial.layers,

  setSelection: (action) => {
    const current = get().selection;

    // Case 1: State explicitly changed alone
    if (action.stateCode !== undefined && action.cityCode === undefined && action.wardId === undefined) {
      const matchedState = getStateByCodeOrName(action.stateCode);
      const resolvedStateCode = matchedState ? matchedState.code : action.stateCode;
      const cityCode = firstCityOf(resolvedStateCode);
      const nextSelection: Selection = {
        stateCode: resolvedStateCode,
        cityCode,
        wardId: null,
      };
      set({
        selection: nextSelection,
        selectedState: matchedState?.name || resolvedStateCode || '',
        selectedCity: cityCode || '',
        selectedLocationId: null,
      });
      syncToUrl(undefined, get().timeRange, get().activeLayers);
      return;
    }

    // Case 2: City explicitly changed alone
    if (action.cityCode !== undefined && action.stateCode === undefined && action.wardId === undefined) {
      const matchedState = getStateForCity(action.cityCode || '');
      const stateCode = matchedState?.code || current.stateCode;
      const nextSelection: Selection = {
        stateCode,
        cityCode: action.cityCode,
        wardId: null,
      };
      set({
        selection: nextSelection,
        selectedState: matchedState?.name || current.stateCode || '',
        selectedCity: action.cityCode || '',
        selectedLocationId: null,
      });
      syncToUrl(undefined, get().timeRange, get().activeLayers);
      return;
    }

    // Case 3: Ward explicitly changed alone
    if (action.wardId !== undefined && action.stateCode === undefined && action.cityCode === undefined) {
      if (action.wardId === null) {
        const nextSelection: Selection = {
          ...current,
          wardId: null,
        };
        set({
          selection: nextSelection,
          selectedLocationId: null,
        });
        syncToUrl(undefined, get().timeRange, get().activeLayers);
        return;
      }

      if (!wardBelongsToCity(action.wardId, current.cityCode)) {
        if (import.meta.env.DEV) {
          console.warn('Rejecting wardId: ward does not belong to current cityCode', {
            wardId: action.wardId,
            cityCode: current.cityCode,
          });
        }
        return; // Reject without mutation
      }

      const nextSelection: Selection = {
        ...current,
        wardId: action.wardId,
      };
      set({
        selection: nextSelection,
        selectedLocationId: action.wardId,
      });
      syncToUrl(action.wardId, get().timeRange, get().activeLayers);
      return;
    }

    // Case 4: Multiple or complete selection provided
    const stateCode = action.stateCode !== undefined ? action.stateCode : current.stateCode;
    let cityCode = action.cityCode !== undefined ? action.cityCode : current.cityCode;
    let wardId = action.wardId !== undefined ? action.wardId : current.wardId;

    if (action.stateCode && !action.cityCode) {
      cityCode = firstCityOf(stateCode);
      wardId = null;
    } else if (action.cityCode && action.wardId === undefined) {
      wardId = null;
    }

    if (wardId !== null && wardId !== undefined && !wardBelongsToCity(wardId, cityCode)) {
      if (import.meta.env.DEV) {
        console.warn('Rejecting wardId: ward does not belong to current cityCode', {
          wardId,
          cityCode,
        });
      }
      wardId = null;
    }

    const matchedState = getStateByCodeOrName(stateCode);
    const nextSelection: Selection = {
      stateCode: matchedState?.code || stateCode,
      cityCode,
      wardId: wardId ?? null,
    };
    set({
      selection: nextSelection,
      selectedState: matchedState?.name || stateCode || '',
      selectedCity: cityCode || '',
      selectedLocationId: wardId ?? null,
    });
    syncToUrl(wardId ?? undefined, get().timeRange, get().activeLayers);
  },

  setTimeRange: (range: TimeRangeState) => {
    set({ timeRange: range });
    syncToUrl(get().selection.wardId ?? undefined, range, get().activeLayers);
  },

  toggleLayer: (layer) => {
    const newLayers = {
      ...get().activeLayers,
      [layer]: !get().activeLayers[layer],
    };
    set({ activeLayers: newLayers });
    syncToUrl(get().selection.wardId ?? undefined, get().timeRange, newLayers);
  },

  setLayers: (updated) => {
    const newLayers = {
      ...get().activeLayers,
      ...updated,
    };
    set({ activeLayers: newLayers });
    syncToUrl(get().selection.wardId ?? undefined, get().timeRange, newLayers);
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    const p = getInitialParams();
    const current = useAppStore.getState().selection;
    useAppStore.setState({
      selection: {
        ...current,
        wardId: p.wardId,
      },
      selectedLocationId: p.wardId,
      timeRange: { from: p.from, to: p.to },
      activeLayers: p.layers,
    });
  });
}
