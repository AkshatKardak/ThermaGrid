import React from 'react';
import { Layers, Users, Home, Flame } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const LayerControls: React.FC = () => {
  const { activeLayers, toggleLayer } = useAppStore();

  const layers = [
    { key: 'wardChoropleth' as const, label: 'Ward Risk Choropleth', icon: Flame },
    { key: 'coolingCentres' as const, label: 'Cooling Shelters & Hubs', icon: Home },
    { key: 'outdoorWorkers' as const, label: 'Outdoor Workforce Exposure', icon: Users },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 bg-[#1F3445]/90 backdrop-blur-md p-2 rounded-xl border border-white/10 text-xs">
      <div className="flex items-center gap-1.5 text-[#8B9AA8] px-2 font-mono text-[11px] uppercase">
        <Layers className="w-3.5 h-3.5" />
        <span>Layers:</span>
      </div>

      {layers.map((layer) => {
        const Icon = layer.icon;
        const isActive = activeLayers[layer.key];
        return (
          <button
            key={layer.key}
            onClick={() => toggleLayer(layer.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              isActive
                ? 'bg-[#7FA6C9] text-white shadow-sm'
                : 'bg-white/5 text-[#8B9AA8] hover:text-[#D7E0E7] hover:bg-white/10'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {layer.label}
          </button>
        );
      })}
    </div>
  );
};
