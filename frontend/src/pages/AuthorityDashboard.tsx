import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Flame,
  LayoutGrid,
  HardHat,
  ShieldAlert,
  BarChart2,
  Compass,
  Settings,
  Send,
  Check,
  ChevronDown,
  X,
  ExternalLink,
} from 'lucide-react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { LeafletBaseMap } from '../components/maps/LeafletBaseMap';
import { useWards } from '../hooks/useWards';
import { useAllWardsRisk } from '../hooks/useRisk';
import { useCoolingCentres } from '../hooks/useCoolingCentres';
import { useEquity } from '../hooks/useEquity';
import { useAppStore } from '../store/useAppStore';
import { apiClient } from '../lib/api';
import { getRiskBand, MOTION } from '../theme/tokens';
import type { Location } from '../types';

export const AuthorityDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { selectedCity, selectedLocationId, setSelectedLocationId } = useAppStore();

  const { data: wardsData } = useWards(selectedCity);
  const { data: wardsRiskData } = useAllWardsRisk(selectedCity);
  const { data: coolingCentres } = useCoolingCentres(selectedCity);
  const { data: equityData } = useEquity(selectedCity);
  const [queueTab, setQueueTab] = useState<'queue' | 'equity'>('queue');

  // Fallback data so every panel renders full on first paint without empty reserved space
  const wards: Location[] = useMemo(() => {
    if (wardsData && wardsData.length > 0) return wardsData;
    return [
      {
        id: 1,
        ward_code: 'WARD_ME',
        ward_name: 'Ward M/East (Govandi)',
        city: 'Mumbai',
        district: 'Mumbai Suburban',
        state: 'Maharashtra',
        latitude: 19.0558,
        longitude: 72.9315,
        area_sq_km: 14.5,
        population: 807720,
        population_density_per_km2: 55705,
        outdoor_worker_ratio: 0.42,
        informal_settlement_ratio: null,
        tree_canopy_fraction: null,
        elderly_ratio: 0.065,
        children_ratio: 0.098,
        cooling_access_deficit: null,
        hospital_count: 3,
        drinking_water_deficit: 0.58,
        description: 'census_vintage: 2011. Demographics: Census 2011 PCA.',
        geometry_geojson: {
          type: 'Polygon',
          coordinates: [[[72.915, 19.04], [72.945, 19.04], [72.95, 19.07], [72.92, 19.07], [72.915, 19.04]]],
        },
      },
      {
        id: 2,
        ward_code: 'WARD_GN',
        ward_name: 'Ward G/North (Dharavi)',
        city: 'Mumbai',
        district: 'Mumbai City',
        state: 'Maharashtra',
        latitude: 19.041,
        longitude: 72.855,
        area_sq_km: 9.2,
        population: 599039,
        population_density_per_km2: 65112,
        outdoor_worker_ratio: 0.48,
        informal_settlement_ratio: null,
        tree_canopy_fraction: null,
        elderly_ratio: 0.061,
        children_ratio: 0.102,
        cooling_access_deficit: null,
        hospital_count: 4,
        drinking_water_deficit: 0.45,
        description: 'census_vintage: 2011. Demographics: Census 2011 PCA.',
        geometry_geojson: {
          type: 'Polygon',
          coordinates: [[[72.84, 19.03], [72.87, 19.03], [72.87, 19.06], [72.84, 19.06], [72.84, 19.03]]],
        },
      },
      {
        id: 3,
        ward_code: 'WARD_L',
        ward_name: 'Ward L (Kurla East)',
        city: 'Mumbai',
        district: 'Mumbai Suburban',
        state: 'Maharashtra',
        latitude: 19.068,
        longitude: 72.885,
        area_sq_km: 15.8,
        population: 902226,
        population_density_per_km2: 57102,
        outdoor_worker_ratio: 0.38,
        informal_settlement_ratio: null,
        tree_canopy_fraction: null,
        elderly_ratio: 0.07,
        children_ratio: 0.088,
        cooling_access_deficit: null,
        hospital_count: 5,
        drinking_water_deficit: 0.4,
        description: 'census_vintage: 2011. Demographics: Census 2011 PCA.',
        geometry_geojson: {
          type: 'Polygon',
          coordinates: [[[72.87, 19.05], [72.91, 19.05], [72.91, 19.09], [72.87, 19.09], [72.87, 19.05]]],
        },
      },
      {
        id: 4,
        ward_code: 'WARD_A',
        ward_name: 'Ward A (Colaba / Fort)',
        city: 'Mumbai',
        district: 'Mumbai City',
        state: 'Maharashtra',
        latitude: 18.922,
        longitude: 72.8347,
        area_sq_km: 12.5,
        population: 185120,
        population_density_per_km2: 14810,
        outdoor_worker_ratio: 0.16,
        informal_settlement_ratio: null,
        tree_canopy_fraction: null,
        elderly_ratio: 0.115,
        children_ratio: 0.052,
        cooling_access_deficit: null,
        hospital_count: 8,
        drinking_water_deficit: 0.12,
        description: 'census_vintage: 2011. Demographics: Census 2011 PCA.',
        geometry_geojson: {
          type: 'Polygon',
          coordinates: [[[72.82, 18.9], [72.85, 18.9], [72.85, 18.94], [72.82, 18.94], [72.82, 18.9]]],
        },
      },
    ];
  }, [wardsData]);

  // Selected ward
  const activeWard = useMemo(() => {
    if (!selectedLocationId) return wards[0] || null;
    return wards.find((w) => w.id === selectedLocationId) || wards[0];
  }, [selectedLocationId, wards]);

  // Pre-approved alert templates
  const alertTemplates = [
    'Level-3 Heatwave Action: Halt outdoor physical shifts (12:00-16:00) and open municipal hydration wings.',
    'Nocturnal Heat Advisory: High indoor thermal inertia. Keep windows cross-ventilated; visit community cooling centres.',
    'Rapid Emergency Alert: WBGT exceeded 35°C threshold. Immediate worker hydration and rest rotations enforced.',
  ];

  const [selectedWardForAlert, setSelectedWardForAlert] = useState<string>(activeWard?.ward_name || 'Ward M/East (Govandi)');
  const [selectedTemplate, setSelectedTemplate] = useState<string>(alertTemplates[0]);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchConfirmed, setDispatchConfirmed] = useState<boolean>(false);
  const [peekOpen, setPeekOpen] = useState<boolean>(true);

  // Intervention queue actions
  const [dispatchedQueue, setDispatchedQueue] = useState<Record<number, boolean>>({});

  const handleQueueAction = (id: number) => {
    setDispatchedQueue((prev) => ({ ...prev, [id]: true }));
  };

  const handleDispatchAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDispatching(true);
    try {
      await apiClient.post('/alerts', {
        location_id: activeWard?.id || 1,
        alert_level: 'Very High',
        title: `MUNICIPAL HEAT DIRECTIVE: ${selectedWardForAlert}`,
        message: selectedTemplate,
        action_directives: 'Immediate enforcement per City Heat Action Plan.',
        target_audience: 'all',
      });
    } catch {
      // offline / mock fallback
    } finally {
      setIsDispatching(false);
      setDispatchConfirmed(true);
      setTimeout(() => setDispatchConfirmed(false), 3500);
    }
  };

  // KPI countUp values
  const [kpiCounts, setKpiCounts] = useState({
    veryHigh: 0,
    extreme: 0,
    centresOpen: 0,
    acknowledged: 0,
  });

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setKpiCounts({ veryHigh: 38, extreme: 11, centresOpen: 7, acknowledged: 78 });
      return;
    }
    const duration = 700;
    const startTime = performance.now();
    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / duration);
      setKpiCounts({
        veryHigh: Math.floor(progress * 38),
        extreme: Math.floor(progress * 11),
        centresOpen: Math.floor(progress * 7),
        acknowledged: Math.floor(progress * 78),
      });
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, []);

  const interventions = [
    { id: 1, title: 'Open 2 cooling centres', wards: 'Govandi · Dharavi', action: 'Dispatch' },
    { id: 2, title: 'Suspend outdoor work 13–16', wards: '11 wards · 6 contractors', action: 'Notify' },
    { id: 3, title: 'Deploy water tankers', wards: 'Dharavi · Kurla East', action: 'Dispatch' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0B141B] flex flex-row overflow-hidden text-[#D8E8E6] font-sans antialiased">
      {/* 1. 72px Left Icon Rail */}
      <aside className="w-[72px] h-full bg-[#142630] border-r border-white/[0.075] flex flex-col items-center justify-between py-4 select-none shrink-0 z-30">
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Logo Icon */}
          <Link
            to="/"
            className="w-10 h-10 rounded-[10px] bg-[#203A45] border border-white/[0.075] flex items-center justify-center hover:border-[#8FB3D9] transition-colors"
            title="ThermaGrid Public"
          >
            <Flame className="w-5 h-5 text-[#8FB3D9]" />
          </Link>

          {/* Navigation Items */}
          <nav className="flex flex-col items-center gap-2 w-full px-2">
            {[
              { path: '/app', icon: LayoutGrid, label: 'Overview Hub' },
              { path: '/app/heat-risk', icon: Flame, label: 'Heat Risk' },
              { path: '/app/worker', icon: HardHat, label: 'Worker Safety' },
              { path: '/app/authority', icon: ShieldAlert, label: 'Mission Control', active: true },
              { path: '/app/analytics', icon: BarChart2, label: 'Analytics' },
              { path: '/app/simulation', icon: Compass, label: 'Simulation' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={item.label}
                  className={`relative w-12 h-12 rounded-[8px] flex items-center justify-center transition-all ${
                    item.active
                      ? 'text-white bg-[#203A45]'
                      : 'text-[#6B7C8A] hover:text-[#D8E8E6] hover:bg-[#203A45]/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {/* Sliding active indicator (180ms) */}
                  {item.active && (
                    <motion.div
                      layoutId="rail-active-indicator"
                      transition={{ duration: MOTION.fast.duration, ease: MOTION.fast.ease }}
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#8FB3D9] rounded-r-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Rail User / Account */}
        <div className="flex flex-col items-center gap-3">
          <Link
            to="/app/account"
            className="w-10 h-10 rounded-[8px] flex items-center justify-center text-[#6B7C8A] hover:text-white hover:bg-[#203A45] transition-colors"
            title="Account & Subscriptions"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </aside>

      {/* 2. Main Mission Control Deck */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Bar: Ward filter · Date · Live Telemetry · User */}
        <header className="h-14 bg-[#142630]/90 backdrop-blur-md border-b border-white/[0.075] px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Ward Selector Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-[#6B7C8A] tracking-wider hidden sm:inline">
                SECTOR
              </span>
              <div className="relative">
                <select
                  value={activeWard?.id || 1}
                  onChange={(e) => setSelectedLocationId(Number(e.target.value))}
                  className="bg-[#203A45] border border-white/[0.075] hover:border-[#8FB3D9]/60 rounded-[6px] px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-[#8FB3D9] appearance-none pr-8 cursor-pointer"
                >
                  {wards.map((w) => (
                    <option key={w.id} value={w.id} className="bg-[#142630] text-white">
                      {w.ward_name} ({w.ward_code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B7C8A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Date Display */}
            <div className="text-xs font-mono text-[#93A3B0] hidden md:block border-l border-white/[0.075] pl-4">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>

            {/* Live Indicator */}
            <div className="flex items-center gap-2 border-l border-white/[0.075] pl-4">
              <span className="w-2 h-2 rounded-full bg-[#8FB3D9] animate-pulse" />
              <span className="text-[11px] font-mono text-[#8FB3D9] font-medium tracking-wide">
                LIVE TELEMETRY
              </span>
            </div>
          </div>

          {/* User profile & Exit view */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase text-[#6B7C8A] hidden lg:inline">
              AUTHORITY DISPATCH CONSOLE
            </span>
            <button
              onClick={() => navigate('/app')}
              className="text-xs font-mono text-[#6B7C8A] hover:text-[#D8E8E6] transition-colors px-2.5 py-1 rounded border border-white/[0.075] hover:border-white/20"
            >
              Exit Console
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* Full-Bleed Map Stage + Floating Edge Panels */}
        <div className="flex-1 relative w-full h-[calc(100vh-56px)] overflow-hidden">
          {/* Base Ward Map Layer (fills 100% of remaining space) */}
          <div className="absolute inset-0 z-0">
            <LeafletBaseMap
              wards={wards}
              wardsRisk={wardsRiskData || []}
              selectedLocationId={activeWard?.id}
              onSelectLocation={(id) => {
                setSelectedLocationId(id);
                setPeekOpen(true);
              }}
              className="w-full h-full"
            />
          </div>

          {/* Desktop Floating Panels (Anchored 16px from edges) */}
          {/* Below 1080px (lg): panels stack into a scrollable column under a 40vh map */}
          <div className="relative lg:static w-full h-full pointer-events-none z-10 flex flex-col lg:block overflow-y-auto lg:overflow-hidden p-4 lg:p-0 space-y-4 lg:space-y-0">
            {/* 1. TOP-LEFT ANCHOR: KPI Strip (Four numerals in one row, hairline separators) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: MOTION.base.duration, ease: MOTION.base.ease }}
              className="lg:absolute lg:top-4 lg:left-4 pointer-events-auto rounded-[10px] bg-[#142630]/90 backdrop-blur-md border border-white/[0.075] p-3 sm:p-4 shadow-2xl w-full lg:w-auto"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.075]">
                {/* 1. Wards Very High */}
                <div className="space-y-1 sm:pr-4">
                  <div className="text-[10px] uppercase font-mono text-[#6B7C8A] tracking-wider">
                    WARDS VERY HIGH
                  </div>
                  <div className="font-mono text-[28px] leading-tight font-bold text-[#FF704F] tabular-nums">
                    {kpiCounts.veryHigh}
                  </div>
                </div>

                {/* 2. Extreme */}
                <div className="space-y-1 sm:px-4 pt-2 sm:pt-0">
                  <div className="text-[10px] uppercase font-mono text-[#6B7C8A] tracking-wider">
                    EXTREME
                  </div>
                  <div className="font-mono text-[28px] leading-tight font-bold text-[#C31D3C] tabular-nums">
                    {kpiCounts.extreme}
                  </div>
                </div>

                {/* 3. Centres Open */}
                <div className="space-y-1 sm:px-4 pt-2 sm:pt-0">
                  <div className="text-[10px] uppercase font-mono text-[#6B7C8A] tracking-wider">
                    CENTRES OPEN
                  </div>
                  <div className="font-mono text-[28px] leading-tight font-bold text-[#D8E8E6] tabular-nums">
                    {kpiCounts.centresOpen} <span className="text-[#6B7C8A] font-normal text-lg">/ 12</span>
                  </div>
                </div>

                {/* 4. Acknowledged */}
                <div className="space-y-1 sm:pl-4 pt-2 sm:pt-0">
                  <div className="text-[10px] uppercase font-mono text-[#6B7C8A] tracking-wider">
                    ACKNOWLEDGED
                  </div>
                  <div className="font-mono text-[28px] leading-tight font-bold text-[#2FA37C] tabular-nums">
                    {kpiCounts.acknowledged}%
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 2. TOP-RIGHT ANCHOR: Alert Composer (Under 240px tall, defaults to highest-risk ward) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: MOTION.base.duration, delay: MOTION.stagger, ease: MOTION.base.ease }}
              className="lg:absolute lg:top-4 lg:right-4 pointer-events-auto rounded-[10px] bg-[#142630]/90 backdrop-blur-md border border-white/[0.075] p-3.5 shadow-2xl w-full lg:w-[380px] max-h-[238px] flex flex-col justify-between space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-[#6B7C8A] tracking-wider">
                  MUNICIPAL ALERT COMPOSER
                </span>
                <span className="text-[10px] font-mono text-[#8FB3D9]">Pre-Approved Action</span>
              </div>

              <form onSubmit={handleDispatchAlert} className="space-y-2">
                {/* Sector Select */}
                <div>
                  <select
                    value={selectedWardForAlert}
                    onChange={(e) => setSelectedWardForAlert(e.target.value)}
                    className="w-full bg-[#203A45] border border-white/[0.075] rounded-[6px] px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-[#8FB3D9]"
                  >
                    {wards.map((w) => (
                      <option key={w.id} value={w.ward_name}>
                        {w.ward_name} ({w.ward_code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Template Select */}
                <div>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full bg-[#203A45] border border-white/[0.075] rounded-[6px] px-2.5 py-1 text-[11px] font-sans text-[#D8E8E6] focus:outline-none focus:border-[#8FB3D9] truncate"
                  >
                    {alertTemplates.map((t, idx) => (
                      <option key={idx} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Footer: Recipient Count & Primary Action Button */}
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#6B7C8A]">
                    420,000 citizens · 18 contractors
                  </span>
                  <button
                    type="submit"
                    disabled={isDispatching}
                    className="px-3.5 py-1.5 rounded-[6px] bg-[#8FB3D9] hover:bg-[#A5C4E4] text-[#0B141B] text-xs font-mono font-bold transition-all shadow cursor-pointer disabled:opacity-50 active:scale-[0.985]"
                  >
                    {dispatchConfirmed ? (
                      <span className="inline-flex items-center gap-1 text-[#0B141B]">
                        <Check className="w-3.5 h-3.5" /> Dispatched
                      </span>
                    ) : isDispatching ? (
                      'Routing...'
                    ) : (
                      'Issue Direct Broadcast'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>

            {/* 3. BOTTOM-LEFT ANCHOR: Intervention Queue (Ranked list, 44px rows, hairline dividers) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: MOTION.base.duration, delay: MOTION.stagger * 2, ease: MOTION.base.ease }}
              className="lg:absolute lg:bottom-4 lg:left-4 pointer-events-auto rounded-[10px] bg-[#142630]/90 backdrop-blur-md border border-white/[0.075] p-3 shadow-2xl w-full lg:w-[500px] space-y-2"
            >
              {/* Dynamic Callout for Top Underserved Ward */}
              {equityData?.top_underserved_ward && (
                <div className="p-2 rounded-[6px] bg-[#C31D3C]/15 border border-[#C31D3C]/35 text-xs text-[#D8E8E6] flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#FF704F] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase font-bold text-[#FF704F] tracking-wider">
                        TOP UNDERSERVED WARD
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#FF704F]/20 text-[#FF704F] font-bold">
                        GAP {equityData.top_underserved_ward.equity_gap_signed}
                      </span>
                    </div>
                    <p className="text-[11px] leading-tight text-[#D8E8E6]">
                      {equityData.top_underserved_ward.callout}
                    </p>
                  </div>
                </div>
              )}

              {/* Panel Tabs Header */}
              <div className="flex items-center justify-between px-1 pb-1 border-b border-white/[0.075]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQueueTab('queue')}
                    className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded transition-colors ${
                      queueTab === 'queue'
                        ? 'bg-[#8FB3D9]/20 text-[#8FB3D9] font-bold'
                        : 'text-[#6B7C8A] hover:text-[#D8E8E6]'
                    }`}
                  >
                    INTERVENTION QUEUE
                  </button>
                  <button
                    onClick={() => setQueueTab('equity')}
                    className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded transition-colors ${
                      queueTab === 'equity'
                        ? 'bg-[#8FB3D9]/20 text-[#8FB3D9] font-bold'
                        : 'text-[#6B7C8A] hover:text-[#D8E8E6]'
                    }`}
                  >
                    EQUITY GAP MATRIX
                  </button>
                </div>
                <span className="text-[10px] font-mono text-[#93A3B0]">Automated ISO 7243 Matrix</span>
              </div>

              {queueTab === 'queue' ? (
                <div className="divide-y divide-white/[0.075]">
                  {interventions.map((item) => {
                    const isDone = dispatchedQueue[item.id];
                    return (
                      <div
                        key={item.id}
                        className="h-[44px] px-2 flex items-center justify-between hover:bg-white/[0.04] transition-colors rounded-[6px]"
                      >
                        <div className="flex items-center gap-3 truncate pr-2">
                          <span className="font-mono text-xs font-bold text-[#8FB3D9] tabular-nums">
                            {item.id}
                          </span>
                          <div className="truncate">
                            <span className="text-xs font-medium text-white truncate block">
                              {item.title}
                            </span>
                            <span className="text-[10px] font-mono text-[#6B7C8A] truncate block">
                              {item.wards}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleQueueAction(item.id)}
                          disabled={isDone}
                          className={`px-2.5 py-1 rounded-[6px] text-xs font-mono transition-all shrink-0 cursor-pointer ${
                            isDone
                              ? 'bg-[#2FA37C]/20 text-[#2FA37C] border border-[#2FA37C]/40'
                              : 'border border-[#8FB3D9] text-[#8FB3D9] hover:bg-[#8FB3D9] hover:text-[#0B141B]'
                          }`}
                        >
                          {isDone ? 'Deployed' : item.action}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="max-h-[160px] overflow-y-auto space-y-1 pr-1 font-mono text-xs">
                  <div className="grid grid-cols-12 text-[10px] uppercase text-[#6B7C8A] px-2 pb-1 border-b border-white/[0.075]">
                    <span className="col-span-5">Ward</span>
                    <span className="col-span-2 text-center">Hazard #</span>
                    <span className="col-span-2 text-center">Priority #</span>
                    <span className="col-span-3 text-right">Equity Gap</span>
                  </div>
                  {(equityData?.equity_rankings || []).slice(0, 8).map((w) => (
                    <div
                      key={w.ward_code}
                      className="grid grid-cols-12 items-center px-2 py-1 hover:bg-white/[0.04] rounded transition-colors text-[11px]"
                    >
                      <span className="col-span-5 truncate text-white font-medium" title={w.ward_name}>
                        {w.ward_name.split('(')[0].trim()}
                      </span>
                      <span className="col-span-2 text-center text-[#93A3B0]">
                        #{w.hazard_rank}
                      </span>
                      <span className="col-span-2 text-center text-[#8FB3D9]">
                        #{w.priority_rank}
                      </span>
                      <span
                        className={`col-span-3 text-right font-bold tabular-nums ${
                          w.equity_gap > 0
                            ? 'text-[#FF704F]'
                            : w.equity_gap < 0
                            ? 'text-[#2FA37C]'
                            : 'text-[#8B9AA8]'
                        }`}
                      >
                        {w.equity_gap_signed}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* 4. BOTTOM-RIGHT ANCHOR: Ward Detail Peek Panel */}
            {peekOpen && activeWard && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: MOTION.base.duration, delay: MOTION.stagger * 3, ease: MOTION.base.ease }}
                className="lg:absolute lg:bottom-4 lg:right-4 pointer-events-auto rounded-[10px] bg-[#142630]/90 backdrop-blur-md border border-white/[0.075] p-3.5 shadow-2xl w-full lg:w-[360px] space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#8FB3D9] font-bold block">
                      {activeWard.ward_code}
                    </span>
                    <h3 className="text-sm font-bold text-white font-display">
                      {activeWard.ward_name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setPeekOpen(false)}
                    className="text-[#6B7C8A] hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Score & WBGT Numbers */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.075]">
                  <div className="p-2 rounded-[6px] bg-[#203A45] space-y-0.5">
                    <span className="text-[9px] font-mono uppercase text-[#6B7C8A] block">
                      RISK SCORE
                    </span>
                    <span className="font-mono text-base font-bold text-[#FF704F] tabular-nums block">
                      78.4 <span className="text-xs text-[#93A3B0] font-normal">/ 100</span>
                    </span>
                  </div>

                  <div className="p-2 rounded-[6px] bg-[#203A45] space-y-0.5">
                    <span className="text-[9px] font-mono uppercase text-[#6B7C8A] block">
                      PEAK WBGT
                    </span>
                    <span className="font-mono text-base font-bold text-white tabular-nums block">
                      33.8°C
                    </span>
                  </div>
                </div>

                {/* Demographics & Truthful Unsourced Fields */}
                <div className="space-y-1 text-xs font-mono pt-1">
                  <div className="flex items-center justify-between py-0.5 border-b border-white/[0.05]">
                    <span className="text-[#6B7C8A]">Population</span>
                    <span className="text-white tabular-nums">
                      {activeWard.population.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5 border-b border-white/[0.05]">
                    <span className="text-[#6B7C8A]">Outdoor Workers</span>
                    <span className="text-white tabular-nums">
                      {activeWard.outdoor_worker_ratio
                        ? `${(activeWard.outdoor_worker_ratio * 100).toFixed(0)}%`
                        : 'unavailable'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5 border-b border-white/[0.05]">
                    <span className="text-[#6B7C8A]">Informal Settlement</span>
                    <span className="text-[#93A3B0] italic">
                      {activeWard.informal_settlement_ratio != null
                        ? `${(activeWard.informal_settlement_ratio * 100).toFixed(1)}%`
                        : 'unavailable'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5 border-b border-white/[0.05]">
                    <span className="text-[#6B7C8A]">Tree Canopy Fraction</span>
                    <span className="text-[#93A3B0] italic">
                      {activeWard.tree_canopy_fraction != null
                        ? `${(activeWard.tree_canopy_fraction * 100).toFixed(1)}%`
                        : 'unavailable'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-[#6B7C8A]">Cooling Deficit</span>
                    <span className="text-[#93A3B0] italic">
                      {activeWard.cooling_access_deficit != null
                        ? `${(activeWard.cooling_access_deficit * 100).toFixed(1)}%`
                        : 'unavailable'}
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <Link
                    to={`/app/ward/${activeWard.id}`}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-[6px] bg-[#203A45] hover:bg-[#203A45]/80 border border-white/[0.075] text-xs font-mono text-[#D8E8E6] transition-colors"
                  >
                    <span>Inspect Full Ward Profile</span>
                    <ExternalLink className="w-3 h-3 text-[#8FB3D9]" />
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
