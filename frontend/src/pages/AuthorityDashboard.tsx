import React, { useState } from 'react';
import {
  ShieldAlert,
  Send,
  ShieldCheck,
  Box,
  Layers,
  ArrowUpDown,
  Lock,
  Clock,
  Radio,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { KpiNumeral } from '../components/ui/KpiNumeral';
import { SectionHeader } from '../components/ui/SectionHeader';
import { RiskBadge } from '../components/risk/RiskBadge';
import { WardHeatCity } from '../three/scenes/WardHeatCity';
import { LeafletBaseMap } from '../components/maps/LeafletBaseMap';
import { InterventionQueue } from '../components/dashboard/InterventionQueue';
import { useWards } from '../hooks/useWards';
import { useAllWardsRisk } from '../hooks/useRisk';
import { useCoolingCentres } from '../hooks/useCoolingCentres';
import { useAppStore, type UserRole } from '../store/useAppStore';
import { apiClient } from '../lib/api';
import { getRiskBand } from '../theme/tokens';
import { TYPOGRAPHY } from '../theme/typography';

type ViewMode = '3d_city' | '2d_gis';
type SortField = 'rank' | 'name' | 'wbgt' | 'risk';

export const AuthorityDashboard: React.FC = () => {
  const {
    selectedCity,
    selectedLocationId,
    setSelectedLocationId,
    userRole,
    setUserRole,
  } = useAppStore();

  const { data: wards } = useWards(selectedCity);
  const { data: wardsRisk } = useAllWardsRisk(selectedCity);
  const { data: coolingCentres } = useCoolingCentres(selectedCity);

  const [viewMode, setViewMode] = useState<ViewMode>('3d_city');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [sortField, setSortField] = useState<SortField>('risk');
  const [sortAsc, setSortAsc] = useState(false);

  // Chronological alert feed state
  const [alertFeed, setAlertFeed] = useState([
    {
      id: 1,
      time: '12:45:10',
      ward: 'Ward M/East',
      level: 'Red Alert',
      color: '#C31D3C',
      msg: 'WBGT exceeded 35.0°C threshold. Deployed 4 emergency water tankers.',
    },
    {
      id: 2,
      time: '12:15:32',
      ward: 'Ward L/Kurla',
      level: 'Orange Alert',
      color: '#FF704F',
      msg: 'Indoor heat accumulation (+4.1°C excess). Primary cooling tent active.',
    },
    {
      id: 3,
      time: '11:30:00',
      ward: 'Ward G/North (Dharavi)',
      level: 'Orange Alert',
      color: '#FF704F',
      msg: 'Outdoor manual shift suspended across municipal infrastructure works.',
    },
    {
      id: 4,
      time: '10:00:15',
      ward: 'Pan-City',
      level: 'Advisory',
      color: '#F59E0B',
      msg: 'Synoptic warning broadcast pushed to 420,000 enrolled citizens.',
    },
  ]);

  // Role Gate: Citizens get a clean 403 Access page, not a broken screen
  if (userRole === 'citizen') {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="max-w-md w-full p-8 rounded-[14px] bg-[#1F3445] border border-white/10 text-center space-y-5 corner-ticks">
          <div className="w-14 h-14 rounded-full bg-[#FF704F]/15 border border-[#FF704F]/30 flex items-center justify-center mx-auto text-[#FF704F]">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className={`${TYPOGRAPHY.h2} text-white`}>403 Access Restricted</h2>
            <p className="text-xs text-[#8B9AA8] font-mono uppercase tracking-[0.10em]">
              Authority & Disaster Management Console Only
            </p>
          </div>
          <p className="text-xs text-[#D7E0E7] leading-relaxed">
            This module contains municipal emergency broadcast triggers, ward intervention queues, and priority resource dispatch. Please authenticate as a municipal administrator or switch your workspace role.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setUserRole('authority')}
              className="px-5 py-2.5 rounded-[8px] bg-[#9B6FD8] hover:bg-[#7F56BD] text-white text-xs font-mono font-semibold transition-all cursor-pointer"
            >
              Switch Role to Municipal Authority
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle Broadcast Dispatch
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

    // Add to local alert feed
    const now = new Date();
    setAlertFeed((prev) => [
      {
        id: Date.now(),
        time: now.toTimeString().slice(0, 8),
        ward: `Ward ID ${selectedLocationId}`,
        level: 'Emergency Dispatch',
        color: '#FF704F',
        msg: broadcastMessage,
      },
      ...prev,
    ]);
  };

  // Convert real backend wardsRisk into WardColumnData for 3D City
  const wardColumnData = wardsRisk?.map((w) => ({
    id: w.location_id,
    name: w.ward_name,
    risk: w.risk_score / 100,
    wbgt: w.wbgt_c,
    temp: w.temperature_c,
  }));

  // Sorting
  const sortedWards = [...(wardsRisk || [])].sort((a, b) => {
    let diff = 0;
    if (sortField === 'name') diff = a.ward_name.localeCompare(b.ward_name);
    else if (sortField === 'wbgt') diff = a.wbgt_c - b.wbgt_c;
    else diff = a.risk_score - b.risk_score;
    return sortAsc ? diff : -diff;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* 1. Header & Stage Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`${TYPOGRAPHY.h1} text-white`}>
              Municipal Disaster Management & Authority Console
            </h1>
            <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold uppercase bg-[#FF704F]/15 text-[#FF704F] border border-[#FF704F]/30">
              Live Operations
            </span>
          </div>
          <p className={TYPOGRAPHY.bodyL}>
            Surveillance telemetry, automated ward prioritization matrices, and emergency cooling asset dispatch for {selectedCity}.
          </p>
        </div>

        {/* View Switcher: 3D City vs 2D GIS */}
        <div className="flex items-center gap-1 bg-[#1F3445] p-1 rounded-[8px] border border-white/8 shrink-0">
          <button
            onClick={() => setViewMode('3d_city')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-mono transition-all ${
              viewMode === '3d_city'
                ? 'bg-[#101820] text-white border border-[#9B6FD8] [box-shadow:inset_0_1px_0_rgba(155,111,216,0.3)]'
                : 'text-[#8B9AA8] hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Ward City</span>
          </button>
          <button
            onClick={() => setViewMode('2d_gis')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-mono transition-all ${
              viewMode === '2d_gis'
                ? 'bg-[#101820] text-white border border-[#9B6FD8] [box-shadow:inset_0_1px_0_rgba(155,111,216,0.3)]'
                : 'text-[#8B9AA8] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2D GIS Map</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Header: 4 Large Numerals (Wards at Risk, Pop Exposed, Workers Exposed, 72h Delta) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-[14px] bg-[#1F3445] border border-white/8 space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-[0.10em] text-[#8B9AA8] block">
            Wards Under Alert
          </span>
          <KpiNumeral
            value={18}
            suffix="/ 24"
            size="l"
            color="#FF704F"
            sublabel="Very High / Extreme Stress"
          />
        </div>

        <div className="p-5 rounded-[14px] bg-[#1F3445] border border-white/8 space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-[0.10em] text-[#8B9AA8] block">
            Population Exposed
          </span>
          <KpiNumeral
            value={4.2}
            suffix="M"
            decimals={1}
            size="l"
            color="#D7E0E7"
            sublabel="Inhabitants in Red/Orange Zones"
          />
        </div>

        <div className="p-5 rounded-[14px] bg-[#1F3445] border border-white/8 space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-[0.10em] text-[#8B9AA8] block">
            Outdoor Workers at Risk
          </span>
          <KpiNumeral
            value={840}
            suffix="k"
            size="l"
            color="#F59E0B"
            sublabel="Vendors, Construction, Logistics"
          />
        </div>

        <div className="p-5 rounded-[14px] bg-[#1F3445] border border-white/8 space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-[0.10em] text-[#8B9AA8] block">
            72h Trajectory Delta
          </span>
          <KpiNumeral
            value={14}
            prefix="+"
            suffix="%"
            size="l"
            color="#FF704F"
            sublabel="Synoptic Expansion Projected"
          />
        </div>
      </div>

      {/* 3. Main Stage: 3D Ward City / 2D GIS Map (Full-width stage with corner ticks) */}
      <section className="space-y-4">
        <SectionHeader
          label="VOLUMETRIC MUNICIPAL MAP"
          title={
            viewMode === '3d_city'
              ? 'Volumetric Ward Heat City (Interactive Volumetric Landscape)'
              : 'Ward Boundary GIS Choropleth & Cooling Network'
          }
          lead={
            viewMode === '3d_city'
              ? 'Click any column to spring-isolate and frame that ward. Height reflects composite risk magnitude; colour denotes normative ISO heat band.'
              : 'Vector boundaries overlaid with designated emergency cooling points.'
          }
        />
        <div className="rounded-[14px] border border-white/8 overflow-hidden corner-ticks">
          {viewMode === '3d_city' ? (
            <WardHeatCity
              wards={wardColumnData}
              gridSize={14}
              onWardSelect={(id) => typeof id === 'number' && setSelectedLocationId(id)}
              height={540}
            />
          ) : wards ? (
            <LeafletBaseMap
              wards={wards}
              wardsRisk={wardsRisk}
              coolingCentres={coolingCentres}
              selectedLocationId={selectedLocationId}
              onSelectLocation={setSelectedLocationId}
              height="540px"
            />
          ) : (
            <div className="h-[540px] flex items-center justify-center text-xs font-mono text-[#8B9AA8]">
              Loading geospatial layers...
            </div>
          )}
        </div>
      </section>

      {/* 4. Asymmetric 7/5 Split: Sortable Ward Table vs Alert Broadcast & Chronological Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sortable Ward Table (7 cols) */}
        <div className="lg:col-span-7">
          <Card
            tier="l1"
            title="Ward Thermal Vulnerability Ledger"
            subtitle="Sortable ward ledger with inline risk magnitude bars"
          >
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full border-collapse font-mono text-xs text-left">
                <thead className="sticky top-0 bg-[#1F3445] z-10 border-b border-white/8 text-[11px] uppercase tracking-[0.10em] text-[#8B9AA8]">
                  <tr>
                    <th
                      className="py-2.5 px-3 cursor-pointer hover:text-white"
                      onClick={() => toggleSort('risk')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Rank / Ward</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="py-2.5 px-3 cursor-pointer hover:text-white text-center"
                      onClick={() => toggleSort('wbgt')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>WBGT</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-2.5 px-3 text-right">Risk Score</th>
                    <th className="py-2.5 px-3 text-right">Band</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedWards.map((w, idx) => {
                    const isSelected = w.location_id === selectedLocationId;
                    const band = getRiskBand(w.risk_score);

                    return (
                      <tr
                        key={w.location_id}
                        onClick={() => setSelectedLocationId(w.location_id)}
                        className={`table-row-hover cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#263E50]' : 'hover:bg-white/5'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#5F7183] w-5">#{idx + 1}</span>
                            <div>
                              <div className="font-sans font-semibold text-white">
                                {w.ward_name}
                              </div>
                              <div className="text-[10px] text-[#8B9AA8]">
                                Code: {w.ward_code} • Dry-Bulb: {w.temperature_c.toFixed(1)}°C
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="font-bold text-white tabular-nums">
                            {w.wbgt_c.toFixed(1)}°C
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="space-y-1">
                            <span className="font-bold tabular-nums" style={{ color: band.color }}>
                              {w.risk_score.toFixed(0)}/100
                            </span>
                            <div className="w-20 ml-auto h-1 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${w.risk_score}%`,
                                  backgroundColor: band.color,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <RiskBadge score={w.risk_score} size="sm" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right 5 cols: Broadcast Dispatch & Chronological Alert Feed */}
        <div className="lg:col-span-5 space-y-6">
          {/* Emergency Alert Broadcast */}
          <Card
            tier="l2"
            title="Ward Alert Broadcast Dispatch"
            subtitle="Trigger immediate mass SMS/WhatsApp alerts to field personnel"
          >
            <form onSubmit={handleBroadcast} className="space-y-3 font-mono">
              <div>
                <label className="block text-xs uppercase text-[#8B9AA8] mb-1">
                  Directive Copy
                </label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. WBGT exceeds 33.5°C in Shivaji Nagar. Suspend outdoor construction shifts 12:00-16:00. Open transit cooling relief posts."
                  rows={3}
                  className="w-full bg-[#101820] border border-white/10 rounded-[8px] p-3 text-xs text-white placeholder:text-[#5F7183] focus:border-[#9B6FD8] outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#8B9AA8]">
                  Target Ward: ID {selectedLocationId}
                </span>
                <button
                  type="submit"
                  disabled={!broadcastMessage.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#FF704F] hover:bg-[#e05f40] disabled:opacity-40 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Dispatch Directive
                </button>
              </div>

              {broadcastSent && (
                <div className="p-3 rounded-[8px] bg-[#2FA37C]/15 border border-[#2FA37C]/30 text-[#2FA37C] text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Disaster alert queued and dispatched via WhatsApp/SMS mesh.</span>
                </div>
              )}
            </form>
          </Card>

          {/* Chronological Alert Feed with Mono Timestamps */}
          <Card
            tier="l1"
            title="Chronological Alert Activity Feed"
            subtitle="Live audit trail of municipal directives and threshold crossings"
          >
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {alertFeed.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-[8px] bg-[#101820]/70 border border-white/6 space-y-1 font-mono text-xs"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#5F7183] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.time}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold"
                      style={{
                        backgroundColor: `${item.color}20`,
                        color: item.color,
                      }}
                    >
                      {item.level}
                    </span>
                  </div>
                  <div className="font-bold text-[#D7E0E7]">{item.ward}</div>
                  <p className="text-[#8B9AA8] text-[11px] leading-relaxed">{item.msg}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* 5. Recommended Interventions Queue with Acknowledge/Dispatch Action */}
      <section className="space-y-4">
        <SectionHeader
          label="MUNICIPAL ACTION DIRECTIVES"
          title="Automated Priority Intervention Queue"
          lead="Pre-calculated intervention triggers ranking cooling center activations, water tanker routing, and workforce advisories by cost-effectiveness."
        />
        <InterventionQueue />
      </section>
    </div>
  );
};
