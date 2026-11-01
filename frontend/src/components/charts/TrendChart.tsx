import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import type { HourlyThermalItem } from '../../types';

interface TrendChartProps {
  items: HourlyThermalItem[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  const data = items.slice(0, 36).map((item) => {
    let hourLabel = item.time;
    try {
      const d = new Date(item.time);
      hourLabel = `${d.getHours().toString().padStart(2, '0')}:00`;
    } catch {
      hourLabel = item.time.slice(11, 16);
    }
    return {
      time: hourLabel,
      WBGT: item.wbgt_c,
      UTCI: item.utci_c,
      'Heat Index': item.heat_index_c,
      'Air Temp': item.temperature_c,
    };
  });

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis
            dataKey="time"
            stroke="#8B9AA8"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke="#8B9AA8"
            fontSize={11}
            unit="°C"
            domain={['dataMin - 2', 'dataMax + 2']}
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
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
          />
          <Line
            type="monotone"
            dataKey="WBGT"
            stroke="#FF704F"
            strokeWidth={2.5}
            dot={false}
            name="WBGT (Work Index)"
          />
          <Line
            type="monotone"
            dataKey="UTCI"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={false}
            name="UTCI (Climate Index)"
          />
          <Line
            type="monotone"
            dataKey="Heat Index"
            stroke="#E8C547"
            strokeWidth={1.5}
            dot={false}
            name="Heat Index (NWS)"
          />
          <Line
            type="monotone"
            dataKey="Air Temp"
            stroke="#8B9AA8"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            name="Air Temp (Dry-Bulb)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
