import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  formatValue?: (val: number) => string;
  onChange: (val: number) => void;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  formatValue,
  onChange,
  className = '',
}) => {
  const displayVal = formatValue
    ? formatValue(value)
    : `${value > 0 ? `+${value}` : value}${unit}`;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono uppercase tracking-wider text-[#8B9AA8]">
          {label}
        </label>
        <span className="text-sm font-mono font-bold text-[#D7E0E7] tabular-nums px-2 py-0.5 rounded bg-[#2F4A5E]/40 border border-white/8">
          {displayVal}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-[#2F4A5E] rounded-lg appearance-none cursor-pointer accent-[#7FA6C9]"
      />

      <div className="flex justify-between text-[10px] font-mono text-[#5F7183]">
        <span>
          {min > 0 ? `+${min}` : min}
          {unit}
        </span>
        <span>
          {max > 0 ? `+${max}` : max}
          {unit}
        </span>
      </div>
    </div>
  );
};
