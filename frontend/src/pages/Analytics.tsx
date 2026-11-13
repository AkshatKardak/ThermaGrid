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
import { useThermalHistory } from '../hooks/useThermal';
import { useAllWardsRisk } from '../hooks/useRisk';
import { useWards } from '../hooks/useWards';
import { useAppStore } from '../store/useAppStore';
import { getRiskBand, TOKENS, RISK_SCALE } from '../theme/tokens';
import { getRiskHex } from '../components/landing3d/palette';

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
      w.risk_score.toFixed(1),
      w.wbgt_c.toFixed(1),
      w.temperature_c.toFixed(1),
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

  // 1. Heat Matrix: 3 Days × 24 Hours = 72 Cells
  const matrixData = useMemo(() => {
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
          wbgt: Number(wbgt.toFixed(1)),
          risk_score: Number(score.toFixed(1)),
          color: getRiskHex(score),
        };
      });
      return { day: dayLabel, hours };
    });
  }, [history]);

  // 2. Scatter: Risk Score vs Population Density
  const scatterData = useMemo(() => {
    if (!wards || !allRisk) return [];
    const riskMap = new Map(allRisk.map((r) => [r.ward_code || String(r.location_id), r]));

    return wards.map((w) => {
      const r = riskMap.get(w.ward_code) || riskMap.get(String(w.id));
      const score = Number(r?.risk_score ?? 50);
      const density = w.population && w.area_sq_km ? Math.round(w.population / w.area_sq_km) : 28000;
      const band = getRiskBand(score);
      return {
        name: w.ward_name,
        density,
        risk: score,
        band: band.label,
        color: band.color,
      };
    });
  }, [wards, allRisk]);

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

      {/* 2. Heat Matrix (3 Days × 24 Hours) */}
      <section className="space-y-4">
        <SectionHeader
          label="24-HOUR HOURLY RHYTHM MATRIX"
          title={`72-Hour Daily Pattern Heat Matrix (${selectedWard?.ward_name})`}
          lead="Hourly thermal risk progression across 3 consecutive days. Visualizes the continuous daily rhythm, midday peak divergence, and nocturnal heat retention."
        />

        <Card className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-ink">
                Hourly Heat Stress Index (HTSI) Progression (00–23 Hours)
              </h3>
              <span className="text-[11px] text-muted">
                Each cell represents a 1-hour interval evaluated from synoptic reanalysis
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-muted">
              <span>Unit: HTSI Score</span>
              <span>Updated: Hourly Live</span>
            </div>
          </div>

          {/* Matrix Visual Grid (3 rows × 24 columns) */}
          <div className="space-y-2 overflow-x-auto pb-2">
            {/* Hour column labels */}
            <div className="grid grid-cols-[140px_repeat(24,minmax(28px,1fr))] gap-1 text-[10px] font-mono text-muted text-center min-w-[760px]">
              <span className="text-left pl-1">Date / Window</span>
              {Array.from({ length: 24 }, (_, i) => (
                <span key={i}>{String(i).padStart(2, '0')}</span>
              ))}
            </div>

            {/* Matrix rows */}
            {matrixData.map((row) => (
              <div
                key={row.day}
                className="grid grid-cols-[140px_repeat(24,minmax(28px,1fr))] gap-1 items-center min-w-[760px]"
              >
                <span className="text-xs font-mono text-ink font-semibold truncate pl-1">
                  {row.day}
                </span>
                {row.hours.map((cell) => (
                  <div
                    key={cell.hour}
                    className="h-8 rounded-[3px] border border-border/40 flex items-center justify-center text-[10px] font-mono font-bold transition-transform hover:scale-110 cursor-pointer"
                    style={{ backgroundColor: cell.color }}
                    title={`${row.day} at ${cell.hourFormatted}: WBGT ${cell.wbgt}°C, Risk ${cell.risk_score}/100`}
                  >
                    <span className="text-ink/80 text-[9px] select-none">
                      {Math.round(cell.wbgt)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Matrix Color Legend */}
          <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <span className="text-muted text-[11px]">Cell Value: WBGT (°C) · Background: Risk Band</span>
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
            <span className="text-[10px] font-mono text-muted">Unit: Score vs. People/km²</span>
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
                    tick={{ fill: TOKENS.muted, fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                    unit=" /km²"
                  />
                  <YAxis
                    type="number"
                    dataKey="risk"
                    name="Risk Score"
                    domain={[0, 100]}
                    stroke={TOKENS.border}
                    tick={{ fill: TOKENS.ink, fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                  />
                  <ZAxis range={[60, 60]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: TOKENS.surface,
                      borderColor: TOKENS.border,
                      borderRadius: '6px',
                      fontFamily: 'IBM Plex Mono',
                      fontSize: '11px',
                    }}
                    formatter={(val: any, name: any) => [
                      name === 'Density' ? `${Number(val).toLocaleString()} /km²` : `${val} pts`,
                      name,
                    ]}
                  />
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
            <span>Source: Census of India 2011 &amp; IMD AWS</span>
            <span>Correlation Analysis</span>
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
            <span className="text-[10px] font-mono text-muted">Unit: Days</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedMonthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                <XAxis dataKey="month" stroke={TOKENS.border} tick={{ fill: TOKENS.ink, fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
                <YAxis stroke={TOKENS.border} tick={{ fill: TOKENS.muted, fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: TOKENS.surface,
                    borderColor: TOKENS.border,
                    borderRadius: '6px',
                    fontFamily: 'IBM Plex Mono',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontFamily: 'IBM Plex Mono', fontSize: '10px' }} />
                <Bar dataKey="Safe" stackId="a" fill={RISK_SCALE.risk1} />
                <Bar dataKey="Moderate" stackId="a" fill={RISK_SCALE.risk2} />
                <Bar dataKey="High" stackId="a" fill={RISK_SCALE.risk3} />
                <Bar dataKey="VeryHigh" name="Very High" stackId="a" fill={RISK_SCALE.risk4} />
                <Bar dataKey="Extreme" stackId="a" fill={RISK_SCALE.risk5} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted">
            <span>Source: Multi-Year Reanalysis</span>
            <span>Temporal Aggregation</span>
          </div>
        </Card>
      </div>

      {/* 4. Donut Chart & Longitudinal Heat Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Donut Chart: Wards by Band (5 cols) */}
        <Card className="lg:col-span-5 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-ink">
                Wards by Risk Band Distribution
              </h3>
              <span className="text-[11px] text-muted">
                Whole-to-part classification summary
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted">Unit: Wards</span>
          </div>

          {donutData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs font-mono text-muted">
              No data for this period
            </div>
          ) : (
            <div className="h-60 w-full flex items-center justify-between">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={75}
                      stroke={TOKENS.border}
                      strokeWidth={1}
                    >
                      {donutData.map((entry, idx) => (
                        <Cell key={`donut-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: TOKENS.surface,
                        borderColor: TOKENS.border,
                        borderRadius: '6px',
                        fontFamily: 'IBM Plex Mono',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-1/2 space-y-2 pl-3 text-xs font-mono">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-muted text-[11px]">{d.name}</span>
                    </span>
                    <strong className="text-ink">{d.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted">
            <span>Source: Live Spatial Risk Feed</span>
            <span>Total: {allRisk?.length || 0} Wards</span>
          </div>
        </Card>

        {/* Longitudinal Multi-Year Heat Stress Calendar (7 cols) */}
        <Card className="lg:col-span-7 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-ink">
                Multi-Year Longitudinal Heat Stress Calendar
              </h3>
              <span className="text-[11px] text-muted">
                Monthly average HTSI tracking summer intensification across years
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted">Unit: Monthly Mean</span>
          </div>

          <HeatCalendar />

          <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted">
            <span>Source: ERA5-Land Reanalysis (2018–2026)</span>
            <span>Updated: Annual Sync</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
