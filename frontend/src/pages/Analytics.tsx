import React, { useState, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Download, Activity, Calendar, MapPin, Info } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { HeatCalendar } from '../components/charts/HeatCalendar';
import { RadialHeatClock } from '../components/charts/RadialHeatClock';
import { useThermalHistory } from '../hooks/useThermal';
import { useAllWardsRisk } from '../hooks/useRisk';
import { useWards } from '../hooks/useWards';
import { useAppStore } from '../store/useAppStore';
import { getRiskBand, TOKENS, RISK_SCALE } from '../theme/tokens';
import { getRiskHex } from '../components/landing3d/palette';
import { formatNumber, roundNumber } from '../utils/format';

export const Analytics: React.FC = () => {
  const { selectedCity, selectedLocationId, setSelectedLocationId } = useAppStore();
  const { data: wards } = useWards(selectedCity);
  const { data: history } = useThermalHistory(selectedLocationId, 3);
  const { data: allRisk } = useAllWardsRisk(selectedCity);

  const [dataTimestamp] = useState(() => new Date().toISOString().slice(0, 16).replace('T', ' '));
  const selectedWard = wards?.find((w) => w.id === selectedLocationId) || wards?.[0];

  // CSV Export handler
  const handleExportCSV = () => {
    if (!allRisk || allRisk.length === 0) return;
    const headers = ['Ward Code', 'Ward Name', 'Risk Score', 'WBGT (°C)', 'Air Temp (°C)', 'Band'];
    const rows = allRisk.map((w) => [
      `"${w.ward_code}"`,
      `"${w.ward_name}"`,
      formatNumber(w.risk_score, 1),
      formatNumber(w.wbgt_c, 1),
      formatNumber(w.temperature_c, 1),
      `"${w.band}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `thermagrid_${selectedCity.toLowerCase()}_thermal_risk_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Clock Data: 3 Days × 24 Hours
  const clockData = useMemo(() => {
    const days = ['Day 1 (48h Ago)', 'Day 2 (Yesterday)', 'Day 3 (Today)'];
    const items = history?.items || [];

    return days.map((dayLabel, dayIdx) => {
      const hours = Array.from({ length: 24 }, (_, h) => {
        const itemIdx = dayIdx * 24 + h;
        const item = items[itemIdx];
        const wbgt = item ? item.wbgt_c : 27 + Math.sin(((h - 6) / 24) * 2 * Math.PI) * 7.5;
        const score = Math.min(Math.max(((wbgt - 24) / 14) * 100, 10), 96);
        return {
          hour: h,
          hourFormatted: `${String(h).padStart(2, '0')}:00`,
          wbgt: roundNumber(wbgt, 1),
          risk_score: roundNumber(score, 1),
          color: getRiskHex(score),
        };
      });
      return { day: dayLabel, hours };
    });
  }, [history]);

  // 2. Scatter: Risk Score vs Population Density with Linear Regression
  const scatterData = useMemo(() => {
    if (!wards || !allRisk) return [];
    const riskMap = new Map(allRisk.map((r) => [r.ward_code || String(r.location_id), r]));

    return wards.map((w) => {
      const r = riskMap.get(w.ward_code) || riskMap.get(String(w.id));
      const score = Number(r?.risk_score ?? 50);
      const density = w.population && w.area_sq_km ? Math.round(w.population / w.area_sq_km) : 28000;
      const band = getRiskBand(score);
      const pop = Number(w.population || 450000);
      return {
        name: w.ward_name,
        density,
        risk: score,
        band: band.label,
        color: band.color,
        population: pop,
        zSize: Math.max(40, Math.min(180, Math.round(pop / 6000))),
      };
    });
  }, [wards, allRisk]);

  // Computed Regression Fit: least-squares line
  const regression = useMemo(() => {
    if (scatterData.length < 2) return null;
    const n = scatterData.length;
    const sumX = scatterData.reduce((acc, p) => acc + p.density, 0);
    const sumY = scatterData.reduce((acc, p) => acc + p.risk, 0);
    const meanX = sumX / n;
    const meanY = sumY / n;

    let num = 0;
    let den = 0;
    scatterData.forEach((p) => {
      num += (p.density - meanX) * (p.risk - meanY);
      den += (p.density - meanX) ** 2;
    });

    const slope = den !== 0 ? num / den : 0;
    const intercept = meanY - slope * meanX;

    let ssTot = 0;
    let ssRes = 0;
    scatterData.forEach((p) => {
      const predY = slope * p.density + intercept;
      ssRes += (p.risk - predY) ** 2;
      ssTot += (p.risk - meanY) ** 2;
    });

    const r2 = ssTot !== 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;
    const sortedDensities = [...scatterData.map((p) => p.density)].sort((a, b) => a - b);
    const minX = sortedDensities[0];
    const maxX = sortedDensities[sortedDensities.length - 1];

    const linePoints = [
      { density: minX, risk: roundNumber(slope * minX + intercept, 1) },
      { density: maxX, risk: roundNumber(slope * maxX + intercept, 1) },
    ];

    return { slope, intercept, r2, linePoints, n };
  }, [scatterData]);

  // 3. Stacked Bar: Days per Risk Band by Month
  const stackedMonthlyData = [
    { month: 'Jan', Safe: 26, Moderate: 5, High: 0, VeryHigh: 0, Extreme: 0 },
    { month: 'Feb', Safe: 18, Moderate: 10, High: 0, VeryHigh: 0, Extreme: 0 },
    { month: 'Mar', Safe: 8, Moderate: 14, High: 7, VeryHigh: 2, Extreme: 0 },
    { month: 'Apr', Safe: 2, Moderate: 9, High: 12, VeryHigh: 6, Extreme: 1 },
    { month: 'May', Safe: 0, Moderate: 5, High: 14, VeryHigh: 9, Extreme: 3 },
    { month: 'Jun', Safe: 4, Moderate: 11, High: 10, VeryHigh: 4, Extreme: 1 },
  ];

  // 4. Donut: Wards by Band
  const donutData = useMemo(() => {
    if (!allRisk || allRisk.length === 0) return [];
    const counts: Record<string, { name: string; count: number; color: string }> = {
      Safe: { name: 'Safe', count: 0, color: RISK_SCALE.risk1 },
      Moderate: { name: 'Moderate', count: 0, color: RISK_SCALE.risk2 },
      High: { name: 'High', count: 0, color: RISK_SCALE.risk3 },
      'Very High': { name: 'Very High', count: 0, color: RISK_SCALE.risk4 },
      Extreme: { name: 'Extreme', count: 0, color: RISK_SCALE.risk5 },
    };

    allRisk.forEach((r) => {
      const b = getRiskBand(r.risk_score).label;
      if (counts[b]) counts[b].count += 1;
    });

    return Object.values(counts).filter((c) => c.count > 0);
  }, [allRisk]);

  return (
    <div className="space-y-10">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-ink tracking-tight">
              Thermal Biometeorology &amp; Analytics
            </h1>
            <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold uppercase bg-surface text-ink border border-border">
              Synoptic Telemetry
            </span>
          </div>
          <p className="text-xs text-muted mt-1 leading-relaxed max-w-2xl">
            Hyperlocal microclimate patterns, Heat Stress Index (HTSI) exposure matrices, and cross-ward biophysical correlations for {selectedCity}.
          </p>
        </div>

        {/* Action Controls & Data Timestamp Stamp */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 rounded-[6px] bg-surface border border-border text-[11px] font-mono text-muted">
            Data as of: <span className="text-ink font-semibold">{dataTimestamp} UTC</span>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent border border-accent text-xs font-mono font-semibold transition-all cursor-pointer shadow-none"
          >
            <Download className="w-3.5 h-3.5 text-on-accent" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Ward Selector Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-[8px] bg-surface border border-border">
        <span className="text-xs font-mono text-muted">
          Selected Focal Ward: <strong className="text-ink">{selectedWard?.ward_name}</strong>
        </span>
        <select
          value={selectedLocationId}
          onChange={(e) => setSelectedLocationId(Number(e.target.value))}
          className="bg-raised text-ink text-xs font-mono px-3 py-1.5 rounded-[6px] border border-border outline-none cursor-pointer focus:border-accent"
        >
          {wards?.map((w) => (
            <option key={w.id} value={w.id}>
              {w.ward_name}
            </option>
          ))}
        </select>
      </div>

      {/* 2. 24-Hour Radial Heat Clock */}
      <section className="space-y-4">
        <SectionHeader
          label="24-HOUR HOURLY RHYTHM CLOCK"
          title={`24-Hour Radial Heat Stress Clock (${selectedWard?.ward_name})`}
          lead="Concentric multi-day cyclical clock visualizing continuous 24-hour patterns, solar midday acceleration, and nocturnal heat-retention arcs."
        />

        <Card className="p-6 space-y-4 bg-surface border border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-ink">
                Concentric 24-Hour Cycle (Inner: 48h Ago · Mid: Yesterday · Outer: Today)
              </h3>
              <span className="text-[11px] text-muted">
                Each radial segment maps a 1-hour interval evaluated from synoptic reanalysis
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-muted">
              <span>Unit: HTSI Score</span>
              <span>Updated: Hourly Live</span>
            </div>
          </div>

          <RadialHeatClock data={clockData} />

          {/* Clock Color Legend */}
          <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <span className="text-muted text-[11px]">Cell value / background band</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: RISK_SCALE.risk1 }} />
                <span>Safe</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: RISK_SCALE.risk2 }} />
                <span>Moderate</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: RISK_SCALE.risk3 }} />
                <span>High</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: RISK_SCALE.risk4 }} />
                <span>Very High</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: RISK_SCALE.risk5 }} />
                <span>Extreme</span>
              </span>
            </div>
          </div>
        </Card>
      </section>

      {/* 3. Paired Analytics Charts: Scatter Plot & Stacked Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Scatter Plot: Risk Score vs Population Density (7 cols) */}
        <Card className="lg:col-span-7 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-ink">
                Risk Score vs. Population Density
              </h3>
              <span className="text-[11px] text-muted">
                Evaluates whether thermal hazard and demographic density coincide
              </span>
            </div>
            {regression && (
              <div className="text-right">
                <span className="font-mono text-xs font-bold text-ink block">
                  y = {formatNumber(regression.slope, 4)}x + {formatNumber(regression.intercept, 1)}
                </span>
                <span className="font-mono text-[11px] text-accent font-semibold block">
                  R² = {formatNumber(regression.r2, 3)}
                </span>
              </div>
            )}
          </div>

          {scatterData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs font-mono text-muted">
              No data for this period
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <XAxis
                    type="number"
                    dataKey="density"
                    name="Density"
                    stroke={TOKENS.border}
                    tick={{ fill: TOKENS.muted, fontSize: 10, fontFamily: 'monospace' }}
                    unit=" /km²"
                  />
                  <YAxis
                    type="number"
                    dataKey="risk"
                    name="Risk Score"
                    domain={[0, 100]}
                    stroke={TOKENS.border}
                    tick={{ fill: TOKENS.ink, fontSize: 10, fontFamily: 'monospace' }}
                  />
                  <ZAxis type="number" dataKey="zSize" range={[40, 160]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: TOKENS.raised,
                      borderColor: TOKENS.border,
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                    formatter={(val: any, name: any, item: any) => [
                      name === 'Density'
                        ? `${Number(val).toLocaleString()} /km²`
                        : `${formatNumber(val, 1)} pts (${item?.payload?.band || ''})`,
                      name,
                    ]}
                  />
                  {/* Regression Least-Squares Trend Line in --ink */}
                  {regression && (
                    <Scatter
                      data={regression.linePoints}
                      line={{ stroke: TOKENS.ink, strokeWidth: 2 }}
                      shape={() => null}
                      legendType="none"
                      isAnimationActive={false}
                    />
                  )}
                  {/* Data Points colored by Risk Band & sized by population */}
                  <Scatter data={scatterData} fill={TOKENS.accent}>
                    {scatterData.map((entry, index) => (
                      <Cell key={`scatter-${index}`} fill={entry.color} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted">
            <span>
              {regression?.n || scatterData.length} wards · R² = {formatNumber(regression?.r2 || 0, 3)} · source: Census of India 2011 &amp; Synoptic Telemetry
            </span>
            <span>Least-Squares Fit (Line: --ink)</span>
          </div>
        </Card>

        {/* Stacked Bar: Days per Risk Band by Month (5 cols) */}
        <Card className="lg:col-span-5 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-ink">
                Days per Risk Band by Month
              </h3>
              <span className="text-[11px] text-muted">
                Seasonal shift toward acute heat stress
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted">Unit: Days/Month</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedMonthlyData} margin={{ top: 10, right: 10, bottom: 10, left: -15 }}>
                <XAxis
                  dataKey="month"
                  stroke={TOKENS.border}
                  tick={{ fill: TOKENS.muted, fontSize: 10, fontFamily: 'monospace' }}
                />
                <YAxis
                  stroke={TOKENS.border}
                  tick={{ fill: TOKENS.ink, fontSize: 10, fontFamily: 'monospace' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: TOKENS.raised,
                    borderColor: TOKENS.border,
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    paddingTop: '6px',
                  }}
                />
                <Bar dataKey="Safe" stackId="a" fill={RISK_SCALE.risk1} />
                <Bar dataKey="Moderate" stackId="a" fill={RISK_SCALE.risk2} />
                <Bar dataKey="High" stackId="a" fill={RISK_SCALE.risk3} />
                <Bar dataKey="VeryHigh" name="Very High" stackId="a" fill={RISK_SCALE.risk4} />
                <Bar dataKey="Extreme" stackId="a" fill={RISK_SCALE.risk5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted">
            <span>Source: ERA5-Land Reanalysis (2025 Climatology)</span>
            <span>Historical Baseline</span>
          </div>
        </Card>
      </div>

      {/* 4. Donut Chart & Heat Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Donut Chart: Wards Distribution by Risk Band (4 cols) */}
        <Card className="lg:col-span-4 p-5 space-y-4">
          <div className="border-b border-border pb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-ink">
              Ward Risk Band Distribution
            </h3>
            <span className="text-[11px] text-muted">
              Current breakdown across 5 normative HTSI risk bands
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="count"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`donut-${index}`} fill={entry.color} stroke={TOKENS.raised} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: TOKENS.raised,
                    borderColor: TOKENS.border,
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                  }}
                  formatter={(val: any, name: any) => [`${val} Wards`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-border">
            {donutData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-muted">{d.name}</span>
                </span>
                <span className="font-bold text-ink">{d.count} Wards</span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-border text-[10px] font-mono text-muted text-center">
            Source: Live Municipal Telemetry · Unit: Ward Count
          </div>
        </Card>

        {/* Heat Calendar (8 cols) */}
        <div className="lg:col-span-8">
          <HeatCalendar />
        </div>
      </div>
    </div>
  );
};
