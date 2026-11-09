import { create } from 'zustand';
import { INDIAN_STATES, getCitiesForState, getStateForCity } from '../config/indiaGeo';

interface LayerState {
  heatField: boolean;
  wardChoropleth: boolean;
  populationDensity: boolean;
  outdoorWorkers: boolean;
  coolingCentres: boolean;
}

interface AppState {
  selectedState: string;
  selectedCity: string;
  selectedLocationId: number;
  activeLayers: LayerState;

  setSelectedState: (state: string) => void;
  setSelectedCity: (city: string) => void;
  setSelectedLocationId: (id: number) => void;
  toggleLayer: (layer: keyof LayerState) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedState: 'Maharashtra',
  selectedCity: 'Mumbai',
  selectedLocationId: 1,
  activeLayers: {
    heatField: true,
    wardChoropleth: true,
    populationDensity: false,
    outdoorWorkers: true,
    coolingCentres: true,
  },

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

  setSelectedLocationId: (id: number) => set({ selectedLocationId: id }),

  toggleLayer: (layer) =>
    set((state) => ({
      activeLayers: {
        ...state.activeLayers,
        [layer]: !state.activeLayers[layer],
      },
    })),
}));
