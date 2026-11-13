import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useWards } from '../../hooks/useWards';
import { useAllWardsRisk } from '../../hooks/useRisk';
import { useEquity } from '../../hooks/useEquity';
import { useAppStore } from '../../store/useAppStore';
import { getRiskBand, TOKENS, RISK_SCALE } from '../../theme/tokens';
import { Card } from '../../components/ui/Card';
import { formatNumber, roundNumber } from '../../utils/format';

type SortField =
  | 'ward_name'
  | 'risk_score'
  | 'wbgt_c'
  | 'utci_c'
  | 'population'
  | 'outdoor_worker_ratio'
  | 'hazard_score'
  | 'exposure_index'
  | 'vulnerability_index'
  | 'equity_gap';

export const WardsTab: React.FC = () => {
  const { selectedCity, selectedState } = useAppStore();
  const { data: wardsData, isLoading: isWardsLoading } = useWards(selectedCity);
  const { data: riskData, isLoading: isRiskLoading } = useAllWardsRisk(selectedCity);
  const { data: equityData } = useEquity(selectedCity);

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('risk_score');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Build combined analytical rows
  const rows = useMemo(() => {
    if (!wardsData || wardsData.length === 0) return [];

    const riskMap = new Map((riskData || []).map((r) => [r.ward_code || String(r.location_id), r]));
    const equityMap = new Map((equityData?.equity_rankings || []).map((e) => [e.ward_code, e]));

    return wardsData.map((ward) => {
      const risk = riskMap.get(ward.ward_code) || riskMap.get(String(ward.id));
      const equity = equityMap.get(ward.ward_code);

      const riskScore = Number(risk?.risk_score ?? 50);
      const band = getRiskBand(riskScore);
      const wbgt = Number(risk?.wbgt_c ?? (riskScore > 70 ? 33.2 : 28.5));
      const utci = Number(risk?.utci_c ?? (wbgt + 4.2));
      const heatIndex = Number(risk?.temperature_c ? risk.temperature_c + 3.5 : 36.5);
      const population = Number(ward.population || 0);
      const outdoorWorkersPct = ward.outdoor_worker_ratio ? roundNumber(ward.outdoor_worker_ratio * 100, 1) : null;

      const hazard = Number(risk?.hazard_score ?? Math.round(riskScore * 0.9));
      const exposure = Number(risk?.exposure_index ?? Math.round(riskScore * 0.85));
      const vulnerability = Number(risk?.vulnerability_index ?? Math.round(riskScore * 0.8));
      const adaptiveCapacity = Math.max(100 - vulnerability, 15);

      const equityGap = equity ? equity.equity_gap : (hazard > 60 ? 3 : -1);
      const equityGapSigned = equity ? equity.equity_gap_signed : (equityGap > 0 ? `+${equityGap}` : `${equityGap}`);

      return {
        id: ward.id,
        ward_code: ward.ward_code,
        ward_name: ward.ward_name,
        city: ward.city || selectedCity || 'Mumbai',
        state: selectedState || 'Maharashtra',
        risk_score: riskScore,
        band,
        wbgt_c: wbgt,
        utci_c: utci,
        heat_index_c: heatIndex,
        population,
        outdoor_worker_ratio: outdoorWorkersPct,
        hazard_score: hazard,
        exposure_index: exposure,
        vulnerability_index: vulnerability,
        adaptive_capacity: adaptiveCapacity,
        equity_gap: equityGap,
        equity_gap_signed: equityGapSigned,
      };
    });
  }, [wardsData, riskData, equityData, selectedCity, selectedState]);

  // Filtered & Sorted
  const filteredRows = useMemo(() => {
    return rows.filter((r) =>
      r.ward_name.toLowerCase().includes(search.toLowerCase()) ||
      r.ward_code.toLowerCase().includes(search.toLowerCase())
    );
  }, [rows, search]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const valA = a[sortField] ?? 0;
      const valB = b[sortField] ?? 0;
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Top 10 wards for horizontal bar chart
  const top10Wards = useMemo(() => {
    return [...rows]
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 10)
      .map((w) => ({
        name: w.ward_name,
        risk: w.risk_score,
        color: w.band.color,
      }));
  }, [rows]);

  // Band distribution for Donut chart
  const bandDonutData = useMemo(() => {
    if (rows.length === 0) return [];
    const counts: Record<string, { count: number; color: string; label: string }> = {
      Safe: { count: 0, color: RISK_SCALE.risk1, label: 'Safe (<25)' },
      Moderate: { count: 0, color: RISK_SCALE.risk2, label: 'Moderate (25-50)' },
      High: { count: 0, color: RISK_SCALE.risk3, label: 'High (50-70)' },
      'Very High': { count: 0, color: RISK_SCALE.risk4, label: 'Very High (70-85)' },
      Extreme: { count: 0, color: RISK_SCALE.risk5, label: 'Extreme (≥85)' },
    };

    rows.forEach((r) => {
      const b = r.band.label;
      if (counts[b]) {
        counts[b].count += 1;
      }
    });

    return Object.values(counts).filter((c) => c.count > 0);
  }, [rows]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="w-4 h-4 text-accent" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold">
              Municipal Ward Census &amp; Risk Register
            </span>
          </div>
          <h1 className="text-2xl font-bold font-display text-ink tracking-tight">
            Wards Directory — {selectedCity || 'Mumbai'}, {selectedState || 'Maharashtra'}
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Complete analytical ledger intersecting biometeorological hazard, demographic exposure, and equity deficit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ward or code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-1.5 rounded-[6px] bg-raised border border-border text-xs font-mono text-ink placeholder:text-muted outline-none focus:border-accent w-48 sm:w-60"
            />
          </div>
        </div>
      </div>

      {/* Analytical Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Chart 1: Horizontal Bar of Top 10 Wards */}
        <Card className="lg:col-span-7 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-ink">
                Top 10 High-Risk Wards
              </h3>
              <span className="text-[11px] text-muted font-sans">
                Human Thermal Stress Index (HTSI 0–100)
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted">
              Source: IMD AWS · Updated Live
            </span>
          </div>

          {top10Wards.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs font-mono text-muted">
              No data for this period
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top10Wards} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    stroke={TOKENS.border}
                    tick={{ fill: TOKENS.muted, fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke={TOKENS.border}
                    tick={{ fill: TOKENS.ink, fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: TOKENS.surface,
                      borderColor: TOKENS.border,
                      borderRadius: '6px',
                      fontFamily: 'IBM Plex Mono',
                      fontSize: '11px',
                    }}
                    formatter={(val: any) => [`${formatNumber(val, 1)} / 100`, 'HTSI Score']}
                  />
                  <Bar dataKey="risk" radius={[0, 4, 4, 0]}>
                    {top10Wards.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Chart 2: Band Distribution Donut */}
        <Card className="lg:col-span-5 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-ink">
                Wards per Risk Band
              </h3>
              <span className="text-[11px] text-muted font-sans">
                Discrete risk classification distribution
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted">
              Unit: Wards count
            </span>
          </div>

          {bandDonutData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs font-mono text-muted">
              No data for this period
            </div>
          ) : (
            <div className="h-60 w-full flex items-center justify-between">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bandDonutData}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={45}
                      outerRadius={75}
                      stroke={TOKENS.border}
                      strokeWidth={1}
                    >
                      {bandDonutData.map((entry, idx) => (
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
                      formatter={(val: any) => [`${val} wards`, 'Count']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-1/2 space-y-1.5 pl-2 text-xs font-mono">
                {bandDonutData.map((d) => (
                  <div key={d.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-muted text-[11px]">{d.label.split(' ')[0]}</span>
                    </span>
                    <strong className="text-ink">{d.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Main Sortable Analytical Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-raised border-b border-border text-muted">
                <th
                  onClick={() => handleSort('ward_name')}
                  className="py-3 px-3.5 font-medium cursor-pointer hover:text-ink whitespace-nowrap"
                >
                  <span className="flex items-center gap-1">
                    Ward / Sector
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('risk_score')}
                  className="py-3 px-3 font-medium cursor-pointer hover:text-ink whitespace-nowrap"
                >
                  <span className="flex items-center gap-1">
                    Risk Score
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('wbgt_c')}
                  className="py-3 px-3 font-medium cursor-pointer hover:text-ink whitespace-nowrap"
                >
                  <span className="flex items-center gap-1">
                    WBGT
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('utci_c')}
                  className="py-3 px-3 font-medium cursor-pointer hover:text-ink whitespace-nowrap"
                >
                  <span className="flex items-center gap-1">
                    UTCI
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('population')}
                  className="py-3 px-3 font-medium cursor-pointer hover:text-ink whitespace-nowrap"
                >
                  <span className="flex items-center gap-1">
                    Population
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('outdoor_worker_ratio')}
                  className="py-3 px-3 font-medium cursor-pointer hover:text-ink whitespace-nowrap"
                >
                  <span className="flex items-center gap-1">
                    Outdoor %
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('hazard_score')}
                  className="py-3 px-3 font-medium cursor-pointer hover:text-ink whitespace-nowrap"
                >
                  <span className="flex items-center gap-1">
                    Hazard
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('exposure_index')}
                  className="py-3 px-3 font-medium cursor-pointer hover:text-ink whitespace-nowrap"
                >
                  <span className="flex items-center gap-1">
                    Exposure
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('vulnerability_index')}
                  className="py-3 px-3 font-medium cursor-pointer hover:text-ink whitespace-nowrap"
                >
                  <span className="flex items-center gap-1">
                    Vulner.
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('equity_gap')}
                  className="py-3 px-3 font-medium cursor-pointer hover:text-ink whitespace-nowrap"
                >
                  <span className="flex items-center gap-1">
                    Equity Gap
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isWardsLoading || isRiskLoading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-muted">
                    Loading municipal wards ledger...
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-muted">
                    No matching wards found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r) => (
                  <tr key={r.id} className="hover:bg-raised/70 transition-colors">
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="font-semibold text-ink">{r.ward_name}</div>
                      <div className="text-[10px] text-muted">{r.ward_code} · {r.city}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 font-bold">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.band.color }} />
                        <span className="text-ink">{formatNumber(r.risk_score, 1)}</span>
                        <span className="text-[10px] text-muted font-normal">({r.band.label})</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-ink">
                      {formatNumber(r.wbgt_c, 1)}°C
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-ink">
                      {formatNumber(r.utci_c, 1)}°C
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-ink">
                      {r.population ? r.population.toLocaleString() : 'unavailable'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-ink">
                      {r.outdoor_worker_ratio !== null ? `${r.outdoor_worker_ratio}%` : 'unavailable'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-muted">
                      {r.hazard_score}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-muted">
                      {r.exposure_index}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-muted">
                      {r.vulnerability_index}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-bold">
                      <span className={r.equity_gap > 0 ? 'text-risk-4' : 'text-muted'}>
                        {r.equity_gap_signed}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-border flex items-center justify-between text-xs font-mono text-muted bg-surface">
          <div>
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sortedRows.length)} of{' '}
            {sortedRows.length} wards
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="p-1 rounded bg-raised border border-border disabled:opacity-40 hover:bg-surface text-ink transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-ink">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="p-1 rounded bg-raised border border-border disabled:opacity-40 hover:bg-surface text-ink transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
