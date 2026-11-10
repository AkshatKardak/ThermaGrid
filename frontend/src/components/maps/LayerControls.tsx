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
    <div className="flex flex-wrap items-center gap-2 bg-surface p-2 rounded-[6px] border border-border text-xs">
      <div className="flex items-center gap-1.5 text-muted px-2 font-mono text-[11px] uppercase">
        <Layers className="w-3.5 h-3.5 text-muted" />
        <span>Layers:</span>
      </div>

      {layers.map((layer) => {
        const Icon = layer.icon;
        const isActive = activeLayers[layer.key];
        return (
          <button
            key={layer.key}
            onClick={() => toggleLayer(layer.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] font-mono text-xs font-medium transition-colors cursor-pointer ${
              isActive
                ? 'bg-accent text-on-accent'
                : 'bg-raised text-muted hover:text-ink border border-border'
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
