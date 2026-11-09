import React from 'react';

export interface SegmentOption<T extends string | number> {
  value: T;
  label: string;
  sublabel?: string;
}

interface SegmentedControlProps<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`inline-flex p-1 rounded-[8px] bg-[#203A45]/40 border border-white/8 ${className}`}
      role="group"
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-mono transition-all duration-150 flex flex-col items-center justify-center ${
              isSelected
                ? 'bg-[#142630] text-[#D7E0E7] shadow-sm border border-white/12 [box-shadow:inset_0_1px_0_rgba(143, 179, 217,0.3)]'
                : 'text-[#8B9AA8] hover:text-[#D7E0E7] hover:bg-white/5 border border-transparent'
            }`}
          >
            <span className="font-medium">{opt.label}</span>
            {opt.sublabel && (
              <span className="text-[10px] text-[#5F7183] mt-0.5">{opt.sublabel}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
