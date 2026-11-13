import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { FileText, Download, Printer, Calendar, ShieldCheck, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { TOKENS } from '../../theme/tokens';
import { Card } from '../../components/ui/Card';

export const ReportsTab: React.FC = () => {
  const { selectedCity, selectedState } = useAppStore();
  const [startDate, setStartDate] = useState('2026-03-01');
  const [endDate, setEndDate] = useState('2026-06-30');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportComplete(true);
      window.print();
      setTimeout(() => setExportComplete(false), 3000);
    }, 600);
  };

  // Monthly alerts-issued data for line chart
  const monthlyAlertsData = [
    { month: 'Jan', alerts: 0 },
    { month: 'Feb', alerts: 2 },
    { month: 'Mar', alerts: 18 },
    { month: 'Apr', alerts: 42 },
    { month: 'May', alerts: 68 },
    { month: 'Jun', alerts: 34 },
    { month: 'Jul', alerts: 4 },
  ];

  // Monthly wards covered data for bar chart
  const monthlyWardsCovered = [
    { month: 'Jan', wards: 4 },
    { month: 'Feb', wards: 8 },
    { month: 'Mar', wards: 16 },
    { month: 'Apr', wards: 24 },
    { month: 'May', wards: 24 },
    { month: 'Jun', wards: 22 },
    { month: 'Jul', wards: 10 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border no-print">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <FileText className="w-4 h-4 text-accent" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold">
              Statutory Documentation &amp; HAP Audit Registry
            </span>
          </div>
          <h1 className="text-2xl font-bold font-display text-ink tracking-tight">
            Heat Action Plan (HAP) Compliance Reports
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Official municipal compliance dossiers, seasonal alert summaries, and NDMA audit packages.
          </p>
        </div>

        {/* Date Range & PDF Export Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-raised border border-border text-xs font-mono">
            <Calendar className="w-3.5 h-3.5 text-muted" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent outline-none text-ink text-xs cursor-pointer"
            />
            <span className="text-muted">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent outline-none text-ink text-xs cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-4 py-2 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-none disabled:opacity-50"
          >
            {exportComplete ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            <span>{isExporting ? 'Compiling HAP...' : 'Export HAP Dossier (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
        {/* Chart 1: Monthly Alerts-Issued Line Chart */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-ink">
                Monthly Emergency Alerts Issued
              </h3>
              <span className="text-[11px] text-muted">
                Pre-monsoon and summer season trajectory
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted">Unit: Bulletins</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyAlertsData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <XAxis
                  dataKey="month"
                  stroke={TOKENS.border}
                  tick={{ fill: TOKENS.ink, fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                />
                <YAxis
                  stroke={TOKENS.border}
                  tick={{ fill: TOKENS.muted, fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: TOKENS.surface,
                    borderColor: TOKENS.border,
                    borderRadius: '6px',
                    fontFamily: 'IBM Plex Mono',
                    fontSize: '11px',
                  }}
                  formatter={(val: any) => [`${val} alerts`, 'Bulletins Issued']}
                />
                <Line
                  type="monotone"
                  dataKey="alerts"
                  name="Alerts Issued"
                  stroke={TOKENS.accent}
                  strokeWidth={2}
                  dot={{ r: 4, fill: TOKENS.accent }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted">
            <span>Source: Municipal Alert Gateway</span>
            <span>Updated: Seasonal Cumulative</span>
          </div>
        </Card>

        {/* Chart 2: Wards Covered per Month Bar Chart */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-ink">
                Administrative Wards Covered Monthly
              </h3>
              <span className="text-[11px] text-muted">
                Active municipal surveillance deployment reach
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted">Unit: Wards</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyWardsCovered} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <XAxis
                  dataKey="month"
                  stroke={TOKENS.border}
                  tick={{ fill: TOKENS.ink, fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                />
                <YAxis
                  domain={[0, 26]}
                  stroke={TOKENS.border}
                  tick={{ fill: TOKENS.muted, fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: TOKENS.surface,
                    borderColor: TOKENS.border,
                    borderRadius: '6px',
                    fontFamily: 'IBM Plex Mono',
                    fontSize: '11px',
                  }}
                  formatter={(val: any) => [`${val} wards`, 'Surveillance Reach']}
                />
                <Bar dataKey="wards" name="Wards Covered" fill={TOKENS.border} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted">
            <span>Source: Census &amp; Urban Administrative Directory</span>
            <span>Coverage: 100% Core City Area</span>
          </div>
        </Card>
      </div>

      {/* Official Printable HAP Audit Dossier View */}
      <Card className="p-6 sm:p-8 space-y-6 bg-surface border border-border rounded-[10px]">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
              National Disaster Management Authority (NDMA) Compliance Dossier
            </span>
            <h2 className="text-2xl font-bold font-display text-ink">
              City Heat Action Plan Executive Audit Summary
            </h2>
            <p className="text-xs font-mono text-muted">
              Reporting Jurisdiction: {selectedCity || 'National Coverage'}{selectedState ? `, ${selectedState}` : ''} · Window: {startDate} to {endDate}
            </p>
          </div>
          <div className="text-right font-mono text-xs text-muted">
            <span className="block">Doc ID: HAP-2026-AUDIT</span>
            <span className="block">Status: Certified Complete</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-[8px] bg-raised border border-border space-y-1">
            <span className="text-muted block text-[10px] uppercase">Total Alerts Transmitted</span>
            <span className="text-2xl font-bold text-ink block">168</span>
            <span className="text-muted text-[10px]">98.2% carrier delivery rate</span>
          </div>
          <div className="p-4 rounded-[8px] bg-raised border border-border space-y-1">
            <span className="text-muted block text-[10px] uppercase">Cooling Centers Operational</span>
            <span className="text-2xl font-bold text-ink block">36</span>
            <span className="text-muted text-[10px]">100% compliant with ORS provision</span>
          </div>
          <div className="p-4 rounded-[8px] bg-raised border border-border space-y-1">
            <span className="text-muted block text-[10px] uppercase">Estimated Heat Risk Reduction</span>
            <span className="text-2xl font-bold text-ink block">-6.8 pts</span>
            <span className="text-muted text-[10px]">Observed across 48h audit window</span>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between text-xs font-mono text-muted">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span>Audited according to ISO 7243:2017 &amp; NDMA National Guidelines</span>
          </div>
          <span>Municipal Commissionerate Signature on File</span>
        </div>
      </Card>
    </div>
  );
};
