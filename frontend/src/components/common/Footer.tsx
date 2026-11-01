import React from 'react';
import { ShieldCheck, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-white/10 bg-[#101820] text-[#8B9AA8] text-xs py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="md:col-span-2 space-y-2">
            <h4 className="text-sm font-bold text-[#D7E0E7] font-display">
              ThermaGrid
            </h4>
            <p className="max-w-md text-xs leading-relaxed">
              Hyperlocal human thermal-stress early-warning & decision-support system
              (Ministry of Earth Sciences / NCMRWF). Composes physics-calibrated thermal indices (WBGT, UTCI, Heat Index)
              with ward-level vulnerability and exposure data.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] text-[#2FA37C]">
              <ShieldCheck className="w-4 h-4" />
              <span>Aligned with NDMA National Heat Action Plan Guidelines (2020)</span>
            </div>
          </div>

          <div>
            <h5 className="font-semibold text-[#D7E0E7] mb-2 font-display">Authoritative Sources</h5>
            <ul className="space-y-1.5 text-xs">
              <li>
                <a href="https://mausam.imd.gov.in" target="_blank" rel="noreferrer" className="hover:text-[#9B6FD8] flex items-center gap-1">
                  IMD MoES Network <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://bhuvan.nrsc.gov.in" target="_blank" rel="noreferrer" className="hover:text-[#9B6FD8] flex items-center gap-1">
                  ISRO Bhuvan Remote Sensing <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://open-meteo.com" target="_blank" rel="noreferrer" className="hover:text-[#9B6FD8] flex items-center gap-1">
                  Open-Meteo ECMWF/GFS <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-[#D7E0E7] mb-2 font-display">Public Health Notice</h5>
            <p className="text-[11px] leading-relaxed text-[#8B9AA8]">
              Non-medical advisory platform. Outputs represent relative environmental vulnerability grading,
              not clinical diagnoses. For medical heat emergencies or heat stroke, immediately contact emergency medical services (108).
            </p>
          </div>

        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>
            © {new Date().getFullYear()} ThermaGrid Platform. Free & Open Source under MIT License.
          </div>
          <div className="font-mono text-[#D7E0E7]/60">
            Pipeline: Data → Thermal Stress → Analytics → Forecast → Risk → Action
          </div>
        </div>
      </div>
    </footer>
  );
};
