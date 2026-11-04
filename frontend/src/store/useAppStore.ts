import { create } from 'zustand';

interface LayerState {
  heatField: boolean;
  wardChoropleth: boolean;
  populationDensity: boolean;
  outdoorWorkers: boolean;
  coolingCentres: boolean;
}

interface AppState {
  selectedCity: string;
  selectedLocationId: number;
  activeLayers: LayerState;

  setSelectedCity: (city: string) => void;
  setSelectedLocationId: (id: number) => void;
  toggleLayer: (layer: keyof LayerState) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedCity: 'Mumbai',
  selectedLocationId: 1,
  activeLayers: {
    heatField: true,
    wardChoropleth: true,
    populationDensity: false,
    outdoorWorkers: true,
    coolingCentres: true,
  },

  setSelectedCity: (city) => set({ selectedCity: city }),
  setSelectedLocationId: (id) => set({ selectedLocationId: id }),
  toggleLayer: (layer) =>
    set((state) => ({
      activeLayers: {
        ...state.activeLayers,
        [layer]: !state.activeLayers[layer],
      },
    })),
}));
