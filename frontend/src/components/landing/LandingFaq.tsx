import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { Card } from '../ui/Card';

const FAQS = [
  {
    q: 'Where does the data come from?',
    a: 'Data is ingested from India Meteorological Department (IMD) automatic weather stations, ECMWF/ERA5-Land reanalysis, and Census of India 2011 ward demographics. Built-environment boundaries are sourced from open municipal geodata.',
  },
  {
    q: 'How often does it update?',
    a: 'Numerical weather predictions and synoptic station feeds update hourly. Ward risk scores are re-computed every 15 minutes as new meteorological observations arrive.',
  },
  {
    q: 'What is WBGT and why not just temperature?',
    a: 'Dry-bulb temperature only measures air warmth. Wet Bulb Globe Temperature (WBGT, ISO 7243) combines heat, humidity, solar radiation, and wind into the authoritative occupational metric of human heat stress.',
  },
  {
    q: 'Which areas are covered?',
    a: 'Ward-level resolution covers Mumbai (24 municipal wards) with real polygons. State-level and district-level synoptic monitoring is active across all 35 Indian states and union territories.',
  },
  {
    q: "How is my ward's score calculated?",
    a: 'The Human Thermal Stress Index (HTSI 0–100) integrates four components: environmental hazard (WBGT, UTCI), population exposure (density, outdoor workers), demographic vulnerability (elderly, informal housing), and adaptive capacity deficits.',
  },
  {
    q: 'Is this medical advice?',
    a: 'No. ThermaGrid is an environmental and occupational decision-support platform, not clinical medical diagnosis. In case of acute heat stroke symptoms (delirium, cessation of sweating, core temp >40°C), immediately call 108.',
  },
  {
    q: 'How do I get alerts?',
    a: 'Sign up for free in the ThermaGrid portal to receive automated email advisories whenever your selected ward crosses predetermined risk thresholds (e.g., ≥80 HTSI).',
  },
  {
    q: 'Who can access the municipal console?',
    a: 'The Mission Control Authority console is restricted to verified disaster management officials, municipal commissioners, and environmental health officers upon verification.',
  },
];

export const LandingFaq: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div id="faq" className="space-y-3 max-w-3xl mx-auto">
      {FAQS.map((faq, idx) => {
        const isOpen = openIdx === idx;
        return (
          <div
            key={idx}
            className="rounded-[8px] bg-surface border border-border overflow-hidden transition-colors"
          >
            <button
              type="button"
              onClick={() => toggle(idx)}
              className="w-full py-4 px-5 flex items-center justify-between text-left transition-colors hover:bg-raised/60 cursor-pointer"
            >
              <span className="text-sm font-semibold font-display text-ink pr-4">
                {faq.q}
              </span>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-accent shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted shrink-0" />
              )}
            </button>
            {isOpen && (
              <div className="px-5 pb-4 pt-1 text-xs text-muted leading-relaxed border-t border-border/40 font-sans">
                {faq.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
