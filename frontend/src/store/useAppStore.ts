import { create } from 'zustand';

export const USER_ROLES = ['citizen', 'worker', 'authority'] as const;
export type UserRole = (typeof USER_ROLES)[number];

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
  userRole: UserRole;
  activeLayers: LayerState;
  
  setSelectedCity: (city: string) => void;
  setSelectedLocationId: (id: number) => void;
  setUserRole: (role: UserRole) => void;
  toggleLayer: (layer: keyof LayerState) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedCity: 'Mumbai',
  selectedLocationId: 1,
  userRole: 'citizen',
  activeLayers: {
    heatField: true,
    wardChoropleth: true,
    populationDensity: false,
    outdoorWorkers: true,
    coolingCentres: true,
  },

  setSelectedCity: (city) => set({ selectedCity: city }),
  setSelectedLocationId: (id) => set({ selectedLocationId: id }),
  setUserRole: (role) => set({ userRole: role }),
  toggleLayer: (layer) =>
    set((state) => ({
      activeLayers: {
        ...state.activeLayers,
        [layer]: !state.activeLayers[layer],
      },
    })),
}));
