import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { HourlyRiskForecastItem } from '../../types';

interface ForecastConfidenceChartProps {
  items: HourlyRiskForecastItem[];
}

export const ForecastConfidenceChart: React.FC<ForecastConfidenceChartProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  const data = items.slice(0, 48).map((item) => {
    let label = item.time;
    try {
      const d = new Date(item.time);
      label = `${d.getDate()}th ${d.getHours().toString().padStart(2, '0')}:00`;
    } catch {
      label = item.time.slice(8, 16);
    }
    return {
      time: label,
      risk: item.predicted_risk_score,
      lower: item.lower_bound,
      upper: item.upper_bound,
      confidenceBand: [item.lower_bound, item.upper_bound],
    };
  });

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#CFC8B8" />
          <XAxis
            dataKey="time"
            stroke="#5E645F"
            fontSize={10}
            tickLine={false}
          />
          <YAxis
            dataKey="risk"
            stroke="#5E645F"
            fontSize={11}
            domain={[0, 100]}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FBF9F4',
              borderColor: '#CFC8B8',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#1A1E1C',
            }}
          />
          {/* Shaded 80% Confidence Interval Band */}
          <Area
            type="monotone"
            dataKey="confidenceBand"
            stroke="none"
            fill="#FF704F"
            fillOpacity={0.15}
            name="80% Confidence Band"
          />
          {/* Median Model Trajectory */}
          <Line
            type="monotone"
            dataKey="risk"
            stroke="#FF704F"
            strokeWidth={2}
            dot={false}
            name="Predicted Risk Score"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
