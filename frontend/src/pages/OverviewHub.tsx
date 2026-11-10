import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useCurrentRisk, useAllWardsRisk } from '../hooks/useRisk';
import { useWardDetails, useWards } from '../hooks/useWards';
import { useRiskForecast } from '../hooks/useForecast';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { HourlyStrip } from '../components/risk/HourlyStrip';
import { TonightCard } from '../components/risk/TonightCard';
import { IndoorHeatCard } from '../components/risk/IndoorHeatCard';
import { CareCircleStrip } from '../components/care/CareCircleStrip';
import { getRiskBand } from '../theme/tokens';

export const OverviewHub: React.FC = () => {
  const { selectedCity, selectedLocationId, setSelectedLocationId } = useAppStore();

  const activeId = selectedLocationId || 1;
  const { data: ward } = useWardDetails(activeId);
  const { data: risk } = useCurrentRisk(activeId);
  const { data: forecast } = useRiskForecast(activeId);
  const { data: allWardsRisk } = useAllWardsRisk(selectedCity);
  const { data: wardsList } = useWards(selectedCity);
  const { data: subscriptions } = useSubscriptions();

  const riskScore = Math.round(risk?.risk_score ?? 68);
  const bandDef = getRiskBand(riskScore);

  // Compute peak thermal window from hourly forecast
  const peakWindow = React.useMemo(() => {
    if (!forecast?.items || forecast.items.length === 0) return '12:00 – 16:30';
    const items = forecast.items.slice(0, 24);
    let peak = items[0];
    for (const it of items) {
      if (it.predicted_risk_score > peak.predicted_risk_score) peak = it;
    }
    try {
      const d = new Date(peak.time);
      const startH = d.getHours();
      const sStr = `${String(startH).padStart(2, '0')}:00`;
      const eStr = `${String(Math.min(23, startH + 3)).padStart(2, '0')}:30`;
      return `${sStr} – ${eStr}`;
    } catch {
      return '13:00 – 16:30';
    }
  }, [forecast]);

  const populationExposed = React.useMemo(() => {
    return (ward?.population || 845000).toLocaleString();
  }, [ward]);

  // Combine risk telemetry with demographic workers
  const wardsTableData = React.useMemo(() => {
    const riskMap = new Map((allWardsRisk || []).map((r) => [r.location_id, r]));
    const baseWards = wardsList && wardsList.length > 0 ? wardsList : [];

    if (baseWards.length === 0 && allWardsRisk && allWardsRisk.length > 0) {
      return allWardsRisk.map((r) => {
        const band = getRiskBand(r.risk_score);
        return {
          id: r.location_id,
          name: r.ward_name,
          score: Math.round(r.risk_score),
          bandLabel: band.label,
          bandColor: band.color,
          bandCode: band.code,
          wbgt: r.wbgt_c,
          workers: Math.round((r.population || 450000) * 0.28),
        };
      });
    }

    return baseWards.map((w) => {
      const r = riskMap.get(w.id);
      const score = Math.round(r?.risk_score ?? 54);
      const band = getRiskBand(score);
      const wbgt = r?.wbgt_c ?? 26.8;
      const workers = Math.round(w.population * (w.outdoor_worker_ratio || 0.25));
      return {
        id: w.id,
        name: w.ward_name,
        score,
        bandLabel: band.label,
        bandColor: band.color,
        bandCode: band.code,
        wbgt,
        workers,
      };
    }).sort((a, b) => b.score - a.score);
  }, [allWardsRisk, wardsList]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Context Bar: Location & Quick Links (Zero icons) */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-ink tracking-tight">
            {ward?.ward_name || 'Ward M/East'} · {selectedCity}
          </h1>
          <span className="text-xs font-mono text-muted mt-0.5 block">
            Hyperlocal human thermal stress and ward-level biometeorological telemetry
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/app/account"
            className="px-3.5 py-1.5 rounded-[8px] bg-surface hover:bg-raised border border-border text-xs font-mono text-ink transition-colors"
          >
            Alert Subscriptions ({subscriptions?.length || 0})
          </Link>
          <Link
            to="/app/heat-risk"
            className="px-3.5 py-1.5 rounded-[8px] bg-accent hover:bg-accent-hover text-on-accent text-xs font-mono font-bold transition-all"
          >
            Safe Windows
          </Link>
        </div>
      </div>

      {/* Row 1 — Headline Numbers (Three large tabular numerals only, no icons, no cards-with-icons, one hairline under) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 pb-8 border-b border-border">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-mono font-bold tracking-tight tabular-nums text-ink">
              {riskScore}
            </span>
            <span className="w-3 h-3 rounded-full self-center" style={{ backgroundColor: bandDef.color }} />
            <span className="text-xl font-mono text-muted tabular-nums">/100</span>
          </div>
          <span className="text-xs font-mono text-muted uppercase tracking-wider block mt-1.5">
            Current Risk Index · {bandDef.label}
          </span>
        </div>

        <div>
          <span className="text-4xl sm:text-5xl font-mono font-bold text-ink tracking-tight tabular-nums block">
            {peakWindow}
          </span>
          <span className="text-xs font-mono text-muted uppercase tracking-wider block mt-1.5">
            Diurnal Peak Thermal Window
          </span>
        </div>

        <div>
          <span className="text-4xl sm:text-5xl font-mono font-bold text-ink tracking-tight tabular-nums block">
            {populationExposed}
          </span>
          <span className="text-xs font-mono text-muted uppercase tracking-wider block mt-1.5">
            Ward Population Exposed
          </span>
        </div>
      </div>

      {/* Row 2 — The Day: Single 24-hour risk strip at full width (Page's centre of gravity) */}
      <div className="pb-8 border-b border-border">
        <HourlyStrip items={forecast?.items || []} />
      </div>

      {/* Row 3 — Table: "Wards at risk" (Real table, 32px rows, hairline dividers, right-aligned tabular numerals) */}
      <div className="space-y-3 pb-8 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-muted">
            Wards at Risk ({selectedCity})
          </span>
          <span className="text-[11px] font-mono text-muted">
            Sorted by physiological thermal risk
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="h-8 border-b border-border text-[11px] font-mono uppercase text-muted">
                <th className="font-medium pl-1">Ward</th>
                <th className="font-medium text-right pr-6">Risk Score</th>
                <th className="font-medium pr-6">Severity Band</th>
                <th className="font-medium text-right pr-6">Peak ISO WBGT</th>
                <th className="font-medium text-right pr-2">Outdoor Workers</th>
              </tr>
            </thead>
            <tbody>
              {wardsTableData.map((w) => {
                const isSelected = w.id === activeId;
                return (
                  <tr
                    key={w.id}
                    onClick={() => setSelectedLocationId(w.id)}
                    className={`h-8 border-b border-border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-surface text-ink font-medium'
                        : 'hover:bg-raised text-ink'
                    }`}
                  >
                    <td className="pl-1">
                      <span className="truncate block max-w-[200px]">{w.name}</span>
                    </td>
                    <td className="text-right pr-6 font-mono tabular-nums font-bold text-ink">
                      {w.score}
                    </td>
                    <td className="pr-6">
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: w.bandColor }} />
                        <span className={w.bandCode === 'extreme' ? 'text-risk-5 font-bold' : 'text-ink'}>
                          {w.bandLabel}
                        </span>
                      </span>
                    </td>
                    <td className="text-right pr-6 font-mono tabular-nums text-ink">
                      {w.wbgt.toFixed(1)}°C
                    </td>
                    <td className="text-right pr-2 font-mono tabular-nums text-muted">
                      {w.workers.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4 — Two Columns (Left: Tonight + Indoor cards; Right: Subscriptions + Care Circle) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Tonight + Indoor Cards */}
        <div className="space-y-6">
          <TonightCard locationId={activeId} />
          <IndoorHeatCard locationId={activeId} />
        </div>

        {/* Right Column: Subscriptions + Care Circle */}
        <div className="space-y-6">
          <div className="p-6 rounded-[14px] bg-surface border border-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-ink font-display">Active Subscriptions</h3>
                <p className="text-xs text-muted mt-0.5">
                  Automated dispatch threshold: <strong className="text-ink font-mono">≥ 80 Risk Index</strong>
                </p>
              </div>
              <Link
                to="/app/account"
                className="text-xs font-mono text-accent hover:underline"
              >
                Configure →
              </Link>
            </div>

            {subscriptions && subscriptions.length > 0 ? (
              <div className="space-y-2">
                {subscriptions.slice(0, 3).map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-3 rounded-[8px] bg-raised border border-border text-xs font-mono"
                  >
                    <div>
                      <span className="text-ink font-medium">{sub.ward_name || (sub.ward_id ? `Ward #${sub.ward_id}` : 'Active Ward')}</span>
                      <span className="text-muted ml-2 uppercase text-[10px]">{sub.channel}</span>
                    </div>
                    <span className="text-ink font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-risk-1" />
                      Active
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-[8px] bg-raised border border-border text-xs text-muted flex items-center justify-between">
                <span>No live alerts configured for your profile.</span>
                <Link
                  to="/app/account"
                  className="text-xs font-mono text-accent hover:underline"
                >
                  Enable alerts
                </Link>
              </div>
            )}
          </div>

          <CareCircleStrip />
        </div>
      </div>
    </div>
  );
};
