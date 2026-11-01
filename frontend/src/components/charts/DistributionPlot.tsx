import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import type { RiskCurrent } from '../../types';
import { getRiskBand } from '../../theme/tokens';

interface DistributionPlotProps {
  wardsRisk: RiskCurrent[];
}

export const DistributionPlot: React.FC<DistributionPlotProps> = ({ wardsRisk }) => {
  if (!wardsRisk || wardsRisk.length === 0) return null;

  const data = wardsRisk.map((w) => ({
    name: w.ward_name.replace(/Ward /i, '').split('(')[0].trim(),
    score: w.risk_score,
    band: w.band,
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis
            dataKey="name"
            stroke="#8B9AA8"
            fontSize={11}
            tickLine={false}
            angle={-15}
            textAnchor="end"
          />
          <YAxis
            stroke="#8B9AA8"
            fontSize={11}
            domain={[0, 100]}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#101820',
              borderColor: 'rgba(255,255,255,0.15)',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#D7E0E7',
            }}
          />
          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => {
              const bandDef = getRiskBand(entry.score);
              return <Cell key={`cell-${index}`} fill={bandDef.color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
