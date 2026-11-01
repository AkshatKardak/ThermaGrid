import React from 'react';
import { Card } from '../components/common/Card';
import { TrendChart } from '../components/charts/TrendChart';
import { ForecastConfidenceChart } from '../components/charts/ForecastConfidenceChart';
import { DistributionPlot } from '../components/charts/DistributionPlot';
import { useThermalHistory } from '../hooks/useThermal';
import { useRiskForecast } from '../hooks/useForecast';
import { useAllWardsRisk } from '../hooks/useRisk';
import { useWards } from '../hooks/useWards';
import { useAppStore } from '../store/useAppStore';

export const Analytics: React.FC = () => {
  const { selectedCity, selectedLocationId, setSelectedLocationId } = useAppStore();
  const { data: wards } = useWards(selectedCity);
  const { data: history } = useThermalHistory(selectedLocationId, 3);
  const { data: forecast } = useRiskForecast(selectedLocationId, 5);
  const { data: allRisk } = useAllWardsRisk(selectedCity);

  const selectedWard = wards?.find((w) => w.id === selectedLocationId) || wards?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white font-display">
              Thermal Biometeorology & ML Analytics
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[#9B6FD8]/15 text-[#9B6FD8] border border-[#9B6FD8]/30">
              Multi-Index Telemetry
            </span>
          </div>
          <p className="text-xs text-[#8B9AA8] mt-0.5">
            Diurnal curve comparisons, empirical ML risk trajectory, and cross-ward distribution analysis
          </p>
        </div>

        {/* Ward Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="analytics-ward-select" className="text-xs text-[#8B9AA8]">Ward:</label>
          <select
            id="analytics-ward-select"
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(Number(e.target.value))}
            className="bg-[#1F3445] text-white text-xs px-3 py-2 rounded-lg border border-white/10 outline-none cursor-pointer"
          >
            {wards?.map((w) => (
              <option key={w.id} value={w.id}>
                {w.ward_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart 1: Diurnal Thermal Indices Comparison */}
      <Card
        title={`72-Hour Diurnal Index Trajectory (${selectedWard?.ward_name})`}
        subtitle="Comparing ISO 7243 WBGT, Universal Thermal Climate Index (UTCI), and NOAA Heat Index against Dry-Bulb Air Temperature"
      >
        {history?.items ? (
          <TrendChart items={history.items} />
        ) : (
          <div className="h-72 flex items-center justify-center text-xs text-[#8B9AA8]">
            Loading thermal index telemetry...
          </div>
        )}
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 2: ML Forecast with 80% Confidence Band */}
        <Card
          title="Gradient Boosting ML Risk Forecast (with Uncertainty Bounds)"
          subtitle="Trained quantile ensemble predicting future human thermal risk with 80% confidence interval band"
        >
          {forecast?.items ? (
            <ForecastConfidenceChart items={forecast.items} />
          ) : (
            <div className="h-72 flex items-center justify-center text-xs text-[#8B9AA8]">
              Loading machine learning forecast...
            </div>
          )}
        </Card>

        {/* Chart 3: Ward Risk Distribution */}
        <Card
          title={`Metropolitan Ward Risk Comparison (${selectedCity})`}
          subtitle="Spatial distribution of composite thermal risk scores across wards"
        >
          {allRisk ? (
            <DistributionPlot wardsRisk={allRisk} />
          ) : (
            <div className="h-72 flex items-center justify-center text-xs text-[#8B9AA8]">
              Loading cross-ward comparative distribution...
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};
