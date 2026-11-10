import React, { useState } from 'react';
import { Download, RefreshCw, Calendar, TrendingUp, BarChart2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { TrendChart } from '../components/charts/TrendChart';
import { HeatCalendar } from '../components/charts/HeatCalendar';
import { DistributionPlot } from '../components/charts/DistributionPlot';
import { useThermalHistory } from '../hooks/useThermal';
import { useAllWardsRisk } from '../hooks/useRisk';
import { useWards } from '../hooks/useWards';
import { useAppStore } from '../store/useAppStore';
import { getRiskBand } from '../theme/tokens';
import { TYPOGRAPHY } from '../theme/typography';

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

  // Top 6 Wards sorted descending by risk
  const topWards = [...(allRisk || [])]
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 6);

  return (
    <div className="space-y-12">
      {/* 1. Header with Export CSV & "Data As Of" Stamp */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`${TYPOGRAPHY.h1} text-white`}>
              Thermal Biometeorology &amp; Analytics
            </h1>
            <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold uppercase bg-[#8FB3D9]/15 text-[#8FB3D9] border border-[#8FB3D9]/30">
              Synoptic Telemetry
            </span>
          </div>
          <p className={TYPOGRAPHY.bodyL}>
            Historical microclimate trends, non-linear index divergence, and urban heat island correlation analysis for {selectedCity}.
          </p>
        </div>

        {/* Action Controls & Data Timestamp Stamp */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 rounded-[6px] bg-[#0B141B] border border-white/8 text-[11px] font-mono text-[#8B9AA8]">
            Data as of: <span className="text-white font-semibold">{dataTimestamp} UTC</span>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-[#203A45] hover:bg-[#203A45] border border-white/12 text-xs font-mono font-semibold text-white transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#8FB3D9]" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Ward Selector Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-[10px] bg-[#142630]/60 border border-white/8">
        <span className="text-xs font-mono text-[#8B9AA8]">
          Selected Focal Ward: <strong className="text-white">{selectedWard?.ward_name}</strong>
        </span>
        <select
          value={selectedLocationId}
          onChange={(e) => setSelectedLocationId(Number(e.target.value))}
          className="bg-[#0B141B] text-white text-xs font-mono px-3 py-1.5 rounded-[6px] border border-white/10 outline-none cursor-pointer"
        >
          {wards?.map((w) => (
            <option key={w.id} value={w.id}>
              {w.ward_name}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Custom-styled Trend Chart (Area, Threshold Bands, Peak Annotation) */}
      <section className="space-y-4">
        <SectionHeader
          label="MULTI-INDEX DIVERGENCE"
          title={`72-Hour Diurnal Index Trajectory (${selectedWard?.ward_name})`}
          lead="Comparing ISO 7243 WBGT, Universal Thermal Climate Index (UTCI), and NOAA Heat Index against Dry-Bulb Air Temperature. Shaded red zones show dangerous occupational thresholds."
        />
        <Card tier="l1" cornerTicks>
          {history?.items ? (
            <TrendChart items={history.items} height={360} />
          ) : (
            <div className="h-72 flex items-center justify-center text-xs font-mono text-[#8B9AA8]">
              Loading biometeorological trajectory...
            </div>
          )}
        </Card>
      </section>

      {/* 3. Month × Year Heatmap Calendar */}
      <section className="space-y-4">
        <SectionHeader
          label="HISTORICAL CHRONOLOGY"
          title="Multi-Year Synoptic Heat Stress Calendar"
          lead="Longitudinal monthly average Human Thermal Stress Index (HTSI) tracking pre-monsoon heat wave intensification."
        />
        <Card tier="l1">
          <HeatCalendar />
        </Card>
      </section>

      {/* 4. Asymmetric 7/5 Split: Distribution Histogram & Correlation Matrix vs Top Districts Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Distribution Histogram & Correlation Multiples (7 cols) */}
        <div className="lg:col-span-7">
          <Card
            tier="l1"
            title="Ward Vulnerability Distribution & Biophysical Correlations"
            subtitle="Histogram of municipal risk score bins alongside environmental factor correlations"
          >
            {allRisk ? (
              <DistributionPlot wardsRisk={allRisk} />
            ) : (
              <div className="h-60 flex items-center justify-center text-xs font-mono text-[#8B9AA8]">
                Loading cross-ward comparative distribution...
              </div>
            )}
          </Card>
        </div>

        {/* Right: Top Districts Horizontal Sorted Bar (5 cols) */}
        <div className="lg:col-span-5">
          <Card
            tier="l1"
            title="Acute Risk District Priority Ranking"
            subtitle="Top municipal wards sorted by composite human thermal vulnerability"
          >
            <div className="space-y-3 pt-2">
              {topWards.map((w, idx) => {
                const band = getRiskBand(w.risk_score);
                return (
                  <div key={w.location_id} className="space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#5F7183] w-4">#{idx + 1}</span>
                        <span className="font-semibold text-[#D7E0E7] truncate max-w-[180px]">
                          {w.ward_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#8B9AA8] text-[11px]">
                          WBGT {w.wbgt_c.toFixed(1)}°C
                        </span>
                        <span
                          className="font-bold px-1.5 py-0.5 rounded text-[11px] tabular-nums"
                          style={{
                            backgroundColor: `${band.color}20`,
                            color: band.color,
                          }}
                        >
                          {w.risk_score.toFixed(0)}
                        </span>
                      </div>
                    </div>

                    {/* Horizontal Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-[#0B141B] overflow-hidden border border-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${w.risk_score}%`,
                          backgroundColor: band.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
