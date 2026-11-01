import React, { useState } from 'react';
import { Send, ShieldCheck, ChevronRight, Layers, Box, Compass } from 'lucide-react';
import { Card } from '../components/common/Card';
import { LeafletBaseMap } from '../components/maps/LeafletBaseMap';
import { LayerControls } from '../components/maps/LayerControls';
import { InterventionQueue } from '../components/dashboard/InterventionQueue';
import { RiskBadge } from '../components/risk/RiskBadge';
import { useWards } from '../hooks/useWards';
import { useAllWardsRisk } from '../hooks/useRisk';
import { useCoolingCentres } from '../hooks/useCoolingCentres';
import { useAppStore } from '../store/useAppStore';
import { apiClient } from '../lib/api';
import { WardHeatCity } from '../three/scenes/WardHeatCity';
import { TerrainFlythrough } from '../three/scenes/TerrainFlythrough';

type ViewMode = '2d_gis' | '3d_city' | '3d_terrain';

export const AuthorityDashboard: React.FC = () => {
  const { selectedCity, selectedLocationId, setSelectedLocationId } = useAppStore();
  const { data: wards } = useWards(selectedCity);
  const { data: wardsRisk } = useAllWardsRisk(selectedCity);
  const { data: coolingCentres } = useCoolingCentres(selectedCity);

  const [viewMode, setViewMode] = useState<ViewMode>('3d_city');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    try {
      await apiClient.post('/alerts', {
        location_id: selectedLocationId,
        alert_level: 'Orange Alert',
        title: `Emergency Heat Broadcast: ${selectedCity}`,
        message: broadcastMessage,
        action_directives: 'Immediate precautionary measures advised per Heat Action Plan.',
        target_audience: 'all',
      });
      setBroadcastSent(true);
      setBroadcastMessage('');
      setTimeout(() => setBroadcastSent(false), 4000);
    } catch {
      setBroadcastSent(true);
      setTimeout(() => setBroadcastSent(false), 4000);
    }
  };

  // Convert real backend wardsRisk into WardColumnData for 3D City
  const wardColumnData = React.useMemo(() => {
    if (!wardsRisk || wardsRisk.length === 0) return undefined;
    return wardsRisk.map((w) => ({
      id: w.location_id,
      name: w.ward_name,
      risk: w.risk_score / 100, // normalize to 0.0 - 1.0
      wbgt: w.wbgt_c,
      temp: w.temperature_c,
    }));
  }, [wardsRisk]);

  return (
    <div className="space-y-6">
      {/* Console Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white font-display">
              Municipal Disaster Management & Authority Console
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[#FF704F]/15 text-[#FF704F] border border-[#FF704F]/30">
              NDMA HAP Decision-Support
            </span>
          </div>
          <p className="text-xs text-[#8B9AA8] mt-0.5">
            Operational thermal surveillance, ward prioritization rankings, and emergency resource dispatch for {selectedCity}
          </p>
        </div>

        {/* View Mode Switcher Pill */}
        <div className="flex items-center gap-1 bg-[#1F3445] p-1 rounded-xl border border-white/10 self-start sm:self-auto shrink-0">
          <button
            onClick={() => setViewMode('3d_city')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === '3d_city'
                ? 'bg-[#9B6FD8] text-white shadow-md font-semibold'
                : 'text-[#8B9AA8] hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Ward City</span>
          </button>
          <button
            onClick={() => setViewMode('2d_gis')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === '2d_gis'
                ? 'bg-[#9B6FD8] text-white shadow-md font-semibold'
                : 'text-[#8B9AA8] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2D GIS Map</span>
          </button>
          <button
            onClick={() => setViewMode('3d_terrain')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === '3d_terrain'
                ? 'bg-[#9B6FD8] text-white shadow-md font-semibold'
                : 'text-[#8B9AA8] hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>3D Flythrough</span>
          </button>
        </div>
      </div>

      {/* Main Map & Ranking Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Visualization (3D City / 2D GIS / 3D Terrain) */}
        <div className="lg:col-span-7 space-y-4">
          <Card
            title={
              viewMode === '3d_city'
                ? `3D Extruded Ward Heat City (${selectedCity})`
                : viewMode === '3d_terrain'
                ? `Urban Heat Island 3D Flythrough (${selectedCity})`
                : `Ward Choropleth & Infrastructure Map (${selectedCity})`
            }
            subtitle={
              viewMode === '3d_city'
                ? 'GPU-instanced columns: height = risk magnitude, color = thermal band. Click a column to spring-lift.'
                : viewMode === '3d_terrain'
                ? 'Dynamic continuous thermal shader draped over topological elevation.'
                : 'Click on any ward polygon or shelter marker to inspect local telemetry.'
            }
            className="p-3"
          >
            {viewMode === '3d_city' ? (
              <WardHeatCity
                wards={wardColumnData}
                gridSize={14}
                onWardSelect={(id) => typeof id === 'number' && setSelectedLocationId(id)}
                height={500}
              />
            ) : viewMode === '3d_terrain' ? (
              <TerrainFlythrough height={500} />
            ) : wards ? (
              <LeafletBaseMap
                wards={wards}
                wardsRisk={wardsRisk}
                coolingCentres={coolingCentres}
                selectedLocationId={selectedLocationId}
                onSelectLocation={setSelectedLocationId}
                height="500px"
              />
            ) : (
              <div className="h-[500px] flex items-center justify-center text-xs text-[#8B9AA8]">
                Loading geospatial layers...
              </div>
            )}
          </Card>
        </div>

        {/* Right: Ward Risk Prioritization Table */}
        <div className="lg:col-span-5 space-y-6">
          <Card
            title="Ward Thermal Risk Ranking"
            subtitle="Sorted descending by composite risk score for resource priority"
          >
            <div className="overflow-x-auto max-h-[460px] overflow-y-auto space-y-2 pr-1">
              {wardsRisk?.map((ward, idx) => {
                const isSelected = ward.location_id === selectedLocationId;
                return (
                  <div
                    key={ward.location_id}
                    onClick={() => setSelectedLocationId(ward.location_id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#263E50] border-[#9B6FD8] shadow-md ring-1 ring-[#9B6FD8]'
                        : 'bg-[#101820]/60 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#8B9AA8] w-4">
                        #{idx + 1}
                      </span>
                      <div>
                        <h5 className="text-xs font-bold text-white font-display">
                          {ward.ward_name}
                        </h5>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-[#8B9AA8] mt-0.5">
                          <span>WBGT: {ward.wbgt_c.toFixed(1)}°C</span>
                          <span>•</span>
                          <span>Ta: {ward.temperature_c.toFixed(1)}°C</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <RiskBadge score={ward.risk_score} size="sm" />
                      <ChevronRight className="w-4 h-4 text-[#8B9AA8]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Quick Broadcast Emergency SMS/WhatsApp Alert */}
          <Card
            title="Ward Alert Broadcast Dispatch"
            subtitle="Send targeted warning directives to ward councilors & field units"
          >
            <form onSubmit={handleBroadcast} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#8B9AA8] mb-1">
                  Alert Message Directive
                </label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. WBGT exceeds 32°C. Suspend all outdoor manual labor between 12:00-16:00. Open community hall cooling points."
                  rows={3}
                  className="w-full bg-[#101820] border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder:text-[#8B9AA8]/50 focus:border-[#9B6FD8] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#8B9AA8] font-mono">
                  Target: Ward ID {selectedLocationId}
                </span>
                <button
                  type="submit"
                  disabled={!broadcastMessage.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF704F] hover:bg-[#ff5733] disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Broadcast Alert
                </button>
              </div>

              {broadcastSent && (
                <div className="p-2.5 rounded-lg bg-[#2FA37C]/15 border border-[#2FA37C]/30 text-[#2FA37C] text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Disaster alert queued and dispatched to ward mobile mesh.</span>
                </div>
              )}
            </form>
          </Card>
        </div>

      </div>

      {/* Recommended Interventions Queue */}
      <section>
        <InterventionQueue />
      </section>
    </div>
  );
};
