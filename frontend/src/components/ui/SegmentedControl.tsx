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
      className={`inline-flex p-1 rounded-[6px] bg-surface border border-border ${className}`}
      role="group"
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-[4px] text-xs font-mono transition-all duration-150 flex flex-col items-center justify-center ${
              isSelected
                ? 'bg-raised text-ink border border-border font-medium'
                : 'text-muted hover:text-ink hover:bg-bg border border-transparent'
            }`}
          >
            <span>{opt.label}</span>
            {opt.sublabel && (
              <span className="text-[10px] text-muted mt-0.5">{opt.sublabel}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
